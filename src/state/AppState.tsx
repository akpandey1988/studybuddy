import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CATALOG, DAY_CHOICES, FREE_EXAMS, MAX_EXAMS, catFor, dateLabel } from '../data/catalog';
import type { AppData, Exam, ExamStats, Route, TopicLevel } from './types';

// Ported 1:1 from the Component class in StudyBuddy Prototype.dc.html.

function examStats(exam: Exam): ExamStats {
  const c = catFor(exam.subject);
  const picks = exam.picks || [];
  const byTopic: Record<string, { right: number; total: number }> = {};
  c.topics.forEach((t) => { byTopic[t] = { right: 0, total: 0 }; });
  c.qs.forEach((q, i) => {
    const e = byTopic[q.topic];
    e.total += 1;
    if (picks[i] === q.answer) e.right += 1;
  });
  const correct = c.qs.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
  const readiness = exam.baselineDone ? Math.round(28 + (correct / c.qs.length) * 46) : 0;

  const topics = c.topics.map((name) => {
    const e = byTopic[name];
    const level = (!exam.baselineDone || e.total === 0) ? 0 : Math.max(1, Math.round((e.right / e.total) * 5));
    const label: TopicLevel = level === 0 ? 'Not tested' : level >= 4 ? 'Strong' : level === 3 ? 'Getting there' : 'Needs work';
    return { name, level, label };
  });

  const weak = topics.filter((t) => t.label === 'Needs work').map((t) => t.name);
  const mid = topics.filter((t) => t.label === 'Getting there').map((t) => t.name);
  const untested = topics.filter((t) => t.label === 'Not tested').map((t) => t.name);

  return {
    cat: c, correct, readiness, topics, weak, mid, untested,
    focus: weak[0] || mid[0] || untested[0] || c.topics[0],
    allStrong: weak.length === 0 && mid.length === 0 && exam.baselineDone,
  };
}

const initialState: AppData = {
  route: 'login', phone: '', otp: '', name: '', grade: null, board: null, prime: false,
  exams: [], activeId: null, qi: 0, sel: null,
  draftSubject: null, draftDays: 30, nextId: 1,
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
        syllabus: withSyllabus, picks: [], baselineDone: false,
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

export { examStats, DAY_CHOICES };
