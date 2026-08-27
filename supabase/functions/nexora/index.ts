// Nexora tutor — streams a Claude reply back to the app as SSE.
//
// The Anthropic key lives here as an edge-function secret and never ships in
// the app bundle. Set it with:
//   supabase secrets set ANTHROPIC_API_KEY=...
// and locally via supabase/functions/.env (see .env.example).

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-opus-5';

// Tutor replies are deliberately short — this is a chat bubble on a phone,
// not a document — so max_tokens stays well under the streaming default.
const MAX_TOKENS = 2000;

type Student = {
  name: string;
  grade: number | null;
  board: string | null;
  subject: string;
  focus: string;
  readiness: number;
  topics: string[];
  weak: string[];
  mid: string[];
  untested: string[];
};

type Turn = { role: 'user' | 'assistant'; content: string };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function systemPrompt(s: Student): string {
  const list = (xs: string[]) => (xs.length ? xs.join(', ') : 'none');
  return [
    `You are Nexora, a warm, patient study buddy for ${s.name || 'a student'}, an Indian school student in grade ${s.grade ?? 'unknown'} on the ${s.board ?? 'unknown'} board.`,
    `Today's subject is ${s.subject}. The topic to work on is "${s.focus}".`,
    '',
    'What the baseline check told you about this student:',
    `- Readiness: ${s.readiness}% (target for exam day is 85%)`,
    `- Topics in this subject: ${list(s.topics)}`,
    `- Needs work: ${list(s.weak)}`,
    `- Getting there: ${list(s.mid)}`,
    `- Not yet tested: ${list(s.untested)}`,
    '',
    'How you teach:',
    '- Socratic first. Ask what the student thinks before you explain anything.',
    '- One question at a time. Never stack two questions in one message.',
    '- Keep every message under 60 words. This is a chat on a phone.',
    '- Use concrete, everyday examples (rupees, cricket, food, distances) over abstract notation.',
    '- A wrong answer is information, not a failure. Name what was reasonable about it, then show the gap.',
    '- No marks, no grades, no scolding. Never say the student is bad at something.',
    '- Plain language. If you must use a technical term, define it in the same breath.',
    '- Do not use markdown headings, bullet lists, or bold. Write plain sentences, the way a person texts.',
    '',
    'If the student goes off-topic, answer briefly and warmly, then steer back to the topic.',
    'If the student asks you to just give the answer, give it — then ask one question that checks they followed it.',
  ].join('\n');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY is not set on this function.' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }

  let student: Student;
  let messages: Turn[];
  try {
    const body = await req.json();
    student = body.student;
    messages = body.messages;
    if (!student || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('body must be { student, messages: [...] }');
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: `Bad request: ${(e as Error).message}` }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      try {
        const stream = client.beta.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          betas: ['server-side-fallback-2026-06-01'],
          fallbacks: [{ model: 'claude-opus-4-8' }],
          thinking: { type: 'adaptive' },
          // Low effort keeps replies fast; the tutoring itself is not a hard
          // reasoning task, and latency is felt directly in a chat UI.
          output_config: { effort: 'low' },
          system: [
            { type: 'text', text: systemPrompt(student), cache_control: { type: 'ephemeral' } },
          ],
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            send({ type: 'text', text: event.delta.text });
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
          send({ type: 'error', error: "Nexora can't help with that one. Try asking it a different way." });
        }
        send({ type: 'done' });
      } catch (err) {
        const message =
          err instanceof Anthropic.RateLimitError
            ? 'Nexora is busy right now — try again in a moment.'
            : err instanceof Anthropic.AuthenticationError
              ? 'The Anthropic key on this function is invalid.'
              : err instanceof Anthropic.APIError
                ? `Claude API error ${err.status}: ${err.message}`
                : (err as Error).message;
        send({ type: 'error', error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      ...CORS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});
