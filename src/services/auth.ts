// Signing in with a phone number or a Google account.
//
// The important rule here: a student has usually been using the app as a guest
// already, and their knowledge graph hangs off that anonymous uid. So we
// *link* the new credential onto the existing account rather than signing in
// fresh — otherwise logging in would silently orphan everything they'd done.

import {
  GoogleAuthProvider, PhoneAuthProvider, linkWithCredential, signInWithCredential,
  signInWithPhoneNumber,
} from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { AuthCredential, ConfirmationResult } from '@react-native-firebase/auth';
import { auth, currentUser } from './firebase';
import type { User } from './firebase';

export class AuthError extends Error {}

/** Outcome of signing in, so the caller can warn about abandoned guest work. */
export type SignInResult = {
  user: User;
  /** True when the credential was attached to the existing guest account. */
  linked: boolean;
  /**
   * Set when the credential already belonged to another account. We signed
   * into that one instead, so anything done as a guest is not carried over.
   */
  guestProgressAbandoned: boolean;
};

/**
 * Attach a credential to the signed-in guest, or fall back to signing in with
 * it when it already belongs to somebody. That fallback is the case where a
 * student reinstalls and signs in again — their real account is the one that
 * matters, and the fresh guest account is the throwaway.
 */
async function linkOrSignIn(credential: AuthCredential): Promise<SignInResult> {
  const guest = currentUser();

  if (guest?.isAnonymous) {
    try {
      const cred = await linkWithCredential(guest, credential);
      return { user: cred.user, linked: true, guestProgressAbandoned: false };
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      // Anything other than "already used" is a real failure worth surfacing.
      if (code !== 'auth/credential-already-in-use' && code !== 'auth/email-already-in-use') {
        throw new AuthError(friendly(code, (err as Error).message));
      }
    }
  }

  const cred = await signInWithCredential(auth(), credential);
  return {
    user: cred.user,
    linked: false,
    guestProgressAbandoned: Boolean(guest?.isAnonymous),
  };
}

// ── phone ──────────────────────────────────────────────────────────────────

/** Send the SMS. Returns a handle used to confirm the code. */
export async function startPhoneSignIn(tenDigits: string): Promise<ConfirmationResult> {
  const digits = tenDigits.replace(/\D/g, '');
  if (digits.length !== 10) throw new AuthError('That does not look like a 10-digit number.');
  try {
    return await signInWithPhoneNumber(auth(), `+91${digits}`);
  } catch (err) {
    throw new AuthError(friendly((err as { code?: string }).code ?? '', (err as Error).message));
  }
}

/**
 * Confirm the SMS code. Built from the verification id rather than
 * confirmation.confirm() so the credential can be linked to the guest account
 * instead of replacing it.
 */
export async function confirmPhoneCode(
  confirmation: ConfirmationResult,
  code: string,
): Promise<SignInResult> {
  const verificationId = confirmation.verificationId;
  if (!verificationId) throw new AuthError('That code has expired. Ask for a new one.');
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code.replace(/\D/g, ''));
    return await linkOrSignIn(credential);
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError(friendly((err as { code?: string }).code ?? '', (err as Error).message));
  }
}

// ── google ─────────────────────────────────────────────────────────────────

let googleConfigured = false;

function configureGoogle() {
  if (googleConfigured) return;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    throw new AuthError(
      'Google sign-in is not configured yet. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID — see README.',
    );
  }
  // The *web* client id is correct here even on Android: it is what Firebase
  // validates the returned idToken against.
  GoogleSignin.configure({ webClientId });
  googleConfigured = true;
}

export async function signInWithGoogle(): Promise<SignInResult | null> {
  configureGoogle();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    // Newer versions wrap the result; older ones return it flat.
    const idToken = (response as { data?: { idToken?: string | null } }).data?.idToken
      ?? (response as { idToken?: string | null }).idToken;
    if (!idToken) throw new AuthError("Google didn't return a sign-in token. Try again.");

    return await linkOrSignIn(GoogleAuthProvider.credential(idToken));
  } catch (err) {
    if (err instanceof AuthError) throw err;
    const code = (err as { code?: string }).code;
    // The student backing out is not an error.
    if (code === statusCodes.SIGN_IN_CANCELLED) return null;
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new AuthError('Google Play Services is out of date on this phone.');
    }
    throw new AuthError(friendly(String(code ?? ''), (err as Error).message));
  }
}

export async function signOutEverywhere(): Promise<void> {
  try { await GoogleSignin.signOut(); } catch { /* not signed in with Google */ }
  await auth().signOut();
}

/** Firebase error codes are not for children. */
function friendly(code: string, fallback: string): string {
  switch (code) {
    case 'auth/invalid-phone-number': return 'That phone number does not look right.';
    case 'auth/invalid-verification-code': return "That code isn't right. Check the SMS and try again.";
    case 'auth/code-expired': return 'That code has expired. Ask for a new one.';
    case 'auth/too-many-requests': return 'Too many tries. Wait a few minutes and try again.';
    case 'auth/network-request-failed': return 'No connection. Check your network and try again.';
    case 'auth/quota-exceeded': return 'We have sent too many codes today. Try again tomorrow.';
    case 'auth/operation-not-allowed': return 'That sign-in method is not switched on for this project.';
    default: return fallback || 'Sign-in failed. Try again.';
  }
}
