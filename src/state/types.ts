import type { Subject } from '../data/catalog';

export type Route =
  | 'login' | 'otp' | 'details'
  | 'exams' | 'prime' | 'addsub' | 'syllabus'
  | 'quiz' | 'result'
  | 'home' | 'nexora' | 'progress' | 'badges'
  | 'friends' | 'fchat' | 'call' | 'group' | 'parent';

export type Exam = {
  id: number;
  subject: string;
  days: number;
  dateLabel: string;
  syllabus: boolean;
  picks: (number | undefined)[];
  baselineDone: boolean;
};

export type AppData = {
  route: Route;
  phone: string;
  otp: string;
  name: string;
  grade: number | null;
  board: string | null;
  prime: boolean;
  exams: Exam[];
  activeId: number | null;
  qi: number;
  sel: number | null;
  draftSubject: string | null;
  draftDays: number;
  nextId: number;
};

export type TopicLevel = 'Not tested' | 'Needs work' | 'Getting there' | 'Strong';

export type TopicStat = {
  name: string;
  level: number; // 0-5
  label: TopicLevel;
};

export type ExamStats = {
  cat: Subject;
  correct: number;
  readiness: number;
  topics: TopicStat[];
  weak: string[];
  mid: string[];
  untested: string[];
  focus: string;
  allStrong: boolean;
};
