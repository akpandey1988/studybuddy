// Firebase app, auth and callable wiring for the client.
//
// Only publishable config lives here — EXPO_PUBLIC_* values are inlined into
// the bundle. The Anthropic key never appears on this side; it is a Secret
// Manager secret read by the Cloud Functions.

import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import type { User } from 'firebase/auth';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** Functions run in Mumbai — must match the region declared in functions/src/index.ts. */
export const REGION = 'asia-south1';

/** Point at a locally running emulator suite instead of the real project. */
const USE_EMULATOR = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR === '1';
const EMULATOR_HOST = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';

export function isConfigured(): boolean {
  return Boolean(config.projectId && config.apiKey);
}

let started = false;

export function app() {
  if (getApps().length === 0) {
    initializeApp(config as Required<typeof config>);
  }
  const instance = getApp();
  if (!started) {
    started = true;
    if (USE_EMULATOR) {
      connectAuthEmulator(getAuth(instance), `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
      connectFunctionsEmulator(getFunctions(instance, REGION), EMULATOR_HOST, 5001);
    }
  }
  return instance;
}

export const auth = () => getAuth(app());
export const functions = () => getFunctions(app(), REGION);

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
 * Every request to the backend carries this. Functions verify it and derive
 * the uid from it — the client never says who it is.
 */
export async function idToken(): Promise<string> {
  const user = currentUser();
  if (!user) throw new BackendError('You need to sign in first.');
  return user.getIdToken();
}

/** A uid without a phone number, so a student can start before signing up. */
export async function signInGuest(): Promise<User> {
  const cred = await signInAnonymously(auth());
  return cred.user;
}

export class BackendError extends Error {}
