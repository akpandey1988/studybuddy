// Turning a syllabus into a knowledge graph.
//
// Claude reads the syllabus and returns concepts plus prerequisite edges; this
// module then does the parts a language model should not be trusted with —
// rejecting cycles, resolving dangling edges, computing depth, and normalising
// weights so they sum to 1.

import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { MODEL, claude } from './claude.js';
import type { Concept } from './types.js';

const RawConcept = z.object({
  id: z.string(),
  name: z.string(),
  chapter: z.string(),
  summary: z.string(),
  prereqs: z.array(z.string()),
  weight: z.number(),
  difficulty: z.number(),
});
const RawGraph = z.object({ concepts: z.array(RawConcept) });

export type BuildGraphInput = {
  subject: string;
  grade: number | null;
  board: string | null;
  /** Raw syllabus text, or a chapter list the student typed in. */
  syllabus: string;
};

export async function buildConceptGraph(input: BuildGraphInput): Promise<Concept[]> {
  const prompt = [
    `Break this ${input.subject} syllabus into a prerequisite graph of learnable concepts for a grade ${input.grade ?? 7} student on the ${input.board ?? 'CBSE'} board.`,
    '',
    'SYLLABUS',
    input.syllabus.trim(),
    '',
    'Rules:',
    '- A concept is one thing the student can be taught in about 10 minutes and then tested on. Not a whole chapter.',
    '- Aim for 15-40 concepts. Split a chapter into several concepts where it earns it.',
    '- "id" is lowercase kebab-case, unique, stable and derived from the name.',
    '- "summary" states the capability, starting with a verb: "Compare two fractions with unlike denominators".',
    '- "prereqs" lists ids of concepts from THIS list that must be solid first. Most concepts have 0-2. Use them only for genuine dependencies, not for chapter ordering.',
    '- The prerequisite relation must be acyclic. Never make two concepts depend on each other.',
    '- Foundational concepts that the syllabus assumes but does not teach should still appear, with no prereqs, so a struggling student has somewhere to drop back to.',
    '- "weight" is roughly the share of exam marks, 0 to 1 across all concepts. Weight what the syllabus emphasises.',
    '- "difficulty" is 1 (easiest) to 5 (hardest) for this grade.',
  ].join('\n');

  // Streamed rather than a plain parse call: the SDK refuses non-streaming
  // requests whose max_tokens implies more than ten minutes of work, and a
  // whole-syllabus graph at high effort is exactly that.
  const stream = claude().messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: 'adaptive' },
    // Structuring a syllabus into a dependency graph is the one genuinely
    // hard reasoning step in the product — worth the effort budget.
    output_config: { effort: 'high', format: zodOutputFormat(RawGraph) },
    messages: [{ role: 'user', content: prompt }],
  });

  const response = await stream.finalMessage();
  const parsed = response.parsed_output;
  if (!parsed || parsed.concepts.length === 0) {
    throw new Error('Could not read that syllabus into concepts.');
  }
  return normaliseGraph(parsed.concepts);
}

/**
 * Make a model-produced graph safe to store: dedupe ids, drop edges that point
 * nowhere, break any cycles, compute depth, and normalise weights.
 * Exported for tests.
 */
export function normaliseGraph(raw: z.infer<typeof RawConcept>[]): Concept[] {
  // Dedupe by id, first occurrence wins.
  const seen = new Set<string>();
  const concepts = raw.filter((c) => {
    const id = c.id.trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const ids = new Set(concepts.map((c) => c.id));
  const cleaned = concepts.map((c) => ({
    ...c,
    // Drop self-edges and edges to concepts that aren't in the graph.
    prereqs: Array.from(new Set(c.prereqs.filter((p) => p !== c.id && ids.has(p)))),
    difficulty: Math.min(5, Math.max(1, Math.round(c.difficulty || 3))),
    weight: Math.max(0, c.weight || 0),
  }));

  const acyclic = breakCycles(cleaned);
  const depth = computeDepth(acyclic);

  const total = acyclic.reduce((s, c) => s + c.weight, 0);
  return acyclic.map((c) => ({
    id: c.id,
    name: c.name,
    chapter: c.chapter,
    summary: c.summary,
    prereqs: c.prereqs,
    difficulty: c.difficulty,
    // Fall back to an even split if the model gave us all zeros.
    weight: total > 0 ? c.weight / total : 1 / acyclic.length,
    depth: depth.get(c.id) ?? 0,
  }));
}

type Edged = { id: string; prereqs: string[] } & Record<string, unknown>;

/**
 * Remove the minimum obvious set of back-edges so the graph is a DAG. A cyclic
 * prerequisite graph would make the planner descend forever, and there is no
 * sane way to teach two concepts that each require the other.
 */
function breakCycles<T extends Edged>(concepts: T[]): T[] {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const colour = new Map<string, 0 | 1 | 2>(); // 0 unvisited, 1 in-stack, 2 done
  const removed = new Set<string>(); // "from->to"

  const visit = (id: string) => {
    colour.set(id, 1);
    const node = byId.get(id);
    if (node) {
      for (const p of node.prereqs) {
        const c = colour.get(p) ?? 0;
        if (c === 1) removed.add(`${id}->${p}`); // back-edge: cut it
        else if (c === 0) visit(p);
      }
    }
    colour.set(id, 2);
  };

  for (const c of concepts) if ((colour.get(c.id) ?? 0) === 0) visit(c.id);
  if (removed.size === 0) return concepts;

  return concepts.map((c) => ({
    ...c,
    prereqs: c.prereqs.filter((p) => !removed.has(`${c.id}->${p}`)),
  }));
}

/** Longest prerequisite chain behind each node. Assumes an acyclic graph. */
export function computeDepth(concepts: Edged[]): Map<string, number> {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const depth = new Map<string, number>();

  const of = (id: string, stack: Set<string>): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (stack.has(id)) return 0;
    const node = byId.get(id);
    if (!node || node.prereqs.length === 0) {
      depth.set(id, 0);
      return 0;
    }
    stack.add(id);
    const d = 1 + Math.max(...node.prereqs.map((p) => of(p, stack)));
    stack.delete(id);
    depth.set(id, d);
    return d;
  };

  for (const c of concepts) of(c.id, new Set());
  return depth;
}
