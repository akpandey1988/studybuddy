import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG, DAY_CHOICES, FREE_EXAMS, MAX_EXAMS, dateLabel } from '../data/catalog';
import * as backend from '../services/backend';
import { BackendError, isConfigured, signInGuest, watchAuth } from '../services/firebase';
import { loadExams, loadProfile, newExamId, saveProfile } from '../services/store';
import type { Busy, CheckState, Route } from './types';
import type { ConceptNode, NextStep } from '../services/backend';
import type { ExamRecord } from '../services/store';

const DAY_MS = 86_400_000;

const emptyCheck = (): CheckState => ({
  conceptId: null, conceptName: '', checkId: null,
  questions: [], qi: 0, sel: null, revealed: null, picks: [],
});

function useAppStateImpl() {
  const [route, setRoute] = useState<Route>('login');
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Profile. Kept in local state while being typed, persisted on Continue.
  const [phone, setPhoneRaw] = useState('');
  const [otp, setOtpRaw] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number | null>(null);
  const [board, setBoard] = useState<string | null>(null);
  const [prime, setPrime] = useState(false);

  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<ConceptNode[]>([]);
  const [plan, setPlan] = useState<NextStep | null>(null);

  const [draftSubject, setDraftSubject] = useState<string | null>(null);
  const [draftDays, setDraftDays] = useState(30);
  const [draftSyllabus, setDraftSyllabus] = useState('');

  const [check, setCheck] = useState<CheckState>(emptyCheck());
  const [result, setResult] = useState<backend.CheckResult | null>(null);

  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);

  const go = useCallback((r: Route) => setRoute(r), []);
  const fail = useCallback((e: unknown) => {
    setError(e instanceof BackendError ? e.message : (e as Error).message || 'Something went wrong.');
  }, []);

  // ── boot ────────────────────────────────────────────────────────────────
  // Sign in as a guest so the student has a real uid to hang a graph off
  // before they ever give us a phone number.
  const booted = useRef(false);
  useEffect(() => {
    if (!isConfigured()) { setAuthReady(true); return; }
    const stop = watchAuth(async (user) => {
      if (user) {
        setUid(user.uid);
        setAuthReady(true);
      } else if (!booted.current) {
        booted.current = true;
        setBusy('auth');
        try { await signInGuest(); } catch (e) { fail(e); setAuthReady(true); }
        finally { setBusy(null); }
      } else {
        setAuthReady(true);
      }
    });
    return stop;
  }, [fail]);

  const refreshExams = useCallback(async (id: string) => {
    const list = await loadExams(id);
    setExams(list);
    return list;
  }, []);

  // Pull whatever this student already has as soon as we know who they are.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      setBusy('profile');
      try {
        const [profile, list] = await Promise.all([loadProfile(uid), loadExams(uid)]);
        if (cancelled) return;
        if (profile) {
          setName(profile.name ?? '');
          setGrade(profile.grade ?? null);
          setBoard(profile.board ?? null);
        }
        setExams(list);
        // Returning student: skip straight past onboarding.
        if (profile?.name) {
          const ready = list.find((e) => e.graphStatus === 'ready');
          if (ready) { setActiveExamId(ready.id); setRoute('home'); }
          else setRoute('exams');
        }
      } catch (e) {
        if (!cancelled) fail(e);
      } finally {
        if (!cancelled) setBusy(null);
      }
    })();
    return () => { cancelled = true; };
  }, [uid, fail]);

  // ── graph + plan for the active exam ────────────────────────────────────
  const loadGraph = useCallback(async (examId: string) => {
    setBusy('plan');
    setError(null);
    try {
      const [graph, next] = await Promise.all([
        backend.getGraph(examId),
        backend.nextStep(examId),
      ]);
      setNodes(graph.nodes);
      setPlan(next);
      return next;
    } catch (e) {
      fail(e);
      return null;
    } finally {
      setBusy(null);
    }
  }, [fail]);

  useEffect(() => {
    if (!uid || !activeExamId) return;
    const exam = exams.find((e) => e.id === activeExamId);
    if (exam?.graphStatus !== 'ready') return;
    loadGraph(activeExamId);
  }, [uid, activeExamId, exams, loadGraph]);

  // ── derived ─────────────────────────────────────────────────────────────
  const digits = phone.replace(/\D/g, '');
  const otpDigits = otp.replace(/\D/g, '').slice(0, 4);
  const phoneOk = digits.length === 10;
  const otpOk = otpDigits.length === 4;
  const detailsOk = name.trim().length > 1 && grade !== null && board !== null;

  const activeExam = exams.find((e) => e.id === activeExamId) ?? null;
  const readyExams = exams.filter((e) => e.graphStatus === 'ready');
  const pendingExams = exams.filter((e) => e.graphStatus !== 'ready');
  const atCap = exams.length >= MAX_EXAMS;
  const needsPrime = !prime && exams.length >= FREE_EXAMS;
  const firstName = name.trim().split(' ')[0] || 'there';
  const activeName = activeExam?.subject ?? 'your exam';

  const taken = exams.map((e) => e.subject);
  const subjectOptions = CATALOG.filter((c) => taken.indexOf(c.name) < 0);
  const draftPct = Math.round(((draftDays - 3) / (60 - 3)) * 100);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const focusNode = plan?.conceptId ? byId.get(plan.conceptId) ?? null : null;
  const readiness = plan ? Math.round(plan.readiness * 100) : 0;
  const masteredCount = nodes.filter((n) => n.state === 'mastered').length;

  const checkQ = check.questions[check.qi] ?? null;
  const checkTotal = check.questions.length;

  // ── actions ─────────────────────────────────────────────────────────────
  const actions = useMemo(() => ({
    setPhone: (v: string) => setPhoneRaw(v.replace(/[^\d ]/g, '').slice(0, 11)),
    setOtp: (v: string) => setOtpRaw(v.replace(/\D/g, '').slice(0, 4)),
    setName,
    pickGrade: setGrade,
    pickBoard: setBoard,
    setDraftDays,
    setDraftSyllabus,
    pickDraftSubject: setDraftSubject,
    clearError: () => setError(null),

    goLogin: () => go('login'),
    goExams: () => go('exams'),
    goPrime: () => go('prime'),
    goHome: () => go('home'),
    goProgress: () => go('progress'),
    goBadges: () => go('badges'),
    goFriends: () => go('friends'),
    goFchat: () => go('fchat'),
    goCall: () => go('call'),
    goGroup: () => go('group'),
    goParent: () => go('parent'),
    goNexora: () => go('nexora'),

    // Phone entry is still local — real SMS needs a dev build (see README).
    sendCode: () => { if (phoneOk) { setOtpRaw(''); go('otp'); } },
    verifyOtp: () => { if (otpOk) go('details'); },

    finishDetails: async () => {
      if (!detailsOk || !uid) return;
      setBusy('profile');
      setError(null);
      try {
        await saveProfile(uid, { name: name.trim(), grade, board });
        go('exams');
      } catch (e) { fail(e); } finally { setBusy(null); }
    },

    goAddsub: () => {
      if (atCap) return;
      setDraftSubject(null);
      setDraftSyllabus('');
      go(!prime && exams.length >= FREE_EXAMS ? 'prime' : 'addsub');
    },
    primeCta: () => { setPrime(true); setDraftSubject(null); go('addsub'); },

    /** Draft is complete — go collect the syllabus the graph is built from. */
    goSyllabus: () => { if (draftSubject) go('syllabus'); },

    /**
     * Create the exam and have the backend read its syllabus into a graph.
     * This is the slow call in the product, so it gets its own screen.
     */
    buildExam: async () => {
      if (!uid || !draftSubject) return;
      const examId = newExamId();
      const subject = draftSubject;
      // Fall back to the catalog's chapter list when nothing was typed, so a
      // student can get going without hunting for their syllabus sheet.
      const syllabus = draftSyllabus.trim()
        || (CATALOG.find((c) => c.name === subject)?.topics.join('\n') ?? subject);

      setBusy('graph');
      setError(null);
      go('building');
      try {
        await backend.buildGraph({
          examId,
          subject,
          syllabus,
          examDate: Date.now() + draftDays * DAY_MS,
          grade,
          board,
        });
        const list = await refreshExams(uid);
        setActiveExamId(examId);
        setDraftSubject(null);
        setDraftSyllabus('');
        setDraftDays(30);
        if (list.find((e) => e.id === examId)?.graphStatus === 'ready') go('home');
        else go('exams');
      } catch (e) {
        fail(e);
        if (uid) await refreshExams(uid);
        go('exams');
      } finally {
        setBusy(null);
      }
    },

    openExam: (examId: string) => {
      setActiveExamId(examId);
      const exam = exams.find((e) => e.id === examId);
      go(exam?.graphStatus === 'ready' ? 'home' : 'exams');
    },
    pickSubjectPill: (examId: string) => setActiveExamId(examId),
    examsCta: () => { if (readyExams[0]) { setActiveExamId(readyExams[0].id); go('home'); } },

    refreshPlan: async () => { if (activeExamId) await loadGraph(activeExamId); },

    resetThread: async () => {
      if (!activeExamId || !plan?.conceptId) return;
      try { await backend.resetThread(activeExamId, plan.conceptId); } catch (e) { fail(e); }
    },

    // ── the check ─────────────────────────────────────────────────────────
    startCheck: async () => {
      if (!activeExamId || !plan?.conceptId) return;
      setBusy('check');
      setError(null);
      setResult(null);
      setCheck({ ...emptyCheck(), conceptId: plan.conceptId, conceptName: plan.conceptName });
      go('check');
      try {
        const started = await backend.startCheck(activeExamId, plan.conceptId);
        setCheck((c) => ({ ...c, checkId: started.checkId, questions: started.questions }));
      } catch (e) { fail(e); } finally { setBusy(null); }
    },

    /** Commit an answer. The server records it and explains that one question. */
    answerCheck: async (pick: number) => {
      if (!activeExamId || !check.checkId || check.revealed) return;
      setCheck((c) => ({ ...c, sel: pick }));
      setBusy('answer');
      try {
        const revealed = await backend.answerQuestion(activeExamId, check.checkId, check.qi, pick);
        setCheck((c) => ({ ...c, revealed, picks: withPick(c.picks, c.qi, pick) }));
      } catch (e) {
        fail(e);
        setCheck((c) => ({ ...c, sel: null }));
      } finally { setBusy(null); }
    },

    nextCheck: async () => {
      if (!activeExamId || !check.checkId || !check.revealed) return;
      if (check.qi < check.questions.length - 1) {
        setCheck((c) => ({ ...c, qi: c.qi + 1, sel: null, revealed: null }));
        return;
      }
      setBusy('submit');
      try {
        const graded = await backend.submitCheck(activeExamId, check.checkId, check.picks);
        setResult(graded);
        setPlan(graded.next);
        go('checkresult');
        // Mastery moved, so the graph the rest of the app renders is stale.
        const graph = await backend.getGraph(activeExamId);
        setNodes(graph.nodes);
      } catch (e) { fail(e); } finally { setBusy(null); }
    },

    /** Failed the check — go back into the lesson for another angle. */
    reteach: () => { setCheck(emptyCheck()); go('nexora'); },
    finishCheck: () => { setCheck(emptyCheck()); setResult(null); go('home'); },
  }), [
    go, fail, uid, phoneOk, otpOk, detailsOk, name, grade, board, atCap, prime,
    exams, draftSubject, draftSyllabus, draftDays, activeExamId, plan, check,
    readyExams, loadGraph, refreshExams,
  ]);

  return {
    route, uid, authReady, busy, error,
    phone, otp, name, grade, board, prime,
    digits, otpDigits, phoneOk, otpOk, detailsOk, firstName,
    exams, activeExam, activeExamId, activeName, readyExams, pendingExams, atCap, needsPrime,
    nodes, plan, focusNode, readiness, masteredCount, byId,
    subjectOptions, draftSubject, draftDays, draftSyllabus, draftPct,
    check, checkQ, checkTotal, result,
    actions,
  };
}

function withPick(picks: number[], index: number, pick: number): number[] {
  const next = picks.slice();
  next[index] = pick;
  return next;
}

type AppContextValue = ReturnType<typeof useAppStateImpl>;
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  return <AppContext.Provider value={useAppStateImpl()}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { DAY_CHOICES, dateLabel };
