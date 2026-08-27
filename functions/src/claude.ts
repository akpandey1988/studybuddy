// Shared Anthropic client. The key is a Secret Manager secret, never bundled
// into the app and never written to Firestore.

import Anthropic from '@anthropic-ai/sdk';
import { defineSecret } from 'firebase-functions/params';

export const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

export const MODEL = 'claude-opus-5';

let cached: Anthropic | null = null;

export function claude(): Anthropic {
  if (!cached) cached = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });
  return cached;
}

/** Turn an SDK error into something safe to show a student. */
export function friendlyError(err: unknown): string {
  if (err instanceof Anthropic.RateLimitError) return 'Nexora is busy right now — try again in a moment.';
  if (err instanceof Anthropic.AuthenticationError) return 'The Anthropic key on this backend is invalid.';
  if (err instanceof Anthropic.APIError) return `Claude API error ${err.status}: ${err.message}`;
  return (err as Error).message || 'Something went wrong.';
}
