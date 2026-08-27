// SUPERSEDED — this talked to the Supabase edge functions, which have been
// removed in favour of the Firebase backend in functions/. It is kept only
// so the current screens keep compiling while they still run the local
// mastery loop. Migrating those screens to src/services/backend.ts (server
// graph + server grading) deletes this file.
// Client for the `nexora` Supabase Edge Function.
//
// Uses expo/fetch rather than the global fetch: React Native's built-in fetch
// cannot read a response body incrementally, so streaming needs this one.
// expo/fetch supports response.body on iOS, Android and web.
import { fetch } from 'expo/fetch';
import type { ChatTurn, ExamStats } from '../state/types';

export type StudentContext = {
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

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const KICKOFF = '(Start the lesson.)';

export class NexoraError extends Error {}

export function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function functionUrl(name: string): string {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

export function requestHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY || '',
  };
}

export function studentContext(
  name: string,
  grade: number | null,
  board: string | null,
  subject: string,
  st: ExamStats,
): StudentContext {
  return {
    name,
    grade,
    board,
    subject,
    focus: st.focus,
    readiness: st.readiness,
    topics: st.cat.topics,
    weak: st.weak,
    mid: st.mid,
    untested: st.untested,
  };
}

/**
 * Streams Nexora's reply, yielding text as it arrives.
 * Throws NexoraError with a message safe to show the student.
 */
export async function* streamReply(
  student: StudentContext,
  turns: ChatTurn[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new NexoraError(
      'Nexora is not connected yet. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.',
    );
  }

  let res: Response;
  try {
    res = await fetch(functionUrl('nexora'), {
      method: 'POST',
      signal,
      headers: requestHeaders(),
      body: JSON.stringify({
        student,
        messages: turns.map((t) => ({ role: t.role, content: t.content })),
      }),
    });
  } catch {
    // No response at all — offline, DNS, or the function isn't running.
    throw new NexoraError("Nexora can't be reached. Check your connection and try again.");
  }

  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) detail = j.error;
    } catch {
      // non-JSON error body — keep the status code
    }
    throw new NexoraError(`Nexora couldn't be reached (${detail}).`);
  }
  if (!res.body) throw new NexoraError('Nexora sent an empty response.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line.
    let split = buffer.indexOf('\n\n');
    while (split !== -1) {
      const frame = buffer.slice(0, split);
      buffer = buffer.slice(split + 2);
      split = buffer.indexOf('\n\n');

      const line = frame.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;

      let event: { type?: string; text?: string; error?: string };
      try {
        event = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }

      if (event.type === 'text' && event.text) yield event.text;
      else if (event.type === 'error') throw new NexoraError(event.error || 'Nexora hit a problem.');
      else if (event.type === 'done') return;
    }
  }
}
