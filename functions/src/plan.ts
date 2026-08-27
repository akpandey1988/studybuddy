// Given the graph and where the student stands, decide the single most useful
// thing to do next — and be able to say why in a sentence a 12-year-old gets.
//
// The graph's whole point is this: when a student keeps failing something, the
// cause is usually a prerequisite they never had. Rather than drilling the
// thing they're failing, we walk *down* the prerequisite chain and fix the
// cause. Pure functions, no I/O.

import { MASTERED_AT, effectiveStrength } from './mastery.js';
import type { ConceptNode, NextStep } from './types.js';

const DAY_MS = 86_400_000;

type Scored = { node: ConceptNode; eff: number; score: number };

export function planNextStep(
  nodes: ConceptNode[],
  now: number,
  examDate: number,
): NextStep {
  const daysToExam = Math.max(0, Math.ceil((examDate - now) / DAY_MS));

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const eff = new Map(nodes.map((n) => [n.id, effectiveStrength(n, now)]));
  const isMastered = (id: string) => (eff.get(id) ?? 0) >= MASTERED_AT;

  const totalWeight = nodes.reduce((s, n) => s + n.weight, 0) || 1;
  const readiness = nodes.reduce((s, n) => s + n.weight * (eff.get(n.id) ?? 0), 0) / totalWeight;

  const dueForReview = nodes
    .filter((n) => isMastered(n.id) && n.dueAt !== null && n.dueAt <= now)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))
    .map((n) => ({ id: n.id, name: n.name }));

  const unmastered = nodes.filter((n) => !isMastered(n.id));

  if (unmastered.length === 0) {
    return {
      action: dueForReview.length > 0 ? 'review' : 'done',
      conceptId: dueForReview[0]?.id ?? null,
      conceptName: dueForReview[0]?.name ?? '',
      reason: dueForReview.length > 0
        ? `You know all of this. ${dueForReview[0].name} is due a quick revision so it holds until exam day.`
        : 'Every concept in the syllabus is solid. Keep revising to hold it.',
      blockedBy: [], unlocks: null, dueForReview, readiness, daysToExam,
    };
  }

  // Revision wins when things are actually slipping, or when the exam is close
  // enough that holding what you have beats starting something new.
  const reviewFirst = dueForReview.length >= 3 || (daysToExam <= 7 && dueForReview.length > 0);
  if (reviewFirst) {
    const top = dueForReview[0];
    return {
      action: 'review',
      conceptId: top.id,
      conceptName: top.name,
      reason: daysToExam <= 7
        ? `${daysToExam} days left — ${top.name} is fading and it's worth more than starting something new.`
        : `${dueForReview.length} topics are going stale. ${top.name} first.`,
      blockedBy: [], unlocks: null, dueForReview, readiness, daysToExam,
    };
  }

  // Value = how much of the exam this is worth × how much of it is missing.
  // As the exam nears, lean harder on weight and away from deep foundations.
  const urgency = daysToExam <= 14 ? 1.6 : daysToExam <= 30 ? 1.2 : 1;
  const scored: Scored[] = unmastered.map((node) => {
    const e = eff.get(node.id) ?? 0;
    const value = Math.pow(node.weight, urgency) * (1 - e);
    // Shallow, easier things first when time is short; depth costs more then.
    const depthPenalty = 1 + (node.depth * (daysToExam <= 14 ? 0.25 : 0.08));
    return { node, eff: e, score: value / depthPenalty };
  }).sort((a, b) => b.score - a.score);

  const goal = scored[0].node;
  const { target, chain } = descendToTeachable(goal, byId, isMastered);

  const blockedBy = target.id === goal.id
    ? []
    : goal.prereqs
      .filter((id) => !isMastered(id))
      .map((id) => byId.get(id))
      .filter((n): n is ConceptNode => Boolean(n))
      .map((n) => ({ id: n.id, name: n.name, strength: round2(eff.get(n.id) ?? 0) }));

  const taught = target.lessons > 0;
  const action = taught ? 'practise' : 'learn';

  return {
    action,
    conceptId: target.id,
    conceptName: target.name,
    reason: buildReason(target, goal, chain.length, taught, eff.get(target.id) ?? 0, daysToExam),
    blockedBy,
    unlocks: target.id === goal.id ? null : { id: goal.id, name: goal.name },
    dueForReview,
    readiness,
    daysToExam,
  };
}

/**
 * Walk down from a concept to the shallowest thing the student can actually
 * be taught right now: the first node on the chain whose prerequisites are
 * all solid. Cycle-safe, though buildGraph rejects cycles up front.
 */
function descendToTeachable(
  start: ConceptNode,
  byId: Map<string, ConceptNode>,
  isMastered: (id: string) => boolean,
): { target: ConceptNode; chain: ConceptNode[] } {
  const chain: ConceptNode[] = [];
  const seen = new Set<string>();
  let current = start;

  while (!seen.has(current.id)) {
    seen.add(current.id);
    const gaps = current.prereqs
      .filter((id) => !isMastered(id))
      .map((id) => byId.get(id))
      .filter((n): n is ConceptNode => Boolean(n));

    if (gaps.length === 0) return { target: current, chain };

    // Fix the weakest missing foundation first.
    gaps.sort((a, b) => a.strength - b.strength || b.weight - a.weight);
    chain.push(current);
    current = gaps[0];
  }
  return { target: current, chain };
}

function buildReason(
  target: ConceptNode,
  goal: ConceptNode,
  depthDropped: number,
  taught: boolean,
  strength: number,
  daysToExam: number,
): string {
  if (depthDropped > 0) {
    return `${goal.name} is what the exam wants, but it needs ${target.name} first — `
      + `and that one isn't solid yet. Fixing it here unlocks ${goal.name}.`;
  }
  if (target.attempts > 0 && strength < MASTERED_AT) {
    return `You got ${target.lastScore} of ${target.lastOutOf} on ${target.name} last time. `
      + 'Another angle on it, then a fresh check.';
  }
  if (taught) return `Nexora has taught ${target.name}. Time to prove it.`;
  if (daysToExam <= 14) {
    return `${daysToExam} days left and ${target.name} is worth a lot of marks. Starting here.`;
  }
  return `${target.name} is the next thing the syllabus builds on, and nothing is blocking it.`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
