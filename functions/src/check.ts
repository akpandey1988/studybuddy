// Generating a check for one concept, and grading it.
//
// Grading happens on the server for a reason: mastery drives the whole plan,
// so the client is never allowed to declare a concept learned. The client
// sends which options were picked; the server holds the answer key.

import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { MODEL, claude } from './claude.js';
import type { ConceptNode } from './types.js';

export const CHECK_SIZE = 4;
export const CHECK_PASS = 3;

const QuestionSchema = z.object({
  q: z.string(),
  opts: z.array(z.string()),
  answer: z.number(),
  why: z.string(),
});
const CheckSchema = z.object({ questions: z.array(QuestionSchema) });

export type PracticeQuestion = z.infer<typeof QuestionSchema>;

export async function generateQuestions(
  node: ConceptNode,
  subject: string,
  grade: number | null,
  board: string | null,
  count = CHECK_SIZE,
): Promise<PracticeQuestion[]> {
  const attempt = node.attempts + 1;
  const prompt = [
    `Write ${count} multiple-choice questions checking whether a grade ${grade ?? 7} student on the ${board ?? 'CBSE'} board can do this, in ${subject}:`,
    '',
    `Concept: ${node.name}`,
    `They must be able to: ${node.summary}`,
    `Chapter: ${node.chapter}. Difficulty for this grade: ${node.difficulty} out of 5.`,
    '',
    'Rules:',
    '- Test exactly this concept. Do not test neighbouring concepts or prerequisites.',
    '- Exactly 4 options. "answer" is the 0-based index of the correct one.',
    '- Put the correct option in a different position each time — never the same index throughout.',
    '- Test understanding, not recall of wording. Each needs a small piece of reasoning.',
    '- Use concrete Indian everyday context (rupees, cricket, trains, food) where it fits.',
    '- Each question under 30 words, each option under 10 words.',
    '- "why" is one plain sentence to the student explaining why the answer is right. No markdown.',
    '- Vary difficulty: start easier, end harder.',
  ];

  if (attempt > 1) {
    prompt.push(
      '',
      `This is attempt ${attempt}; earlier attempts were not passed. Write completely fresh questions on the same concept from different angles. Do not reuse earlier numbers or phrasing.`,
    );
  }
  if (node.missed.length) {
    prompt.push(
      '',
      'They got these wrong last time — test the same underlying idea again, reworded with different numbers:',
      ...node.missed.map((m) => `- ${m}`),
    );
  }

  const response = await claude().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: zodOutputFormat(CheckSchema) },
    messages: [{ role: 'user', content: prompt.join('\n') }],
  });

  const parsed = response.parsed_output;
  if (!parsed) throw new Error('Could not build a check for that concept.');

  // Never show a question with no valid answer.
  const questions = parsed.questions.filter(
    (q) => q.opts.length === 4 && q.answer >= 0 && q.answer < 4 && q.q.trim() && q.why.trim(),
  );
  if (questions.length === 0) throw new Error('Could not build a check for that concept.');
  return questions;
}

/** Grade picks against the stored key. Returns the score and what was missed. */
export function grade(
  questions: PracticeQuestion[], picks: number[],
): { score: number; missed: string[] } {
  const score = questions.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0);
  const missed = questions.filter((q, i) => picks[i] !== q.answer).map((q) => q.q);
  return { score, missed };
}
