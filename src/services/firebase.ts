// Firebase wiring, on React Native Firebase.
//
// This is the native SDK rather than the JS one because phone auth needs it:
// the JS SDK's phone flow depends on RecaptchaVerifier, which needs a DOM.
// Auth, Firestore and Functions all have to come from the same SDK — Firestore
// takes its auth token from its own SDK's auth instance, so a mixed setup
// sends unauthenticated reads and the rules reject them.
//
// Config comes from google-services.json at build time, not from env vars.

import { getApp } from '@react-native-firebase/app';
import {
  connectAuthEmulator, getAuth, onAuthStateChanged, signInAnonymously,
} from '@react-native-firebase/auth';
import { connectFirestoreEmulator, getFirestore } from '@react-native-firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from '@react-native-firebase/functions';
import type { User as FirebaseUser } from '@react-native-firebase/auth';

export type User = FirebaseUser;

/** Must match the region the functions declare. */
export const REGION = 'asia-south1';

const USE_EMULATOR = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR === '1';
const EMULATOR_HOST = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';

let wired = false;

function wire() {
  if (wired) return;
  wired = true;
  if (!USE_EMULATOR) return;
  connectAuthEmulator(getAuth(), `http://${EMULATOR_HOST}:9099`);
  connectFirestoreEmulator(getFirestore(), EMULATOR_HOST, 8080);
  connectFunctionsEmulator(getFunctions(getApp(), REGION), EMULATOR_HOST, 5001);
}

export function isConfigured(): boolean {
  // google-services.json is compiled in; if the native module loaded, we're set.
  try {
    getApp();
    return true;
  } catch {
    return false;
  }
}

export const auth = () => { wire(); return getAuth(); };
export const db = () => { wire(); return getFirestore(); };
export const functions = () => { wire(); return getFunctions(getApp(), REGION); };

export function currentUser(): User | null {
  return isConfigured() ? auth().currentUser : null;
}

export function watchAuth(fn: (user: User | null) => void): () => void {
  if (!isConfigured()) {
    fn(null);
    return () => {};
  }
  return onAuthStateChanged(auth(), fn);
}

/**
 * Every backend request carries this. The functions verify it and derive the
 * uid from it — the client never asserts who it is.
 */
export async function idToken(): Promise<string> {
  const user = currentUser();
  if (!user) throw new BackendError('You need to sign in first.');
  return user.getIdToken();
}

/**
 * A uid before any sign-in, so a student can start using the app immediately.
 * Signing in later links onto this same account, keeping their graph.
 */
export async function signInGuest(): Promise<User> {
  const cred = await signInAnonymously(auth());
  return cred.user;
}

export class BackendError extends Error {}
