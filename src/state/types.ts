export type Route =
  | 'login' | 'otp' | 'details'
  | 'exams' | 'prime' | 'addsub' | 'syllabus'
  | 'building'
  | 'home' | 'nexora' | 'check' | 'checkresult' | 'progress' | 'badges'
  | 'friends' | 'fchat' | 'call' | 'group' | 'parent';

export type { ConceptNode, NextStep, CheckQuestion, GradedQuestion, CheckResult } from '../services/backend';
export type { ExamRecord, Profile } from '../services/store';

/** A check in flight. The answer key stays on the server. */
export type CheckState = {
  conceptId: string | null;
  conceptName: string;
  checkId: string | null;
  questions: { q: string; opts: string[] }[];
  qi: number;
  sel: number | null;
  /** Set once the server has recorded the pick and returned its explanation. */
  revealed: { correct: boolean; answer: number; why: string } | null;
  picks: number[];
};

export type Busy =
  | null
  | 'auth'
  | 'profile'
  | 'exams'
  | 'graph'
  | 'plan'
  | 'check'
  | 'answer'
  | 'submit';
