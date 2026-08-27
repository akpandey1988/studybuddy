// StudyBuddy backend.
//
// The student's knowledge graph lives in Firestore; these functions build it
// from the syllabus, decide what to study next, teach it, and grade it.
// Mastery is only ever written here — never by the client.

import { initializeApp } from 'firebase-admin/app';
import { defineBoolean } from 'firebase-functions/params';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { QuotaError, consumeQuota, refundQuota } from './quota.js';
import { ANTHROPIC_API_KEY } from './claude.js';
import { CHECK_PASS, CHECK_SIZE, generateQuestions, grade } from './check.js';
import { buildConceptGraph } from './graph.js';
import { applyAttempt } from './mastery.js';
import { planNextStep } from './plan.js';
import {
  db, getExam, getNode, getNodes, getThread as getThread_, recordAttemptDoc,
  setExam, setThread, updateProgress, writeGraph,
} from './store.js';
import { handleTutor } from './tutor.js';
import type { PracticeQuestion } from './check.js';

initializeApp();

const REGION = 'asia-south1'; // Mumbai — the students are in India.

// Origins allowed to call the callables from a browser. The Expo web build and
// the dev server need this; native builds are not subject to CORS. Without it
// the browser's preflight gets no Access-Control-Allow-Origin and every call
// fails before it reaches the function.
const CORS_ORIGINS: (string | RegExp)[] = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  'https://studybuddy-nexora.web.app',
  'https://studybuddy-nexora.firebaseapp.com',
];

// App Check attests that a request came from a genuine build of the app. It
// needs per-platform provider config (reCAPTCHA on web, App Attest / Play
// Integrity on device), so enforcement is a deploy-time switch rather than
// hardcoded: turn it on once the client is registered. See README.
const ENFORCE_APP_CHECK = defineBoolean('ENFORCE_APP_CHECK', { default: false });

// Concurrency caps. Every one of these can reach Claude, so an unbounded fan
// out is an unbounded bill. Gen 2 serves up to 80 requests per instance, so
// these are generous for real traffic while still being a hard ceiling.
const callable = {
  region: REGION,
  cors: CORS_ORIGINS,
  enforceAppCheck: ENFORCE_APP_CHECK,
  maxInstances: 10,
};
const common = { ...callable, secrets: [ANTHROPIC_API_KEY] };

// onRequest has no declarative App Check option, so the tutor endpoint gets
// its own option set; handleTutor verifies the caller's ID token itself.
const request = {
  region: REGION,
  cors: CORS_ORIGINS,
  secrets: [ANTHROPIC_API_KEY],
  maxInstances: 8,
};

/** Turn a quota rejection into the right error for a callable. */
function quotaToHttps(err: unknown): never {
  if (err instanceof QuotaError) throw new HttpsError('resource-exhausted', err.message);
  throw err;
}

function requireUid(auth: { uid: string } | undefined): string {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  return auth.uid;
}

/**
 * Read a syllabus into a prerequisite graph and store it against the exam.
 * Slow (a big reasoning call), so it gets a long timeout and plenty of memory.
 */
export const buildGraph = onCall(
  // The most expensive call in the product: long, high effort, whole syllabus.
  // Keep the ceiling low — real demand is one call per exam, ever.
  { ...common, timeoutSeconds: 540, memory: '1GiB', maxInstances: 3 },
  async (req) => {
    const uid = requireUid(req.auth);
    const { examId, subject, syllabus, examDate, grade: g, board, attachment } = req.data ?? {};
    if (!examId || !subject) {
      throw new HttpsError('invalid-argument', 'examId and subject are required.');
    }
    // Either typed text or a file — one of them has to carry the syllabus.
    if (!String(syllabus ?? '').trim() && !attachment) {
      throw new HttpsError('invalid-argument', 'Provide syllabus text or a file.');
    }
    if (attachment) {
      const { kind, mediaType, data } = attachment;
      if ((kind !== 'image' && kind !== 'pdf') || typeof data !== 'string' || !data) {
        throw new HttpsError('invalid-argument', 'Malformed attachment.');
      }
      // Guard the payload server-side too — the client limit is a courtesy,
      // not a control.
      if (data.length > 9_000_000) {
        throw new HttpsError('invalid-argument', 'That file is too large. Try a photo of just the syllabus pages.');
      }
      if (typeof mediaType !== 'string') {
        throw new HttpsError('invalid-argument', 'Malformed attachment.');
      }
    }
    // Reserve before doing any work, so concurrent calls cannot both start.
    await consumeQuota(uid, 'graph').catch(quotaToHttps);

    await setExam(uid, examId, {
      subject,
      examDate: Number(examDate) || Date.now() + 30 * 86_400_000,
      grade: g ?? null,
      board: board ?? null,
      graphStatus: 'pending',
      conceptCount: 0,
    });

    try {
      const concepts = await buildConceptGraph({
        subject,
        grade: g ?? null,
        board: board ?? null,
        syllabus: String(syllabus ?? ''),
        attachment,
      });
      await writeGraph(uid, examId, concepts);
      await setExam(uid, examId, { graphStatus: 'ready', conceptCount: concepts.length });
      return { conceptCount: concepts.length, concepts };
    } catch (err) {
      // Nothing usable was produced, so don't charge them for the attempt.
      await Promise.all([
        setExam(uid, examId, { graphStatus: 'failed' }),
        refundQuota(uid, 'graph'),
      ]);
      throw new HttpsError('internal', (err as Error).message);
    }
  },
);

/** The whole graph plus this student's standing on it. */
export const getGraph = onCall(callable, async (req) => {
  const uid = requireUid(req.auth);
  const { examId } = req.data ?? {};
  if (!examId) throw new HttpsError('invalid-argument', 'examId is required.');
  const [exam, nodes] = await Promise.all([getExam(uid, examId), getNodes(uid, examId)]);
  return { exam, nodes };
});

/** The precise next thing to do, and why. Pure logic — no Claude call. */
export const nextStep = onCall(callable, async (req) => {
  const uid = requireUid(req.auth);
  const { examId } = req.data ?? {};
  if (!examId) throw new HttpsError('invalid-argument', 'examId is required.');

  const [exam, nodes] = await Promise.all([getExam(uid, examId), getNodes(uid, examId)]);
  if (!exam) throw new HttpsError('not-found', 'No such exam.');
  if (nodes.length === 0) throw new HttpsError('failed-precondition', 'This exam has no graph yet.');

  return planNextStep(nodes, Date.now(), exam.examDate);
});

/**
 * Build a check for one concept. The answer key is stored server-side and the
 * client only receives the questions, so grading cannot be spoofed.
 */
export const startCheck = onCall(
  { ...common, timeoutSeconds: 120, maxInstances: 8 },
  async (req) => {
    const uid = requireUid(req.auth);
    const { examId, conceptId } = req.data ?? {};
    if (!examId || !conceptId) {
      throw new HttpsError('invalid-argument', 'examId and conceptId are required.');
    }

    const [exam, node] = await Promise.all([getExam(uid, examId), getNode(uid, examId, conceptId)]);
    if (!exam || !node) throw new HttpsError('not-found', 'No such concept.');

    await consumeQuota(uid, 'check').catch(quotaToHttps);
    let questions;
    try {
      questions = await generateQuestions(node, exam.subject, exam.grade, exam.board, CHECK_SIZE);
    } catch (err) {
      await refundQuota(uid, 'check');
      throw new HttpsError('internal', (err as Error).message);
    }

    const ref = await pendingRef(uid, examId).add({
      conceptId, questions, createdAt: Date.now(),
    });

    return {
      checkId: ref.id,
      // Strip the answer key before it leaves the server.
      questions: questions.map(({ q, opts }) => ({ q, opts })),
      passMark: CHECK_PASS,
    };
  },
);

/**
 * Record one answer and hand back the explanation for that question only.
 * Keeps the immediate "here's why" feedback the lesson depends on without
 * ever shipping the whole answer key to the client.
 */
export const answerQuestion = onCall(callable, async (req) => {
  const uid = requireUid(req.auth);
  const { examId, checkId, index, pick } = req.data ?? {};
  if (!examId || !checkId || typeof index !== 'number' || typeof pick !== 'number') {
    throw new HttpsError('invalid-argument', 'examId, checkId, index and pick are required.');
  }

  const ref = pendingRef(uid, examId).doc(checkId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'That check has expired.');

  const { questions, picks = [] } = snap.data() as {
    questions: PracticeQuestion[]; picks?: (number | null)[];
  };
  const question = questions[index];
  if (!question) throw new HttpsError('out-of-range', 'No such question in this check.');

  // First answer stands — re-answering must not let a student fish for the key.
  const recorded = picks.slice();
  if (recorded[index] === undefined || recorded[index] === null) {
    recorded[index] = pick;
    await ref.set({ picks: recorded }, { merge: true });
  }

  const committed = recorded[index] as number;
  return { correct: committed === question.answer, answer: question.answer, why: question.why };
});

/** Grade a check, update mastery, and say what comes next. */
export const submitCheck = onCall(callable, async (req) => {
  const uid = requireUid(req.auth);
  const { examId, checkId, picks } = req.data ?? {};
  if (!examId || !checkId || !Array.isArray(picks)) {
    throw new HttpsError('invalid-argument', 'examId, checkId and picks are required.');
  }

  const pendingDoc = await pendingRef(uid, examId).doc(checkId).get();
  if (!pendingDoc.exists) throw new HttpsError('not-found', 'That check has expired.');
  const { conceptId, questions, picks: recorded } = pendingDoc.data() as {
    conceptId: string; questions: PracticeQuestion[]; picks?: (number | null)[];
  };

  const [exam, node] = await Promise.all([getExam(uid, examId), getNode(uid, examId, conceptId)]);
  if (!exam || !node) throw new HttpsError('not-found', 'No such concept.');

  // Prefer what the server recorded as each question was answered; the
  // client's copy is only a fallback for a check answered in one go.
  const finalPicks = questions.map((_, i) => {
    const fromServer = recorded?.[i];
    return typeof fromServer === 'number' ? fromServer : Number(picks[i]);
  });
  const { score, missed } = grade(questions, finalPicks);
  const now = Date.now();
  const progress = applyAttempt(node, score, questions.length, missed, now, exam.examDate);

  await Promise.all([
    updateProgress(uid, examId, conceptId, progress),
    recordAttemptDoc(uid, examId, {
      conceptId, score, outOf: questions.length, picks: finalPicks, missed, at: now,
    }),
    pendingDoc.ref.delete(),
  ]);

  const nodes = await getNodes(uid, examId);
  return {
    score,
    outOf: questions.length,
    passed: score >= CHECK_PASS,
    passMark: CHECK_PASS,
    // Send the key back now that it's graded, so the app can explain each one.
    questions,
    state: progress.state,
    next: planNextStep(nodes, now, exam.examDate),
  };
});

/** The lesson so far, so reopening a concept shows the conversation. */
export const getThread = onCall(callable, async (req) => {
  const uid = requireUid(req.auth);
  const { examId, conceptId } = req.data ?? {};
  if (!examId || !conceptId) throw new HttpsError('invalid-argument', 'examId and conceptId are required.');
  const turns = await getThread_(uid, examId, conceptId);
  // Kickoff and re-teach asks are prompt scaffolding, not part of the chat.
  return { turns: turns.filter((t) => !t.hidden) };
});

/** Wipe a concept's lesson thread so the next lesson starts fresh. */
export const resetThread = onCall(callable, async (req) => {
  const uid = requireUid(req.auth);
  const { examId, conceptId } = req.data ?? {};
  if (!examId || !conceptId) throw new HttpsError('invalid-argument', 'examId and conceptId are required.');
  await setThread(uid, examId, conceptId, []);
  return { ok: true };
});

/** Streaming tutor lesson (SSE). */
export const tutor = onRequest({ ...request, timeoutSeconds: 300 }, handleTutor);

/**
 * Sweep answer keys for checks that were started and never finished. They are
 * deleted on submit, but an abandoned check would otherwise sit forever.
 */
export const sweepPendingChecks = onSchedule(
  { region: REGION, schedule: 'every 24 hours', maxInstances: 1 },
  async () => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const stale = await db().collectionGroup('pendingChecks')
      .where('createdAt', '<', cutoff)
      .limit(500)
      .get();
    if (stale.empty) return;
    const batch = db().batch();
    stale.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`swept ${stale.size} abandoned checks`);
  },
);

const pendingRef = (uid: string, examId: string) =>
  // Pending checks hold the answer key; rules deny all client access to them.
  db().collection('students').doc(uid).collection('exams').doc(examId).collection('pendingChecks');
