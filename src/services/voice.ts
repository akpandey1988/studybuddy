// Two-way voice: the student speaks, Nexora speaks back.
//
// Both halves run on the device — Android's SpeechRecognizer / iOS's
// SFSpeechRecognizer for listening, the platform voices for speaking. That
// keeps a conversation free and fast, and means no audio leaves the phone.

import * as Speech from 'expo-speech';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { useCallback, useEffect, useRef, useState } from 'react';

export class VoiceError extends Error {}

/** Indian English where the device has it; the tutor's examples assume it. */
const LOCALE = 'en-IN';

// ── speaking ───────────────────────────────────────────────────────────────

/**
 * Read a reply aloud. Slightly slowed, because the listener is a child
 * following an explanation rather than skimming a notification.
 */
export function speak(text: string, onDone?: () => void) {
  Speech.stop();
  Speech.speak(stripForSpeech(text), {
    language: LOCALE,
    rate: 0.95,
    pitch: 1.0,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export const stopSpeaking = () => Speech.stop();

/**
 * Written maths reads badly aloud. The tutor is told to avoid symbols in voice
 * mode, but it still slips, so clean up the common cases rather than letting
 * the student hear "three slash five".
 */
export function stripForSpeech(text: string): string {
  return text
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 over $2')
    .replace(/[*_`#>]/g, '')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/−|–|—/g, ' minus ')
    .replace(/≈/g, ' about ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── listening ──────────────────────────────────────────────────────────────

export type Listening = {
  listening: boolean;
  /** Words recognised so far, updating as they speak. */
  partial: string;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
};

/**
 * Microphone → text. Results stream in as they talk so the screen can show
 * what was heard; `onFinal` fires once with the settled transcript.
 */
export function useListening(onFinal: (text: string) => void): Listening {
  const [listening, setListening] = useState(false);
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const finalRef = useRef(onFinal);
  finalRef.current = onFinal;

  useSpeechRecognitionEvent('start', () => { setListening(true); setError(null); });
  useSpeechRecognitionEvent('end', () => { setListening(false); setPartial(''); });

  useSpeechRecognitionEvent('result', (event) => {
    const said = event.results?.[0]?.transcript ?? '';
    if (event.isFinal) {
      setPartial('');
      if (said.trim()) finalRef.current(said.trim());
    } else {
      setPartial(said);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    setPartial('');
    // Saying nothing is not a failure worth shouting about.
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    setError(friendlyRecognitionError(event.error));
  });

  const start = useCallback(async () => {
    setError(null);
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Nexora needs the microphone to hear you.');
        return;
      }
      // Speaking and listening at once makes the tutor hear itself.
      Speech.stop();
      ExpoSpeechRecognitionModule.start({
        lang: LOCALE,
        interimResults: true,
        continuous: false,
        // Prefer on-device where the phone supports it: faster and private.
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch (e) {
      setError((e as Error).message || "Couldn't start listening.");
    }
  }, []);

  const stop = useCallback(() => {
    try { ExpoSpeechRecognitionModule.stop(); } catch { /* already stopped */ }
    setListening(false);
  }, []);

  useEffect(() => () => { try { ExpoSpeechRecognitionModule.abort(); } catch { /* noop */ } }, []);

  return { listening, partial, error, start, stop };
}

function friendlyRecognitionError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Nexora needs permission to use the microphone.';
    case 'network':
      return 'Speech needs a connection right now. Check your network.';
    case 'audio-capture':
      return "Couldn't reach the microphone. Is something else using it?";
    case 'language-not-supported':
      return 'This phone cannot recognise speech in this language yet.';
    default:
      return "Didn't catch that. Try again, or type instead.";
  }
}
