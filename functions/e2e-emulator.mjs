// Integration check against a running emulator suite:
//   firebase emulators:start --only functions,firestore,auth --project demo-studybuddy
//   node functions/e2e-emulator.mjs
// End-to-end against the emulator suite: real user, real Firestore, real
// callable functions. Seeds a graph by hand so no Anthropic key is needed.
const PROJECT = 'demo-studybuddy';
const FN = `http://127.0.0.1:5001/${PROJECT}/asia-south1`;
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;

const j = (v) => JSON.stringify(v);
const ok = (label, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' — ' + extra : ''}`);

// 1. A real signed-in user from the auth emulator.
const signUp = await fetch(
  'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: j({ returnSecureToken: true }) },
).then((r) => r.json());
const { idToken, localId: uid } = signUp;
ok('auth emulator issued an ID token', Boolean(idToken));

const call = async (name, data) => {
  const r = await fetch(`${FN}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: j({ data }),
  });
  return { status: r.status, body: await r.json() };
};

// 2. Unauthenticated calls must be rejected.
const anon = await fetch(`${FN}/nextStep`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: j({ data: { examId: 'e1' } }),
}).then((r) => r.json());
ok('rejects unauthenticated callers', anon?.error?.status === 'UNAUTHENTICATED', j(anon?.error?.status));

// 3. Seed an exam + a small graph directly into Firestore.
const DAY = 86400000;
const examDate = Date.now() + 30 * DAY;
// "Bearer owner" is the emulator's admin bypass — the same privilege the
// Cloud Functions admin SDK writes with, and what the rules are built to allow.
const put = async (path, fields) => {
  const r = await fetch(`${FS}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: j({ fields }),
  });
  if (!r.ok) throw new Error(`seed ${path} -> ${r.status} ${(await r.text()).slice(0, 200)}`);
};

const num = (v) => ({ doubleValue: v });
const int = (v) => ({ integerValue: String(v) });
const str = (v) => ({ stringValue: v });
const arr = (v) => ({ arrayValue: { values: v.map(str) } });

await put(`students/${uid}`, { name: str('Aarav'), grade: int(7), board: str('CBSE') });
await put(`students/${uid}/exams/e1`, {
  subject: str('Maths'), examDate: int(examDate), grade: int(7), board: str('CBSE'),
  graphStatus: str('ready'), conceptCount: int(3),
});

const concept = (id, name, prereqs, weight, depth, extra = {}) => ({
  id: str(id), name: str(name), chapter: str('Fractions'), summary: str('do ' + name),
  prereqs: arr(prereqs), weight: num(weight), difficulty: int(3), depth: int(depth),
  state: str('unknown'), strength: num(0), attempts: int(0), lessons: int(0),
  lastScore: int(0), lastOutOf: int(0), lastSeenAt: { nullValue: null }, dueAt: { nullValue: null },
  missed: { arrayValue: { values: [] } }, ...extra,
});

await put(`students/${uid}/exams/e1/concepts/equiv`, concept('equiv', 'Equivalent fractions', [], 0.2, 0));
await put(`students/${uid}/exams/e1/concepts/compare`, concept('compare', 'Comparing fractions', ['equiv'], 0.3, 1));
await put(`students/${uid}/exams/e1/concepts/ratio`, concept('ratio', 'Ratio word problems', ['compare'], 0.5, 2));

// 4. The graph comes back with this student's standing on it.
const g = await call('getGraph', { examId: 'e1' });
ok('getGraph returns the stored graph', g.body?.result?.nodes?.length === 3, `${g.body?.result?.nodes?.length} nodes`);

// 5. The planner must walk down to the root, not start at the valuable node.
const p1 = await call('nextStep', { examId: 'e1' });
const r1 = p1.body?.result;
ok('starts at the foundation, not the highest-value node', r1?.conceptId === 'equiv', `chose ${r1?.conceptId}`);
ok('names what it unlocks', r1?.unlocks?.id === 'ratio', j(r1?.unlocks));
console.log(`      reason: ${r1?.reason}`);
ok('readiness starts at zero', r1?.readiness === 0, String(r1?.readiness));
ok('counts days to exam', r1?.daysToExam === 30, String(r1?.daysToExam));

// 6. Master the root; the plan must advance to the next node in the chain.
await put(`students/${uid}/exams/e1/concepts/equiv`, concept('equiv', 'Equivalent fractions', [], 0.2, 0, {
  strength: num(0.95), attempts: int(1), lessons: int(1), state: str('mastered'),
  lastScore: int(4), lastOutOf: int(4), lastSeenAt: int(Date.now()),
}));
const p2 = await call('nextStep', { examId: 'e1' });
const r2 = p2.body?.result;
ok('advances once the prerequisite is solid', r2?.conceptId === 'compare', `chose ${r2?.conceptId}`);
ok('readiness rose with the mastered concept', r2?.readiness > 0.18 && r2?.readiness < 0.21, String(r2?.readiness));

// 7. Grading is server-side: submitting a check the server never issued must fail.
const bad = await call('submitCheck', { examId: 'e1', checkId: 'made-up', picks: [0, 0, 0, 0] });
ok('refuses a check id the server never issued', bad.body?.error?.status === 'NOT_FOUND', j(bad.body?.error?.status));

// 8. Another user cannot read this student's graph.
const other = await fetch(
  'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake',
  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: j({ returnSecureToken: true }) },
).then((r) => r.json());
const stolen = await fetch(`${FN}/getGraph`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${other.idToken}` },
  body: j({ data: { examId: 'e1' } }),
}).then((r) => r.json());
ok('a different user sees no graph', (stolen?.result?.nodes?.length ?? 0) === 0, `${stolen?.result?.nodes?.length} nodes`);
