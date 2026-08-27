# StudyBuddy

An Expo (SDK 57) app: a study buddy called Nexora that builds a per-topic exam
plan from a short baseline quiz, then tutors the student through it.

## Running the app

```bash
npm install
npx expo start        # then press i / a / w
```

Node 20+ is required.

## The learn loop

The app's core cycle, per topic:

1. **Find the gap.** The baseline quiz ranks every topic in the subject. Any
   topic not yet *proved* is a gap, weakest first — a right answer on the single
   baseline question is not enough on its own.
2. **Teach it.** Nexora opens a lesson on that topic, Socratically, with
   everyday examples (`nexora` function).
3. **Check it.** A 4-question check on that topic alone, generated fresh for
   every attempt (`practice` function), so a retry can't be passed from memory
   of which option was right last time. Each answer reveals why immediately —
   the explanation is part of the teaching, not just marking.
4. **Pass or go again.** 3 of 4 marks the topic learned and the loop moves to
   the next gap. Below that, the questions the student missed are handed back to
   Nexora, which explains the same idea a different way with a fresh example,
   and a new check is generated. This repeats until the topic is learned.

Readiness is the baseline score plus the ground closed by mastered topics, so
it visibly rises with each topic proved and tops out at 95% when all are done.
Loop constants (`CHECK_SIZE`, `CHECK_PASS`) live in `src/data/catalog.ts`.

## Nexora chat (Claude)

The tutor chat is backed by a Supabase Edge Function that calls the Claude
Messages API and streams the reply back to the app as SSE. **The Anthropic API
key lives only in the function** — it is never shipped in the app bundle.

### 1. Create the function's secret

```bash
supabase link --project-ref <your-project-ref>
supabase secrets set ANTHROPIC_API_KEY=<your-anthropic-key>
```

For local runs, copy `supabase/functions/.env.example` to
`supabase/functions/.env` and put the key there instead (it is gitignored).

### 2. Deploy the function

```bash
supabase functions deploy nexora
supabase functions deploy practice
```

Or serve them locally (needs Docker):

```bash
supabase functions serve
```

### 3. Point the app at it

Copy `.env.example` to `.env` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your anon / publishable key>
```

`EXPO_PUBLIC_*` values are inlined at bundle time, so **restart the dev server**
after changing them. Until they are set, the chat screen shows a "not connected"
notice instead of failing.

## Layout

| Path | What's there |
| --- | --- |
| `App.tsx`, `src/Router.tsx` | Font loading, providers, and the route switch |
| `src/state/AppState.tsx` | All app state and actions, incl. readiness/mastery scoring |
| `src/screens/` | One file per screen (18 of them) |
| `src/services/nexora.ts` | Streaming client for the Nexora edge function |
| `src/services/practice.ts` | Client for generated topic checks |
| `src/theme/tokens.ts` | Colours, fonts, radii, shadows from the Organic design system |
| `src/data/catalog.ts` | Subjects, topics, and baseline questions |
| `supabase/functions/nexora/` | Deno edge function — streams the tutor conversation |
| `supabase/functions/practice/` | Deno edge function — generates a fresh topic check |

## Known gaps

- **State is in-memory.** Exams, answers, mastery, and chat threads all reset
  on reload — a student cannot come back tomorrow and continue the loop. This is
  the most important gap to close next.
- **Checks need the backend.** Question generation is a live Claude call, so the
  loop does not work offline; the check screen surfaces this rather than
  silently failing.
- **Auth is a stub.** Any 10-digit number and any 4-digit code get you in, and
  the edge function is reachable with just the anon key — anyone holding it can
  spend Anthropic tokens. Close this when real phone auth lands by verifying the
  caller's JWT in the function.
- **Syllabus upload is mocked.** The screen fabricates a filename and reuses the
  hardcoded topic list rather than reading a real PDF.
