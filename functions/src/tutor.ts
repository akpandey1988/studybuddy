// The tutor lesson, scoped to one concept in the graph.
//
// This is an onRequest function rather than a callable because the reply is
// streamed as SSE — the student sees Nexora writing rather than waiting.

import { getAuth } from 'firebase-admin/auth';
import type { Response } from 'express';
import type { Request } from 'firebase-functions/v2/https';
import { MODEL, claude, friendlyError } from './claude.js';
import { noteLesson } from './mastery.js';
import { db, getExam, getNode, getNodes, getThread, setThread, updateProgress } from './store.js';
import type { ChatTurn, ConceptNode } from './types.js';

export const KICKOFF = '(Start the lesson.)';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function systemPrompt(
  studentName: string, grade: number | null, board: string | null,
  subject: string, node: ConceptNode, prereqs: ConceptNode[], daysToExam: number,
): string {
  const prereqLine = prereqs.length
    ? prereqs.map((p) => `${p.name} (${Math.round(p.strength * 100)}% solid)`).join(', ')
    : 'nothing — this is a starting point';

  return [
    `You are Nexora, a warm, patient study buddy for ${studentName || 'a student'}, an Indian school student in grade ${grade ?? 7} on the ${board ?? 'CBSE'} board.`,
    `Subject: ${subject}. Their exam is in ${daysToExam} days.`,
    '',
    `Today you are teaching exactly one thing: ${node.name}.`,
    `What they must end up able to do: ${node.summary}`,
    `This sits in the chapter "${node.chapter}". It builds on: ${prereqLine}.`,
    node.attempts > 0
      ? `They have been checked on this ${node.attempts} time(s) and last scored ${node.lastScore} of ${node.lastOutOf}.`
      : 'They have not been checked on this yet.',
    node.missed.length
      ? `Questions they got wrong last time:\n${node.missed.map((m) => `- ${m}`).join('\n')}`
      : '',
    '',
    'How you teach:',
    '- Stay on this one concept. Do not wander into the rest of the syllabus.',
    '- Socratic first. Ask what they think before you explain.',
    '- One question at a time. Never stack two questions in one message.',
    '- Keep every message under 60 words. This is a chat on a phone.',
    '- Lead with a concrete everyday example (rupees, cricket, trains, food) before any rule or formula.',
    '- A wrong answer is information. Name what was reasonable about it, then show the gap.',
    '- If they have missed this before, do NOT repeat your earlier explanation — come at it from a different angle.',
    '- No marks, no grades, no scolding.',
    '- Plain sentences. No markdown, no headings, no bullet lists, no bold.',
  ].filter(Boolean).join('\n');
}

export async function handleTutor(req: Request, res: Response): Promise<void> {
  if (req.method === 'OPTIONS') { res.set(CORS).status(204).send(''); return; }
  res.set(CORS);
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST' }); return; }

  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(token)).uid;
  } catch {
    res.status(401).json({ error: 'Sign in first.' });
    return;
  }

  const { examId, conceptId, message, hidden } = req.body ?? {};
  if (!examId || !conceptId) {
    res.status(400).json({ error: 'examId and conceptId are required' });
    return;
  }

  const [node, allNodes, thread] = await Promise.all([
    getNode(uid, examId, conceptId),
    getNodes(uid, examId),
    getThread(uid, examId, conceptId),
  ]);
  if (!node) { res.status(404).json({ error: 'No such concept in this exam.' }); return; }

  const [studentSnap, exam] = await Promise.all([
    db().collection('students').doc(uid).get(),
    getExam(uid, examId),
  ]);
  const student = studentSnap.data() ?? {};
  const daysToExam = exam ? Math.max(0, Math.ceil((exam.examDate - Date.now()) / 86_400_000)) : 30;

  const turns: ChatTurn[] = thread.length === 0
    ? [{ role: 'user', content: KICKOFF, hidden: true }]
    : message
      // A re-teach ask is prompt scaffolding, not something the student said,
      // so it is stored hidden and never rendered back into the thread.
      ? [...thread, { role: 'user' as const, content: String(message), hidden: Boolean(hidden) }]
      : thread;

  // A fresh thread means a new lesson on this concept.
  if (thread.length === 0) {
    await updateProgress(uid, examId, conceptId, noteLesson(node));
  }

  const byId = new Map(allNodes.map((n) => [n.id, n]));
  const prereqs = node.prereqs.map((id) => byId.get(id)).filter((n): n is ConceptNode => Boolean(n));

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = (event: unknown) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  let reply = '';
  try {
    const stream = claude().beta.messages.stream({
      model: MODEL,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-06-01'],
      fallbacks: [{ model: 'claude-opus-4-8' }],
      thinking: { type: 'adaptive' },
      // Latency is felt directly in a chat bubble.
      output_config: { effort: 'low' },
      system: [{
        type: 'text',
        text: systemPrompt(
          student.name ?? '', student.grade ?? null, student.board ?? null,
          exam?.subject ?? '', node, prereqs, daysToExam,
        ),
        cache_control: { type: 'ephemeral' },
      }],
      messages: turns.map((t) => ({ role: t.role, content: t.content })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        reply += event.delta.text;
        send({ type: 'text', text: event.delta.text });
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') {
      send({ type: 'error', error: "Nexora can't help with that one. Try asking it a different way." });
    }
    if (reply.trim()) {
      await setThread(uid, examId, conceptId, [...turns, { role: 'assistant', content: reply }]);
    }
    send({ type: 'done' });
  } catch (err) {
    send({ type: 'error', error: friendlyError(err) });
  } finally {
    res.end();
  }
}
