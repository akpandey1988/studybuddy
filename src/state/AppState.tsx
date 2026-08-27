import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CATALOG, CHECK_PASS, CHECK_SIZE, DAY_CHOICES, FREE_EXAMS, MAX_EXAMS, catFor, dateLabel } from '../data/catalog';
import type {
  AppData, ChatTurn, Exam, ExamStats, PracticeQuestion, Route, TopicLevel, TopicProgress,
} from './types';

// Onboarding and baseline flow ported from StudyBuddy Prototype.dc.html; the
// per-topic mastery loop (teach -> check -> re-teach) is built on top of it.

/** A topic's thread of Nexora messages is scoped to the exam AND the topic. */
export function chatKey(examId: number, topic: string): string {
  return `${examId}::${topic}`;
}

function blankProgress(): TopicProgress {
  return {
    attempts: 0, lessons: 0, lastScore: 0, bestScore: 0,
    outOf: CHECK_SIZE, mastered: false, missed: [],
  };
}

function labelFor(level: number): TopicLevel {
  if (level === 0) return 'Not tested';
  if (level >= 4) return 'Strong';
  if (level === 3) return 'Getting there';
  return 'Needs work';
}

/** Weakest first, so the loop always hands back the topic that needs it most. */
const GAP_ORDER: Record<TopicLevel, number> = {
  'Needs work': 0, 'Getting there': 1, 'Not tested': 2, 'Strong': 3,
};

function examStats(exam: Exam): ExamStats {
  const c = catFor(exam.subject);
  const picks = exam.picks || [];
  const mastery = exam.mastery || {};
  const byTopic: Record<string, { right: number; total: number }> = {};
  c.topics.forEach((t) => { byTopic[t] = { right: 0, total: 0 }; });
  c.qs.forEach((q, i) => {
    const e = byTopic[q.topic];
    e.total += 1;
    if (picks[i] === q.answer) e.right += 1;
  });
  const correct = c.qs.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);

  const topics = c.topics.map((name) => {
    const m = mastery[name];
    if (m && m.mastered) return { name, level: 5, label: 'Strong' as TopicLevel };
    // A check is a fresher, deeper signal than the single baseline question.
    if (m && m.attempts > 0) {
      const level = Math.max(1, Math.round((m.lastScore / m.outOf) * 5));
      return { name, level, label: labelFor(level) };
    }
    const e = byTopic[name];
    const level = (!exam.baselineDone || e.total === 0)
      ? 0
      : Math.max(1, Math.round((e.right / e.total) * 5));
    return { name, level, label: labelFor(level) };
  });

  const weak = topics.filter((t) => t.label === 'Needs work').map((t) => t.name);
  const mid = topics.filter((t) => t.label === 'Getting there').map((t) => t.name);
  const untested = topics.filter((t) => t.label === 'Not tested').map((t) => t.name);

  // A topic counts as learned only once a check has proved it — a lucky
  // baseline answer is not enough — so the loop keeps going until all are done.
  const gaps = topics
    .filter((t) => !(mastery[t.name] && mastery[t.name].mastered))
    .slice()
    .sort((a, b) => GAP_ORDER[a.label] - GAP_ORDER[b.label])
    .map((t) => t.name);

  const masteredCount = c.topics.filter((t) => mastery[t] && mastery[t].mastered).length;
  const base = exam.baselineDone ? 28 + (correct / c.qs.length) * 46 : 0;
  // Baseline sets the floor; mastering topics closes the rest of the gap to 95.
  const readiness = exam.baselineDone
    ? Math.min(95, Math.round(base + (masteredCount / c.topics.length) * (95 - base)))
    : 0;

  return {
    cat: c, correct, readiness, topics, weak, mid, untested,
    gaps, masteredCount, mastery,
    focus: gaps[0] || c.topics[0],
    allStrong: weak.length === 0 && mid.length === 0 && exam.baselineDone,
    allMastered: masteredCount === c.topics.length,
  };
}

const initialState: AppData = {
  route: 'login', phone: '', otp: '', name: '', grade: null, board: null, prime: false,
  exams: [], activeId: null, qi: 0, sel: null,
  draftSubject: null, draftDays: 30, nextId: 1, chats: {},
  check: { topic: null, questions: [], qi: 0, sel: null, revealed: false, picks: [] },
};

function useAppStateImpl() {
  const [s, setS] = useState<AppData>(initialState);

  const go = useCallback((route: Route) => setS((p) => ({ ...p, route })), []);

  const patchActive = useCallback((patch: Partial<Exam>) => {
    setS((p) => ({ ...p, exams: p.exams.map((e) => (e.id === p.activeId ? { ...e, ...patch } : e)) }));
  }, []);

  const digits = s.phone.replace(/\D/g, '');
  const otpDigits = s.otp.replace(/\D/g, '').slice(0, 4);
  const phoneOk = digits.length === 10;
  const otpOk = otpDigits.length === 4;
  const detailsOk = s.name.trim().length > 1 && s.grade !== null && s.board !== null;

  const active = s.exams.find((e) => e.id === s.activeId) || s.exams[0] || null;
  const st = active ? examStats(active) : null;
  const ready = s.exams.filter((e) => e.baselineDone);
  const missingSyllabus = s.exams.filter((e) => !e.syllabus);
  const others = ready.filter((e) => !active || e.id !== active.id);
  const second = others[0] || null;
  const secondStats = second ? examStats(second) : null;

  const atCap = s.exams.length >= MAX_EXAMS;
  const needsPrime = !s.prime && s.exams.length >= FREE_EXAMS;

  const activeName = active ? active.subject : 'your exam';
  const firstName = s.name.trim().split(' ')[0] || 'there';
  const readiness = st ? st.readiness : 0;
  const focus = st ? st.focus : '';

  const taken = s.exams.map((e) => e.subject);
  const subjectOptions = CATALOG.filter((c) => taken.indexOf(c.name) < 0);
  const draftPct = Math.round(((s.draftDays - 3) / (60 - 3)) * 100);

  const q = active && st ? st.cat.qs[s.qi] : null;
  const qTotal = st ? st.cat.qs.length : 0;

  const focusTopic = st ? st.focus : '';
  const activeChatKey = active && focusTopic ? chatKey(active.id, focusTopic) : '';
  const chat = activeChatKey ? (s.chats[activeChatKey] || []) : [];
  const topicProgress = st && focusTopic
    ? (st.mastery[focusTopic] || blankProgress())
    : blankProgress();

  // Progress for the topic the check is actually about. This is NOT always the
  // focus topic: passing a check masters the topic, which immediately moves
  // focus to the next gap while the result screen is still showing.
  const progressFor = (topic: string | null): TopicProgress =>
    (topic && st ? st.mastery[topic] : undefined) || blankProgress();
  const checkProgress = progressFor(s.check.topic);

  const checkQ = s.check.questions[s.check.qi] || null;
  const checkTotal = s.check.questions.length;
  const checkScore = s.check.questions.reduce(
    (n, q, i) => n + (s.check.picks[i] === q.answer ? 1 : 0), 0,
  );
  const checkPassed = checkScore >= CHECK_PASS;

  const actions = useMemo(() => ({
    setPhone: (v: string) => setS((p) => ({ ...p, phone: v.replace(/[^\d ]/g, '').slice(0, 11) })),
    setOtp: (v: string) => setS((p) => ({ ...p, otp: v.replace(/\D/g, '').slice(0, 4) })),
    setName: (v: string) => setS((p) => ({ ...p, name: v })),
    pickGrade: (g: number) => setS((p) => ({ ...p, grade: g })),
    pickBoard: (b: string) => setS((p) => ({ ...p, board: b })),

    goLogin: () => go('login'),
    goExams: () => go('exams'),
    goPrime: () => go('prime'),
    goHome: () => go('home'),
    goNexora: () => go('nexora'),
    goProgress: () => go('progress'),
    goBadges: () => go('badges'),
    goFriends: () => go('friends'),
    goFchat: () => go('fchat'),
    goCall: () => go('call'),
    goGroup: () => go('group'),
    goParent: () => go('parent'),

    sendCode: () => setS((p) => {
      const d = p.phone.replace(/\D/g, '');
      if (d.length !== 10) return p;
      return { ...p, route: 'otp', otp: '' };
    }),
    verifyOtp: () => setS((p) => {
      const od = p.otp.replace(/\D/g, '').slice(0, 4);
      if (od.length !== 4) return p;
      return { ...p, route: 'details' };
    }),
    finishDetails: () => setS((p) => {
      const ok = p.name.trim().length > 1 && p.grade !== null && p.board !== null;
      if (!ok) return p;
      return { ...p, route: 'exams' };
    }),

    goAddsub: () => setS((p) => {
      if (p.exams.length >= MAX_EXAMS) return p;
      const needsPrimeNow = !p.prime && p.exams.length >= FREE_EXAMS;
      return { ...p, route: needsPrimeNow ? 'prime' : 'addsub', draftSubject: null };
    }),
    pickDraftSubject: (name: string) => setS((p) => ({ ...p, draftSubject: name })),
    setDraftDays: (n: number) => setS((p) => ({ ...p, draftDays: n })),
    primeCta: () => setS((p) => {
      if (p.prime) return { ...p, route: 'addsub', draftSubject: null };
      return { ...p, prime: true, route: 'addsub', draftSubject: null };
    }),
    addExam: (withSyllabus: boolean) => setS((p) => {
      if (!p.draftSubject || p.exams.length >= MAX_EXAMS) return p;
      if (!p.prime && p.exams.length >= FREE_EXAMS) return { ...p, route: 'prime' };
      const id = p.nextId;
      const exam: Exam = {
        id, subject: p.draftSubject, days: p.draftDays, dateLabel: dateLabel(p.draftDays),
        syllabus: withSyllabus, picks: [], baselineDone: false, mastery: {},
      };
      return {
        ...p, exams: p.exams.concat([exam]), nextId: id + 1, activeId: id,
        draftSubject: null, draftDays: 30,
        route: withSyllabus ? 'syllabus' : 'exams',
      };
    }),
    openExam: (exam: Exam) => setS((p) => {
      if (!exam.syllabus) return { ...p, activeId: exam.id, route: 'syllabus' };
      if (!exam.baselineDone) return { ...p, activeId: exam.id, route: 'quiz', qi: 0, sel: null };
      return { ...p, activeId: exam.id, route: 'home' };
    }),
    examsCta: () => setS((p) => {
      const readyExams = p.exams.filter((e) => e.baselineDone);
      if (readyExams.length === 0) return p;
      return { ...p, activeId: readyExams[0].id, route: 'home' };
    }),
    fixMissing: () => setS((p) => {
      const missing = p.exams.filter((e) => !e.syllabus);
      if (missing.length === 0) return p;
      return { ...p, activeId: missing[0].id, route: 'syllabus' };
    }),

    startQuiz: () => setS((p) => ({
      ...p,
      exams: p.exams.map((e) => (e.id === p.activeId ? { ...e, syllabus: true } : e)),
      route: 'quiz', qi: 0, sel: null,
    })),
    selectOption: (i: number) => setS((p) => ({ ...p, sel: i })),
    nextQuestion: () => setS((p) => {
      const activeExam = p.exams.find((e) => e.id === p.activeId) || p.exams[0] || null;
      if (p.sel === null || !activeExam) return p;
      const cat = catFor(activeExam.subject);
      const qTotalNow = cat.qs.length;
      const picks = (activeExam.picks || []).slice();
      picks[p.qi] = p.sel;
      const last = p.qi >= qTotalNow - 1;
      const exams = p.exams.map((e) => (e.id === activeExam.id
        ? { ...e, picks, baselineDone: e.baselineDone || last }
        : e));
      return last
        ? { ...p, exams, route: 'result' }
        : { ...p, exams, qi: p.qi + 1, sel: null };
    }),
    resultCta: () => setS((p) => {
      const missing = p.exams.filter((e) => !e.syllabus).length > 0
        || p.exams.some((e) => e.syllabus && !e.baselineDone);
      return { ...p, route: missing ? 'exams' : 'home' };
    }),

    appendTurn: (key: string, turn: ChatTurn) => setS((p) => ({
      ...p,
      chats: { ...p.chats, [key]: (p.chats[key] || []).concat([turn]) },
    })),
    resetChat: (key: string) => setS((p) => ({ ...p, chats: { ...p.chats, [key]: [] } })),

    /** Count a lesson the first time Nexora teaches a topic in this thread. */
    noteLesson: (topic: string) => setS((p) => ({
      ...p,
      exams: p.exams.map((e) => (e.id === p.activeId
        ? {
          ...e,
          mastery: {
            ...e.mastery,
            [topic]: { ...(e.mastery[topic] || blankProgress()), lessons: (e.mastery[topic]?.lessons ?? 0) + 1 },
          },
        }
        : e)),
    })),

    // --- the learn loop: teach -> check -> re-teach until mastered ---

    startCheck: (topic: string) => setS((p) => ({
      ...p,
      route: 'check',
      check: { topic, questions: [], qi: 0, sel: null, revealed: false, picks: [] },
    })),
    setCheckQuestions: (questions: PracticeQuestion[]) => setS((p) => ({
      ...p,
      check: { ...p.check, questions, qi: 0, sel: null, revealed: false, picks: [] },
    })),
    /** Answering commits immediately — the explanation is the teaching moment. */
    answerCheck: (i: number) => setS((p) => (p.check.revealed
      ? p
      : { ...p, check: { ...p.check, sel: i, revealed: true } })),
    nextCheck: () => setS((p) => {
      const { check } = p;
      if (check.sel === null || !check.topic || check.questions.length === 0) return p;
      const picks = check.picks.slice();
      picks[check.qi] = check.sel;

      if (check.qi < check.questions.length - 1) {
        return { ...p, check: { ...check, picks, qi: check.qi + 1, sel: null, revealed: false } };
      }

      const score = check.questions.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
      const missed = check.questions.filter((q, i) => picks[i] !== q.answer).map((q) => q.q);
      const passed = score >= CHECK_PASS;
      const topic = check.topic;

      const exams = p.exams.map((e) => {
        if (e.id !== p.activeId) return e;
        const prev = e.mastery[topic] || blankProgress();
        return {
          ...e,
          mastery: {
            ...e.mastery,
            [topic]: {
              ...prev,
              attempts: prev.attempts + 1,
              lastScore: score,
              bestScore: Math.max(prev.bestScore, score),
              outOf: check.questions.length,
              mastered: prev.mastered || passed,
              missed,
            },
          },
        };
      });
      return { ...p, exams, check: { ...check, picks }, route: 'checkresult' };
    }),
    /** Failed the check: hand the misses back to Nexora and teach it again. */
    reteach: () => setS((p) => {
      const topic = p.check.topic;
      const activeExam = p.exams.find((e) => e.id === p.activeId);
      if (!topic || !activeExam) return p;
      const missed = activeExam.mastery[topic]?.missed || [];
      const key = chatKey(activeExam.id, topic);
      const ask: ChatTurn = {
        role: 'user',
        hidden: true,
        content: missed.length
          ? `I just took a check on ${topic} and got these wrong:\n${missed.map((m) => `- ${m}`).join('\n')}\n`
            + 'Explain that idea a different way, with a fresh everyday example, then ask me one question about it.'
          : `I just took a check on ${topic} and did not pass. Explain it a different way with a fresh example, then ask me one question.`,
      };
      return {
        ...p,
        route: 'nexora',
        chats: { ...p.chats, [key]: (p.chats[key] || []).concat([ask]) },
      };
    }),
    /** Passed: back to the plan, where the next gap is already the focus. */
    finishCheck: () => setS((p) => ({
      ...p,
      route: 'home',
      check: { topic: null, questions: [], qi: 0, sel: null, revealed: false, picks: [] },
    })),

    pickSubjectPill: (id: number) => setS((p) => ({ ...p, activeId: id })),
    goSecond: () => setS((p) => {
      const activeExam = p.exams.find((e) => e.id === p.activeId) || p.exams[0] || null;
      const readyExams = p.exams.filter((e) => e.baselineDone);
      const othersNow = readyExams.filter((e) => !activeExam || e.id !== activeExam.id);
      const secondNow = othersNow[0] || null;
      if (!secondNow) return p;
      return { ...p, activeId: secondNow.id, route: 'nexora' };
    }),
  }), [go]);

  return {
    s, patchActive,
    digits, otpDigits, phoneOk, otpOk, detailsOk,
    active, st, ready, missingSyllabus, second, secondStats,
    atCap, needsPrime, activeName, firstName, readiness, focus,
    subjectOptions, draftPct, q, qTotal,
    chat, activeChatKey, focusTopic, topicProgress,
    progressFor, checkProgress, checkQ, checkTotal, checkScore, checkPassed,
    actions,
  };
}

type AppContextValue = ReturnType<typeof useAppStateImpl>;
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const value = useAppStateImpl();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { examStats, blankProgress, DAY_CHOICES };
