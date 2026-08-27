// Firebase app, auth and callable wiring for the client.
//
// Only publishable config lives here — EXPO_PUBLIC_* values are inlined into
// the bundle. The Anthropic key never appears on this side; it is a Secret
// Manager secret read by the Cloud Functions.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import {
  connectAuthEmulator, getAuth, initializeAuth, onAuthStateChanged, signInAnonymously,
} from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
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

/**
 * On React Native the Firebase JS SDK defaults to in-memory auth persistence,
 * so every cold start would mint a brand new anonymous uid and orphan the
 * student's whole knowledge graph. The RN build of firebase/auth ships
 * getReactNativePersistence, but the published types describe the browser
 * build, hence the cast.
 */
const reactNativePersistence = (firebaseAuth as unknown as {
  getReactNativePersistence?: (storage: unknown) => Persistence;
}).getReactNativePersistence;

let started = false;
let authInstance: Auth | null = null;

export function app() {
  if (getApps().length === 0) {
    initializeApp(config as Required<typeof config>);
  }
  const instance = getApp();

  if (!authInstance) {
    if (Platform.OS !== 'web' && reactNativePersistence) {
      // Must run before any getAuth() call, and only once.
      authInstance = initializeAuth(instance, {
        persistence: reactNativePersistence(AsyncStorage),
      });
    } else {
      // Browsers persist to localStorage on their own.
      authInstance = getAuth(instance);
    }
  }

  if (!started) {
    started = true;
    if (USE_EMULATOR) {
      connectAuthEmulator(authInstance, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
      connectFunctionsEmulator(getFunctions(instance, REGION), EMULATOR_HOST, 5001);
      // Firestore too, or client reads would quietly go to the real project.
      connectFirestoreEmulator(getFirestore(instance), EMULATOR_HOST, 8080);
    }
  }
  return instance;
}

export const auth = () => {
  app();
  return authInstance as Auth;
};
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
