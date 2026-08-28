// Shared Anthropic client. The key is a Secret Manager secret, never bundled
// into the app and never written to Firestore.

import Anthropic from '@anthropic-ai/sdk';
import { defineSecret, defineString } from 'firebase-functions/params';

export const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

/**
 * Identity-linked API keys must say which workspace the request acts in, or
 * every call fails with a 400. Plain keys do not need it, so this is optional
 * and only sent when set. It is an identifier, not a credential, so it lives
 * in functions/.env rather than Secret Manager.
 */
export const ANTHROPIC_WORKSPACE_ID = defineString('ANTHROPIC_WORKSPACE_ID', { default: '' });

export const MODEL = 'claude-opus-5';

let cached: Anthropic | null = null;

export function claude(): Anthropic {
  if (!cached) {
    const workspace = ANTHROPIC_WORKSPACE_ID.value();
    cached = new Anthropic({
      apiKey: ANTHROPIC_API_KEY.value(),
      ...(workspace ? { defaultHeaders: { 'anthropic-workspace-id': workspace } } : {}),
    });
  }
  return cached;
}

/** Turn an SDK error into something safe to show a student. */
export function friendlyError(err: unknown): string {
  if (err instanceof Anthropic.RateLimitError) return 'Nexora is busy right now — try again in a moment.';
  if (err instanceof Anthropic.AuthenticationError) return 'The Anthropic key on this backend was rejected.';
  if (err instanceof Anthropic.APIError) {
    // Surface configuration mistakes as themselves. Folding them into
    // "invalid key" sent me looking for a revoked key that was fine.
    if (/workspace/i.test(err.message)) {
      return 'This Anthropic key needs a workspace id. Set ANTHROPIC_WORKSPACE_ID and redeploy.';
    }
    return `Claude API error ${err.status}: ${err.message}`;
  }
  return (err as Error).message || 'Something went wrong.';
}
