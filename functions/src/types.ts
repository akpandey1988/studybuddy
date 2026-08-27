// The knowledge graph: what the syllabus says a student must be able to do,
// plus where this particular student stands on each of those things.

/** A node in the graph — one thing the student must be able to do. */
export type Concept = {
  id: string;
  name: string;
  /** Syllabus chapter this belongs to. */
  chapter: string;
  /** One line, phrased as a capability: "Compare two fractions with unlike denominators". */
  summary: string;
  /** Ids of concepts that must be solid before this one is teachable. */
  prereqs: string[];
  /** How much of the exam this is worth, 0..1. Normalised across the graph. */
  weight: number;
  /** 1 (easiest) .. 5 (hardest). */
  difficulty: number;
  /** Longest prerequisite chain behind this node. Computed, not generated. */
  depth: number;
};

export type MasteryState = 'unknown' | 'learning' | 'shaky' | 'mastered';

/** The student's standing on one concept. */
export type ConceptProgress = {
  state: MasteryState;
  /** 0..1, before decay is applied. */
  strength: number;
  attempts: number;
  lessons: number;
  lastScore: number;
  lastOutOf: number;
  /** Epoch ms of the last graded attempt. */
  lastSeenAt: number | null;
  /** Epoch ms this should be revised by, to still be solid on exam day. */
  dueAt: number | null;
  /** Questions missed last time — fed back into the next lesson. */
  missed: string[];
};

/** A graph node joined with the student's progress on it. */
export type ConceptNode = Concept & ConceptProgress;

export type Exam = {
  subject: string;
  /** Epoch ms. */
  examDate: number;
  grade: number | null;
  board: string | null;
  graphStatus: 'pending' | 'ready' | 'failed';
  conceptCount: number;
};

export type Student = {
  name: string;
  grade: number | null;
  board: string | null;
};

/** What the planner decided the student should do right now, and why. */
export type NextStep = {
  action: 'learn' | 'practise' | 'review' | 'done';
  conceptId: string | null;
  conceptName: string;
  /** Plain-language justification, shown to the student. */
  reason: string;
  /** Unmastered prerequisites that forced us down to this node. */
  blockedBy: { id: string; name: string; strength: number }[];
  /** The higher-value concept this unblocks, if we dropped down to a prereq. */
  unlocks: { id: string; name: string } | null;
  /** Concepts due for revision so they hold until exam day. */
  dueForReview: { id: string; name: string }[];
  /** 0..1 across the whole graph, weighted by exam importance. */
  readiness: number;
  daysToExam: number;
};

export type ChatTurn = {
  role: 'user' | 'assistant';
  content: string;
  /** Sent to Claude but not shown in the thread (kickoff / re-teach asks). */
  hidden?: boolean;
};

export const emptyProgress = (): ConceptProgress => ({
  state: 'unknown',
  strength: 0,
  attempts: 0,
  lessons: 0,
  lastScore: 0,
  lastOutOf: 0,
  lastSeenAt: null,
  dueAt: null,
  missed: [],
});
