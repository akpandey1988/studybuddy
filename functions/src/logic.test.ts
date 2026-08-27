import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyAttempt, effectiveStrength, nextDueAt } from './mastery.js';
import { buildContent, computeDepth, normaliseGraph } from './graph.js';
import { planNextStep } from './plan.js';
import { emptyProgress } from './types.js';
import type { ConceptNode } from './types.js';

const DAY = 86_400_000;
const NOW = 1_800_000_000_000;
const EXAM = NOW + 30 * DAY;

// ── mastery ────────────────────────────────────────────────────────────────

test('a first attempt sets strength outright', () => {
  const p = applyAttempt(emptyProgress(), 3, 4, ['q'], NOW, EXAM);
  assert.equal(p.strength, 0.75);
  assert.equal(p.attempts, 1);
  assert.equal(p.state, 'shaky');
});

test('a later bad run dents but does not erase an established concept', () => {
  const strong = applyAttempt(emptyProgress(), 4, 4, [], NOW, EXAM);
  const dented = applyAttempt(strong, 1, 4, ['a'], NOW, EXAM);
  assert.ok(dented.strength < strong.strength, 'should drop');
  assert.ok(dented.strength > 0.25, 'should not collapse to the new ratio alone');
});

test('strength decays when a concept is left alone', () => {
  const p = { ...emptyProgress(), strength: 1, lastSeenAt: NOW - 14 * DAY };
  assert.ok(Math.abs(effectiveStrength(p, NOW) - 0.5) < 0.001, 'half-life is 14 days');
  assert.equal(effectiveStrength({ ...p, lastSeenAt: NOW }, NOW), 1);
});

test('revision is always scheduled before the exam', () => {
  const soon = NOW + 2 * DAY;
  const due = nextDueAt(0.95, 6, NOW, soon);
  assert.ok(due !== null && due < soon, 'must leave a revision before exam day');
});

// ── graph normalisation ────────────────────────────────────────────────────

const raw = (id: string, prereqs: string[] = [], weight = 1) => ({
  id, name: id, chapter: 'ch', summary: 's', prereqs, weight, difficulty: 3,
});

test('dangling and self edges are dropped', () => {
  const g = normaliseGraph([raw('a', ['a', 'ghost']), raw('b', ['a'])]);
  assert.deepEqual(g.find((c) => c.id === 'a')!.prereqs, []);
  assert.deepEqual(g.find((c) => c.id === 'b')!.prereqs, ['a']);
});

test('duplicate ids collapse to one node', () => {
  const g = normaliseGraph([raw('a'), raw('a'), raw('b')]);
  assert.equal(g.length, 2);
});

test('cycles are broken so the planner cannot descend forever', () => {
  const g = normaliseGraph([raw('a', ['b']), raw('b', ['c']), raw('c', ['a'])]);
  const edges = g.flatMap((c) => c.prereqs.map((p) => `${c.id}->${p}`));
  assert.ok(edges.length < 3, 'at least one back-edge removed');
  // Depth must terminate.
  const d = computeDepth(g);
  assert.equal(d.size, 3);
});

test('weights are normalised to sum to 1', () => {
  const g = normaliseGraph([raw('a', [], 3), raw('b', [], 1)]);
  const total = g.reduce((s, c) => s + c.weight, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  assert.ok(g.find((c) => c.id === 'a')!.weight > g.find((c) => c.id === 'b')!.weight);
});

test('depth is the longest prerequisite chain', () => {
  const g = normaliseGraph([raw('a'), raw('b', ['a']), raw('c', ['b'])]);
  assert.equal(g.find((c) => c.id === 'c')!.depth, 2);
});

// ── syllabus attachments ───────────────────────────────────────────────────

test('typed-only syllabus sends plain text, not a content array', () => {
  assert.equal(typeof buildContent('prompt'), 'string');
});

test('a PDF becomes a document block placed before the instructions', () => {
  const content = buildContent('prompt', {
    kind: 'pdf', mediaType: 'application/pdf', data: 'BASE64',
  }) as { type: string; source?: { media_type: string; data: string } }[];

  assert.equal(content[0].type, 'document', 'document must come first');
  assert.equal(content[0].source?.media_type, 'application/pdf');
  assert.equal(content[0].source?.data, 'BASE64');
  assert.equal(content[1].type, 'text');
});

test('a photo becomes an image block', () => {
  const content = buildContent('prompt', {
    kind: 'image', mediaType: 'image/png', data: 'BASE64',
  }) as { type: string; source?: { media_type: string } }[];

  assert.equal(content[0].type, 'image');
  assert.equal(content[0].source?.media_type, 'image/png');
});

test('an unsupported image media type falls back rather than erroring the API', () => {
  const content = buildContent('prompt', {
    kind: 'image', mediaType: 'image/heic', data: 'BASE64',
  }) as { type: string; source?: { media_type: string } }[];

  // Claude rejects unknown image types outright; a phone that reports HEIC
  // should still get a usable request.
  assert.equal(content[0].source?.media_type, 'image/jpeg');
});

// ── planner ────────────────────────────────────────────────────────────────

const node = (over: Partial<ConceptNode>): ConceptNode => ({
  id: 'x', name: 'X', chapter: 'ch', summary: 's', prereqs: [],
  weight: 0.5, difficulty: 3, depth: 0, ...emptyProgress(), ...over,
});

test('drops down to the missing prerequisite instead of drilling the failure', () => {
  const plan = planNextStep([
    node({ id: 'basics', name: 'Equivalent fractions', weight: 0.2, strength: 0.2, attempts: 1, lastSeenAt: NOW }),
    node({ id: 'goal', name: 'Ratio word problems', weight: 0.8, prereqs: ['basics'], depth: 1 }),
  ], NOW, EXAM);

  assert.equal(plan.conceptId, 'basics', 'should teach the prerequisite, not the goal');
  assert.equal(plan.unlocks?.id, 'goal');
  assert.deepEqual(plan.blockedBy.map((b) => b.id), ['basics']);
  assert.match(plan.reason, /Ratio word problems.*needs Equivalent fractions/);
});

test('teaches the goal directly once its prerequisites are solid', () => {
  const plan = planNextStep([
    node({ id: 'basics', name: 'Equivalent fractions', weight: 0.2, strength: 0.95, attempts: 2, lastSeenAt: NOW }),
    node({ id: 'goal', name: 'Ratio word problems', weight: 0.8, prereqs: ['basics'], depth: 1 }),
  ], NOW, EXAM);

  assert.equal(plan.conceptId, 'goal');
  assert.equal(plan.unlocks, null);
  assert.deepEqual(plan.blockedBy, []);
});

test('an untaught concept is learn; a taught one is practise', () => {
  const base = node({ id: 'a', name: 'A' });
  assert.equal(planNextStep([base], NOW, EXAM).action, 'learn');
  assert.equal(planNextStep([{ ...base, lessons: 1 }], NOW, EXAM).action, 'practise');
});

test('revision takes over when several concepts are going stale', () => {
  const stale = (id: string) => node({
    id, name: id, strength: 0.95, attempts: 2, lastSeenAt: NOW - DAY, dueAt: NOW - DAY,
  });
  const plan = planNextStep([stale('a'), stale('b'), stale('c')], NOW, EXAM);
  assert.equal(plan.action, 'review');
  assert.equal(plan.dueForReview.length, 3);
});

test('nothing left to learn reports done', () => {
  const plan = planNextStep(
    [node({ id: 'a', strength: 0.95, attempts: 2, lastSeenAt: NOW, dueAt: NOW + 5 * DAY })],
    NOW, EXAM,
  );
  assert.equal(plan.action, 'done');
  assert.ok(plan.readiness > 0.9);
});

test('readiness is weighted by exam importance, not a topic count', () => {
  const plan = planNextStep([
    node({ id: 'big', weight: 0.9, strength: 1, attempts: 1, lastSeenAt: NOW }),
    node({ id: 'small', weight: 0.1, strength: 0, attempts: 0 }),
  ], NOW, EXAM);
  assert.ok(Math.abs(plan.readiness - 0.9) < 0.01, `expected ~0.9, got ${plan.readiness}`);
});

test('a concept mastered long ago stops counting as solid', () => {
  const long = node({ id: 'a', name: 'A', strength: 0.9, attempts: 2, lessons: 1, lastSeenAt: NOW - 60 * DAY });
  const plan = planNextStep([long], NOW, EXAM);
  assert.notEqual(plan.action, 'done', 'decayed below mastery, so it is back in the pool');
  assert.equal(plan.conceptId, 'a');
  assert.ok(plan.readiness < 0.2, `readiness should reflect the decay, got ${plan.readiness}`);

  // Same node seen today is solid and needs nothing.
  const fresh = planNextStep([{ ...long, lastSeenAt: NOW }], NOW, EXAM);
  assert.equal(fresh.action, 'done');
});
