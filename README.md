# StudyBuddy

An Expo (SDK 57) app: a study buddy called Nexora that builds a per-topic exam
plan from a short baseline quiz, then tutors the student through it.

## Running the app

```bash
npm install
npx expo start        # then press i / a / w
```

Node 20+ is required.

### On a phone

Phone and Google sign-in need native modules, so **Expo Go no longer works** —
the app needs a development build. There is no Android SDK required locally;
EAS builds it in the cloud:

```bash
eas login
eas build --profile development --platform android
adb install <the-apk-it-gives-you>
npx expo start --dev-client --lan
```

## Scan & learn, and talking to Nexora

A student can photograph a question, a textbook page or their own working.
`identifyScan` matches it against **their own** concept graph rather than
teaching the picture in isolation — so the lesson that follows knows their
mastery of that concept, what it depends on and what it unlocks. A returned
id is checked against the graph before being trusted, and a photo that
genuinely is not on their syllabus says so instead of guessing.

The lesson is a conversation, by typing or by voice. Both halves of voice run
on the device — Android's `SpeechRecognizer` / iOS's `SFSpeechRecognizer` for
listening, the platform voices for speaking — so a conversation costs nothing
per turn and no audio leaves the phone.

Voice changes what Nexora says, not just how it is delivered: replies are
capped near 40 words, written to be heard rather than read, with sums spoken
in words and no symbols or lists. Tapping the mic while it is talking stops
it, because that is a student wanting to answer.

## Sign-in

A student gets an anonymous uid the moment they open the app, so they can
start before signing up. Signing in later **links** the phone or Google
credential onto that same account (`linkWithCredential`), so their knowledge
graph carries over. If the credential already belongs to another account we
sign into that one instead and say plainly that the guest work stays behind —
merging two graphs is a different, larger job.

This runs on **React Native Firebase**, not the JS SDK. Phone auth on the JS
SDK needs `RecaptchaVerifier`, which needs a DOM, and the SDKs cannot be
mixed: Firestore takes its auth token from its own SDK's auth instance, so a
split setup sends unauthenticated reads that the rules reject. The cost is
that the web build no longer runs.

### Console setup

1. **Authentication > Sign-in method**: enable **Phone** and **Google**.
2. Copy the **Web client ID** from the Google provider into
   `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`.
3. After the first EAS build, add its signing SHA-1 to the Firebase Android
   app, then re-download `google-services.json`:

   ```bash
   eas credentials --platform android      # read the SHA-1
   firebase apps:sdkconfig ANDROID <app-id> --out google-services.json
   ```

   Google Sign-In fails with a bare `DEVELOPER_ERROR` until that SHA-1 is
   registered — it is the most common way to get stuck here.

## How it works

The backend keeps a **knowledge graph** per student per exam, and every
decision the app makes comes out of it.

### The graph

The syllabus can be a photo of the sheet, an uploaded PDF, or typed chapter
names — a photo is the path most students will take. The file is sent inline
to `buildGraph` and read by Claude directly (a `document` block for PDFs, an
`image` block for photos), so there is no OCR step to go wrong.

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

### Spend controls

Anonymous sign-in plus a necessarily public web API key means anyone can mint
uids, so per-user limits alone would be trivially bypassed by farming
accounts. Every operation that reaches Claude is therefore capped twice — per
user and project-wide — in one Firestore transaction, reserved *before* any
Claude work so a rejected request costs nothing (`functions/src/quota.ts`).
Counters are readable by the student but writable only by the functions.

The exam limit is enforced here too. `prime` lives on the student document and
is writable only by the functions — the rules deny it to the client, or a
student could grant themselves the paid plan. There is no payment integration
yet, so nothing can currently set it; the free limit is real, Prime is not
purchasable.

Each function also carries a `maxInstances` ceiling (3 for `buildGraph`, the
most expensive call), so a spike cannot fan out into an unbounded bill, and
`sweepPendingChecks` clears abandoned answer keys daily.

**App Check is wired but off.** `ENFORCE_APP_CHECK` in `functions/.env` flips
it on; do that only once App Check providers are registered for web, iOS and
Android, or every request will be rejected. Until then the global cap is what
actually protects the bill — and note the tradeoff: a determined abuser can
exhaust the daily global allowance and lock out real students until it resets.

Run the cap tests against the emulator (no Claude calls, no cost):

```bash
firebase emulators:start --only firestore --project studybuddy-nexora
node functions/quota-emulator.test.mjs
```

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

The app runs entirely on the backend: no mastery, scoring, or scheduling is
computed on the client any more.

- Guest sign-in gives every install a real uid, so the graph has an owner
  before a phone number is ever collected. A returning student skips
  onboarding straight to their plan.
- Onboarding writes the profile to Firestore; adding an exam collects a
  syllabus and calls `buildGraph`.
- Home renders `nextStep` — including the planner's own reason for choosing
  that concept, and what it unlocks.
- The lesson thread lives on the server, so it survives reloads and follows
  the student across devices.
- Checks are generated, recorded and graded server-side; the client never
  holds an answer key.

### Still open

- **Phone auth is a stub.** The OTP screens accept any 4 digits and identity is
  anonymous underneath. Real SMS needs `@react-native-firebase/auth` and a
  development build — the Firebase JS SDK cannot do phone auth on native
  without reCAPTCHA. `signInGuest()` is the seam to replace, and anonymous
  accounts can be upgraded in place without losing the graph.
- **Attachments go inline, not through Storage.** Base64 in the callable
  payload caps a syllabus at ~6 MB, which covers a photo or a normal school
  PDF but not a large scanned document. Firebase Storage is the upgrade path
  if that limit starts biting.
- **Only tested on Android and web.** iOS has never been run.
- **App Check is not enforced yet** (see Spend controls). Until it is, the
  global daily cap is the only thing standing between a determined abuser and
  your Anthropic bill — and hitting it locks out real students for the day.
- **The social screens are still mock data** — Friends, Group, Call and Badges
  were never part of the graph work.
- **No payment integration**, so Prime can't be bought. The cap it implies is
  enforced server-side; granting Prime currently means setting the flag in
  Firestore by hand.
- **No client-side tests.** The 20 tests cover backend graph, planner, mastery
  and attachment encoding. `AppState` is the most intricate part of the app and
  has none.
