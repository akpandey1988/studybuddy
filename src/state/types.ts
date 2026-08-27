import type { Subject } from '../data/catalog';

export type Route =
  | 'login' | 'otp' | 'details'
  | 'exams' | 'prime' | 'addsub' | 'syllabus'
  | 'quiz' | 'result'
  | 'home' | 'nexora' | 'check' | 'checkresult' | 'progress' | 'badges'
  | 'friends' | 'fchat' | 'call' | 'group' | 'parent';

export type Exam = {
  id: number;
  subject: string;
  days: number;
  dateLabel: string;
  syllabus: boolean;
  picks: (number | undefined)[];
  baselineDone: boolean;
  /** Per-topic mastery, keyed by topic name. Built up by repeated checks. */
  mastery: Record<string, TopicProgress>;
};

/** One generated multiple-choice question used in a topic check. */
export type PracticeQuestion = {
  q: string;
  opts: string[];
  answer: number;
  /** One-sentence reason the answer is right, shown after the student picks. */
  why: string;
};

export type TopicProgress = {
  /** Checks taken on this topic. */
  attempts: number;
  /** Times Nexora has taught this topic. */
  lessons: number;
  lastScore: number;
  bestScore: number;
  outOf: number;
  mastered: boolean;
  /** Questions missed on the last check — fed back to Nexora to re-teach. */
  missed: string[];
};

/** The check-quiz in flight. */
export type CheckState = {
  topic: string | null;
  questions: PracticeQuestion[];
  qi: number;
  sel: number | null;
  /** True once the student has committed to an answer and sees the explanation. */
  revealed: boolean;
  picks: number[];
};

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
  /** Kickoff turn that starts the lesson — sent to Claude, not shown in the thread. */
  hidden?: boolean;
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
  /** Nexora chat threads, keyed by `${examId}::${topic}` — see chatKey(). */
  chats: Record<string, ChatTurn[]>;
  check: CheckState;
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
  /** Topics not yet proved by a check, weakest first. Drives the learn loop. */
  gaps: string[];
  masteredCount: number;
  mastery: Record<string, TopicProgress>;
  focus: string;
  allStrong: boolean;
  allMastered: boolean;
};
