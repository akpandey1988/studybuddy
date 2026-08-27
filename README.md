# StudyBuddy

An Expo (SDK 57) app: a study buddy called Nexora that builds a per-topic exam
plan from a short baseline quiz, then tutors the student through it.

## Running the app

```bash
npm install
npx expo start        # then press i / a / w
```

Node 20+ is required.

## How it works

The backend keeps a **knowledge graph** per student per exam, and every
decision the app makes comes out of it.

### The graph

Claude reads the syllabus once and returns 15-40 *concepts* — things that can
be taught in about ten minutes and then tested — plus the prerequisite edges
between them. The server then does the parts a language model shouldn't be
trusted with: dropping edges that point nowhere, breaking cycles, computing
depth, and normalising weights so they sum to 1.

Each node carries both the curriculum facts (chapter, summary, exam weight,
difficulty) and this student's standing on it (strength, attempts, what they
got wrong last time, when it needs revising).

### Why a graph and not a list of topics

Because it can answer *why* a student is stuck. When someone keeps failing
ratio word problems, the cause is usually that equivalent fractions were never
solid. A flat topic list can only drill the thing being failed. The planner
walks **down** the prerequisite chain to the shallowest thing that is actually
teachable right now, and says so:

> Ratio word problems is what the exam wants, but it needs Equivalent
> fractions first — and that one isn't solid yet. Fixing it here unlocks Ratio
> word problems.

### Choosing what to do next

`nextStep` is pure logic — no Claude call, so it is instant and testable:

1. **Decay.** Strength is discounted by time since it was last proved
   (14-day half-life), so a topic passed three weeks ago and never revisited
   stops counting as solid.
2. **Revision first** when three or more concepts have gone stale, or when the
   exam is within a week — holding what you have beats starting something new.
3. **Value.** Otherwise pick the unmastered concept with the highest
   `weight × (1 − strength)`, leaning harder on exam weight and away from deep
   foundations as the exam approaches.
4. **Descend.** If that concept has unmastered prerequisites, drop to the
   weakest one and target that instead, recording what it unlocks.

Readiness is `Σ(weight × strength) / Σ(weight)` — weighted by what the exam
actually asks for, not a count of topics ticked off.

### The loop, per concept

Nexora teaches the concept (streamed), then a check of 4 generated questions
proves it. Questions are generated per attempt, so a retry can't be passed by
remembering which option was right; later attempts are told exactly what was
missed and asked for new angles on the same idea. Three of four marks it
learned and the planner moves on; below that, the misses feed back into the
next lesson.

**Grading happens on the server.** The client receives questions without the
answer key and posts back which options were picked. Mastery drives the entire
plan, so a client that could write it could declare itself finished.

## Backend

Firebase: Firestore for the graph, Cloud Functions for everything that touches
Claude or mastery, Firebase Auth for identity.

```
students/{uid}
  exams/{examId}
    concepts/{conceptId}     the graph + this student's progress
    attempts/{attemptId}     every graded check, for history
    threads/{conceptId}      the lesson conversation
    pendingChecks/{checkId}  answer keys in flight — no client access at all
```

| Function | Kind | What it does |
| --- | --- | --- |
| `buildGraph` | callable | Syllabus → concept graph. Slow; 9-minute timeout. |
| `getGraph` | callable | The graph plus this student's standing. |
| `nextStep` | callable | What to study now, and why. Pure logic. |
| `startCheck` | callable | Generates a check; keeps the answer key server-side. |
| `submitCheck` | callable | Grades, updates mastery, returns the next step. |
| `tutor` | request (SSE) | Streams a lesson scoped to one concept. |
| `resetThread` | callable | Clears a concept's lesson thread. |

Security rules put everything under `students/{uid}` behind one ownership
check. Concepts, attempts and threads are **read-only** to the client — only
the functions' admin SDK writes them — and `pendingChecks` is denied outright.

### Setup

```bash
firebase use --add                     # pick or create your project
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase deploy --only firestore:rules,firestore:indexes,functions
```

Copy `.env.example` to `.env` and fill in the `EXPO_PUBLIC_FIREBASE_*` values
from your Firebase web app config. `EXPO_PUBLIC_*` is inlined at bundle time,
so restart the dev server after changing them.

### Running it locally

```bash
cd functions && npm install && npm test
firebase emulators:start --only functions,firestore,auth --project demo-studybuddy
```

Set `EXPO_PUBLIC_FIREBASE_EMULATOR=1` to point the app at it. Emulated
functions still call the real Claude API, so put a key in
`functions/.secret.local` for anything beyond `nextStep`/`getGraph`.

`cd functions && npm test` runs the graph and planner tests — decay, cycle
breaking, weight normalisation, and the prerequisite descent — with no
network and no emulator.

## Layout

| Path | What's there |
| --- | --- |
| `App.tsx`, `src/Router.tsx` | Font loading, providers, and the route switch |
| `src/state/AppState.tsx` | All app state and actions, incl. readiness/mastery scoring |
| `src/screens/` | One file per screen (18 of them) |
| `src/services/firebase.ts` | Firebase app, auth, emulator wiring |
| `src/services/backend.ts` | Typed client for the backend (graph, plan, checks, tutor) |
| `src/theme/tokens.ts` | Colours, fonts, radii, shadows from the Organic design system |
| `src/data/catalog.ts` | Subjects, topics, and baseline questions |
| `functions/src/graph.ts` | Syllabus → concept graph, plus cycle/depth/weight handling |
| `functions/src/plan.ts` | The planner: what to study next, and why |
| `functions/src/mastery.ts` | Strength, decay, and revision scheduling |
| `functions/src/logic.test.ts` | Tests for all three of the above |

## State of play

**The backend is built and verified.** Graph, planner, mastery, grading,
security rules and all seven functions run and were exercised end-to-end
against the emulator suite.

**The screens have not moved onto it yet.** The app still runs the older
in-memory loop over the hardcoded topic list in `src/data/catalog.ts`:
`src/services/nexora.ts` and `practice.ts` are marked SUPERSEDED and point at
the deleted Supabase functions, so chat and checks show their "not connected"
notice until the migration happens. That migration is the next piece of work:

1. Hold `examId` and the graph in `AppState` instead of local topic mastery.
2. Drive Home from `nextStep` rather than the local focus calculation.
3. Move the chat and check screens onto `src/services/backend.ts`.
4. Delete `nexora.ts`, `practice.ts`, and the local mastery code they feed.

Also still open:

- **Auth screens are a stub.** `signInGuest()` is wired in
  `src/services/firebase.ts`, but the OTP screens still accept any 4 digits.
  Real phone sign-in needs `@react-native-firebase/auth` and a development
  build — the Firebase JS SDK cannot do phone auth on native without reCAPTCHA.
- **Syllabus upload is mocked.** `buildGraph` takes syllabus *text*; nothing
  yet reads a PDF or photo and feeds it in.
- **No Firebase project is configured.** `.firebaserc` holds a placeholder.
