// Reading a photo of a textbook page, worksheet or homework problem and
// deciding which concept in *this student's* graph it belongs to.
//
// Matching against their own graph is the whole point: it means the lesson
// that follows knows their mastery of the concept, what it depends on, and
// what it unlocks — rather than teaching the picture in isolation.

import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { MODEL, claude } from './claude.js';
import type { ConceptNode } from './types.js';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const MatchSchema = z.object({
  /** Id from the supplied list, or empty when nothing fits. */
  conceptId: z.string(),
  /** What the photo actually shows, in one sentence for the student. */
  whatItShows: z.string(),
  /** 'high' | 'medium' | 'low' — how sure the match is. */
  confidence: z.string(),
  /** Set when the picture is not covered by their syllabus at all. */
  offSyllabus: z.boolean(),
});

export type ConceptMatch = {
  conceptId: string | null;
  conceptName: string;
  whatItShows: string;
  confidence: 'high' | 'medium' | 'low';
  offSyllabus: boolean;
};

export async function identifyConcept(
  nodes: ConceptNode[],
  subject: string,
  grade: number | null,
  board: string | null,
  image: { mediaType: string; data: string },
): Promise<ConceptMatch> {
  if (nodes.length === 0) throw new Error('This exam has no plan yet.');

  const catalogue = nodes
    .map((n) => `${n.id} | ${n.name} (${n.chapter}) — ${n.summary}`)
    .join('\n');

  const prompt = [
    `A grade ${grade ?? 7} student on the ${board ?? 'CBSE'} board has photographed something from their ${subject} work — a textbook page, a worksheet, a question, or their own written attempt.`,
    '',
    'Work out which single concept from their syllabus it is really about.',
    '',
    'THEIR CONCEPTS (id | name (chapter) — what they must be able to do)',
    catalogue,
    '',
    'Rules:',
    '- "conceptId" must be an id copied exactly from the list above, or "" if genuinely none apply.',
    '- Choose what the student needs to *understand* to do the work, not merely what words appear.',
    '- If the photo shows a worked or attempted solution, match the underlying skill being practised.',
    '- "whatItShows" is one plain sentence addressed to the student, e.g. "This is a question about comparing two fractions." No markdown.',
    '- "confidence" is exactly one of: high, medium, low.',
    '- Set "offSyllabus" true only when the content genuinely is not in the list — a hard photo you can still place is not off-syllabus.',
    '- If the image is unreadable, blank, or not schoolwork at all, use "" for conceptId, say so in "whatItShows", and set confidence low.',
  ].join('\n');

  const mediaType = IMAGE_TYPES.has(image.mediaType)
    ? (image.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
    : 'image/jpeg';

  const response = await claude().messages.parse({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low', format: zodOutputFormat(MatchSchema) },
    messages: [{
      role: 'user',
      content: [
        // Image first: a document reads more reliably before the question about it.
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: image.data } },
        { type: 'text', text: prompt },
      ],
    }],
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error("Couldn't read that photo. Try again with the page in better light.");

  // Never trust a returned id blindly — it has to exist in their graph.
  const node = nodes.find((n) => n.id === parsed.conceptId) ?? null;
  const confidence = (['high', 'medium', 'low'] as const)
    .find((c) => c === parsed.confidence.toLowerCase()) ?? 'low';

  return {
    conceptId: node?.id ?? null,
    conceptName: node?.name ?? '',
    whatItShows: parsed.whatItShows,
    confidence,
    offSyllabus: parsed.offSyllabus || !node,
  };
}
