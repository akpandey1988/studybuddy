// How a graded attempt moves a concept's strength, and when it needs revising.
// Pure functions — no Firestore, no network — so the rules are testable and
// the same maths runs on the client if we ever want an optimistic update.

import type { ConceptProgress, MasteryState } from './types.js';

export const MASTERED_AT = 0.8;
export const SHAKY_AT = 0.45;

/** Knowledge fades. Half-life in days for an unrevised concept. */
const HALF_LIFE_DAYS = 14;
const DAY_MS = 86_400_000;

/** How much one attempt moves the needle. Recent evidence dominates. */
const LEARNING_RATE = 0.55;

/**
 * Strength discounted for time since it was last demonstrated. The planner
 * works in effective strength so a topic proved three weeks ago and never
 * revisited stops counting as solid.
 */
export function effectiveStrength(p: ConceptProgress, now: number): number {
  if (p.lastSeenAt === null || p.strength === 0) return p.strength;
  const days = Math.max(0, (now - p.lastSeenAt) / DAY_MS);
  return p.strength * Math.pow(0.5, days / HALF_LIFE_DAYS);
}

export function stateFor(strength: number, attempts: number): MasteryState {
  if (attempts === 0) return 'unknown';
  if (strength >= MASTERED_AT) return 'mastered';
  if (strength >= SHAKY_AT) return 'shaky';
  return 'learning';
}

/**
 * Spacing: each solid showing pushes the next revision further out, but never
 * past the exam — the last revision must land before the student sits it.
 */
export function nextDueAt(
  strength: number, attempts: number, now: number, examDate: number,
): number | null {
  if (strength < SHAKY_AT) return now; // not solid — keep it in the active pool
  const base = strength >= MASTERED_AT ? 3 : 1.5;
  const intervalDays = Math.min(base * Math.pow(1.8, Math.max(0, attempts - 1)), 21);
  const due = now + intervalDays * DAY_MS;
  if (examDate <= now) return due;
  // Always leave one revision before the exam.
  return Math.min(due, examDate - DAY_MS);
}

/** Apply one graded attempt to a concept's progress. */
export function applyAttempt(
  prev: ConceptProgress,
  score: number,
  outOf: number,
  missed: string[],
  now: number,
  examDate: number,
): ConceptProgress {
  const ratio = outOf > 0 ? score / outOf : 0;
  // First attempt sets the baseline outright; later ones blend so a single
  // unlucky run cannot erase a well-established concept.
  const strength = prev.attempts === 0
    ? ratio
    : clamp01(prev.strength + LEARNING_RATE * (ratio - prev.strength));
  const attempts = prev.attempts + 1;

  return {
    ...prev,
    strength,
    attempts,
    state: stateFor(strength, attempts),
    lastScore: score,
    lastOutOf: outOf,
    lastSeenAt: now,
    dueAt: nextDueAt(strength, attempts, now, examDate),
    missed,
  };
}

export function noteLesson(prev: ConceptProgress): ConceptProgress {
  return { ...prev, lessons: prev.lessons + 1 };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
