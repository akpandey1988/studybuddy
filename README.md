# StudyBuddy

An Expo (SDK 57) app: a study buddy called Nexora that builds a per-topic exam
plan from a short baseline quiz, then tutors the student through it.

## Running the app

```bash
npm install
npx expo start        # then press i / a / w
```

Node 20+ is required.

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
```

Or serve it locally (needs Docker):

```bash
supabase functions serve nexora
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
| `src/theme/tokens.ts` | Colours, fonts, radii, shadows from the Organic design system |
| `src/data/catalog.ts` | Subjects, topics, and baseline questions |
| `supabase/functions/nexora/` | Deno edge function that calls Claude |

## Known gaps

- **State is in-memory.** Exams, answers, and chat threads reset on reload.
- **Auth is a stub.** Any 10-digit number and any 4-digit code get you in, and
  the edge function is reachable with just the anon key — anyone holding it can
  spend Anthropic tokens. Close this when real phone auth lands by verifying the
  caller's JWT in the function.
- **Syllabus upload is mocked.** The screen fabricates a filename and reuses the
  hardcoded topic list rather than reading a real PDF.
