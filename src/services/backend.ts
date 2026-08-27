// Typed client for the StudyBuddy backend.
//
// The server owns the knowledge graph and all mastery: it decides what to
// study next and it grades every check. This module is a thin, honest
// wrapper — it deliberately holds no scoring logic of its own.

import { fetch } from 'expo/fetch';
import { httpsCallable } from 'firebase/functions';
import { REGION, functions, idToken, isConfigured } from './firebase';
import { BackendError } from './firebase';

export { BackendError };

/** A graph node joined with this student's standing on it. */
export type ConceptNode = {
  id: string;
  name: string;
  chapter: string;
  summary: string;
  prereqs: string[];
  weight: number;
  difficulty: number;
  depth: number;
  state: 'unknown' | 'learning' | 'shaky' | 'mastered';
  strength: number;
  attempts: number;
  lessons: number;
  lastScore: number;
  lastOutOf: number;
  lastSeenAt: number | null;
  dueAt: number | null;
  missed: string[];
};

export type NextStep = {
  action: 'learn' | 'practise' | 'review' | 'done';
  conceptId: string | null;
  conceptName: string;
  reason: string;
  blockedBy: { id: string; name: string; strength: number }[];
  unlocks: { id: string; name: string } | null;
  dueForReview: { id: string; name: string }[];
  readiness: number;
  daysToExam: number;
};

/** Questions as the student sees them — the answer key stays on the server. */
export type CheckQuestion = { q: string; opts: string[] };
export type GradedQuestion = CheckQuestion & { answer: number; why: string };

export type StartedCheck = { checkId: string; questions: CheckQuestion[]; passMark: number };

export type CheckResult = {
  score: number;
  outOf: number;
  passed: boolean;
  passMark: number;
  questions: GradedQuestion[];
  state: ConceptNode['state'];
  next: NextStep;
};

/**
 * The callable SDK defaults to a 70s client timeout. buildGraph is a large
 * reasoning call with a 540s server timeout, so the default would abandon a
 * request the server is still working on — and the student would see a
 * failure for a graph that then lands anyway.
 */
const TIMEOUTS: Record<string, number> = {
  buildGraph: 540_000,
  startCheck: 180_000,
};

async function call<Req, Res>(name: string, data: Req): Promise<Res> {
  if (!isConfigured()) {
    throw new BackendError('The backend is not configured. See README.md for the EXPO_PUBLIC_FIREBASE_* values.');
  }
  try {
    const fn = httpsCallable<Req, Res>(functions(), name, { timeout: TIMEOUTS[name] ?? 70_000 });
    return (await fn(data)).data;
  } catch (err) {
    // Callable errors arrive with the server's message already attached.
    throw new BackendError((err as { message?: string }).message || `${name} failed.`);
  }
}

export type SyllabusAttachment = { kind: 'image' | 'pdf'; mediaType: string; data: string };

export const buildGraph = (input: {
  examId: string; subject: string; syllabus: string;
  examDate: number; grade: number | null; board: string | null;
  attachment?: SyllabusAttachment;
}) => call<typeof input, { conceptCount: number; concepts: ConceptNode[] }>('buildGraph', input);

export const getGraph = (examId: string) =>
  call<{ examId: string }, { exam: unknown; nodes: ConceptNode[] }>('getGraph', { examId });

export const nextStep = (examId: string) =>
  call<{ examId: string }, NextStep>('nextStep', { examId });

export const startCheck = (examId: string, conceptId: string) =>
  call<{ examId: string; conceptId: string }, StartedCheck>('startCheck', { examId, conceptId });

/** Record one answer and get the explanation for that question alone. */
export const answerQuestion = (examId: string, checkId: string, index: number, pick: number) =>
  call<{ examId: string; checkId: string; index: number; pick: number },
    { correct: boolean; answer: number; why: string }>(
    'answerQuestion', { examId, checkId, index, pick },
  );

export const submitCheck = (examId: string, checkId: string, picks: number[]) =>
  call<{ examId: string; checkId: string; picks: number[] }, CheckResult>(
    'submitCheck', { examId, checkId, picks },
  );

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export const getThread = (examId: string, conceptId: string) =>
  call<{ examId: string; conceptId: string }, { turns: ChatTurn[] }>(
    'getThread', { examId, conceptId },
  );

export const resetThread = (examId: string, conceptId: string) =>
  call<{ examId: string; conceptId: string }, { ok: boolean }>('resetThread', { examId, conceptId });

function tutorUrl(): string {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (process.env.EXPO_PUBLIC_FIREBASE_EMULATOR === '1') {
    const host = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
    return `http://${host}:5001/${projectId}/${REGION}/tutor`;
  }
  return `https://${REGION}-${projectId}.cloudfunctions.net/tutor`;
}

/**
 * Streams the tutor's reply. Uses expo/fetch rather than the global fetch:
 * React Native's built-in fetch cannot read a response body incrementally,
 * and neither can the callable SDK.
 */
export async function* streamTutor(
  examId: string,
  conceptId: string,
  message?: string,
  signal?: AbortSignal,
  /** Send the message to Claude but keep it out of the visible thread. */
  hidden = false,
): AsyncGenerator<string> {
  if (!isConfigured()) {
    throw new BackendError('The backend is not configured. See README.md.');
  }
  const token = await idToken();

  let res: Response;
  try {
    res = await fetch(tutorUrl(), {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ examId, conceptId, message, hidden }),
    });
  } catch {
    throw new BackendError("Nexora can't be reached. Check your connection and try again.");
  }

  if (!res.ok) {
    let detail = String(res.status);
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      // non-JSON body — the status code is all we have
    }
    throw new BackendError(`Nexora couldn't be reached (${detail}).`);
  }
  if (!res.body) throw new BackendError('Nexora sent an empty response.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let split = buffer.indexOf('\n\n');
    while (split !== -1) {
      const frame = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);
      split = buffer.indexOf('\n\n');

      const line = frame.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;

      let event: { type?: string; text?: string; error?: string };
      try {
        event = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }

      if (event.type === 'text' && event.text) yield event.text;
      else if (event.type === 'error') throw new BackendError(event.error || 'Nexora hit a problem.');
      else if (event.type === 'done') return;
    }
  }
}
