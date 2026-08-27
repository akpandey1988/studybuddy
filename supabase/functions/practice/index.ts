// Generates a fresh topic check — the "prove you've got it" half of the
// learn loop. Questions are generated per attempt so a student who retries
// cannot pass by remembering which option was right last time.

import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

const MODEL = 'claude-opus-5';

const QuestionSchema = z.object({
  q: z.string(),
  opts: z.array(z.string()),
  answer: z.number(),
  why: z.string(),
});
const CheckSchema = z.object({ questions: z.array(QuestionSchema) });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY is not set on this function.' }, 500);

  let topic: string;
  let count: number;
  let grade: number | null;
  let board: string | null;
  let subject: string;
  let attempt: number;
  let missed: string[];
  try {
    const body = await req.json();
    topic = body.topic;
    subject = body.subject;
    count = Math.min(Math.max(Number(body.count) || 4, 1), 8);
    grade = body.grade ?? null;
    board = body.board ?? null;
    attempt = Number(body.attempt) || 1;
    missed = Array.isArray(body.missed) ? body.missed : [];
    if (!topic || !subject) throw new Error('topic and subject are required');
  } catch (e) {
    return json({ error: `Bad request: ${(e as Error).message}` }, 400);
  }

  const prompt = [
    `Write ${count} multiple-choice questions to check whether a grade ${grade ?? 7} student on the ${board ?? 'CBSE'} board has understood "${topic}" in ${subject}.`,
    '',
    'Rules:',
    `- Exactly 4 options per question. "answer" is the 0-based index of the correct one.`,
    '- Put the correct option in a different position each time — do not always use the same index.',
    '- Test understanding, not recall of wording. Each question should need a small piece of reasoning.',
    '- Use concrete Indian everyday context (rupees, cricket, trains, food, local distances) where it fits naturally.',
    '- Keep each question under 30 words and each option under 10 words.',
    '- "why" is one plain sentence saying why the correct option is right, written to the student. No markdown.',
    '- Vary difficulty: start easier, end harder.',
  ];

  if (attempt > 1) {
    prompt.push(
      '',
      `This is attempt ${attempt} — the student did not pass earlier attempts, so write completely fresh questions covering the same idea from different angles. Do not reuse earlier numbers or phrasing.`,
    );
  }
  if (missed.length) {
    prompt.push(
      '',
      'They got these wrong last time, so make sure the same underlying idea is tested again (reworded, different numbers):',
      ...missed.map((m) => `- ${m}`),
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'medium',
        format: zodOutputFormat(CheckSchema),
      },
      messages: [{ role: 'user', content: prompt.join('\n') }],
    });

    const parsed = response.parsed_output;
    if (!parsed) return json({ error: 'Could not build a check for that topic. Try again.' }, 502);

    // Drop anything malformed rather than showing a question with no right answer.
    const questions = parsed.questions.filter(
      (q) => q.opts.length === 4 && q.answer >= 0 && q.answer < 4 && q.q.trim() && q.why.trim(),
    );
    if (questions.length === 0) return json({ error: 'Could not build a check for that topic. Try again.' }, 502);

    return json({ questions });
  } catch (err) {
    const message =
      err instanceof Anthropic.RateLimitError
        ? 'Too many questions at once — try again in a moment.'
        : err instanceof Anthropic.AuthenticationError
          ? 'The Anthropic key on this function is invalid.'
          : err instanceof Anthropic.APIError
            ? `Claude API error ${err.status}: ${err.message}`
            : (err as Error).message;
    return json({ error: message }, 502);
  }
});
