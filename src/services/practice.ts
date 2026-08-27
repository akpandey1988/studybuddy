// SUPERSEDED — this talked to the Supabase edge functions, which have been
// removed in favour of the Firebase backend in functions/. It is kept only
// so the current screens keep compiling while they still run the local
// mastery loop. Migrating those screens to src/services/backend.ts (server
// graph + server grading) deletes this file.
// Client for the `practice` Supabase Edge Function — fresh check questions
// for one topic. Unlike the chat this is a plain JSON round trip.
import { fetch } from 'expo/fetch';
import type { PracticeQuestion } from '../state/types';
import { NexoraError, functionUrl, isConfigured, requestHeaders } from './nexora';

export type CheckRequest = {
  subject: string;
  topic: string;
  grade: number | null;
  board: string | null;
  count: number;
  /** 1-based; later attempts ask for fresh angles on the same idea. */
  attempt: number;
  missed: string[];
};

export async function fetchCheck(req: CheckRequest): Promise<PracticeQuestion[]> {
  if (!isConfigured()) {
    throw new NexoraError(
      'Checks need the backend. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.',
    );
  }

  let res: Response;
  try {
    res = await fetch(functionUrl('practice'), {
      method: 'POST',
      headers: requestHeaders(),
      body: JSON.stringify(req),
    });
  } catch {
    throw new NexoraError("Couldn't reach the question builder. Check your connection and try again.");
  }

  let payload: { questions?: PracticeQuestion[]; error?: string };
  try {
    payload = await res.json();
  } catch {
    throw new NexoraError(`The question builder sent something unreadable (${res.status}).`);
  }

  if (!res.ok || payload.error) {
    throw new NexoraError(payload.error || `The question builder failed (${res.status}).`);
  }
  if (!payload.questions || payload.questions.length === 0) {
    throw new NexoraError('No questions came back. Try again.');
  }
  return payload.questions;
}
