// Exercises the spend caps against the Firestore emulator. No Claude calls,
// no cost — run with:
//   firebase emulators:start --only firestore --project studybuddy-nexora
//   node functions/quota-emulator.test.mjs
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';

import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'studybuddy-nexora' });
const { consumeQuota, refundQuota, QuotaError } = await import('./lib/quota.js');

const uid = 'quota-test-' + Math.random().toString(36).slice(2);
const PER_USER_GRAPH = 5;

// 1. Spends up to the per-user cap, then refuses.
let allowed = 0;
let rejection = null;
for (let i = 0; i < PER_USER_GRAPH + 3; i++) {
  try { await consumeQuota(uid, 'graph'); allowed++; }
  catch (e) { rejection = e; break; }
}
assert.equal(allowed, PER_USER_GRAPH, `expected ${PER_USER_GRAPH} allowed, got ${allowed}`);
assert.ok(rejection instanceof QuotaError, 'should throw QuotaError');
assert.equal(rejection.scope, 'user');
console.log(`PASS  stops after ${allowed} — "${rejection.message}"`);

// 2. A refund frees exactly one unit back.
await refundQuota(uid, 'graph');
await consumeQuota(uid, 'graph');
await assert.rejects(() => consumeQuota(uid, 'graph'), QuotaError);
console.log('PASS  a refund frees exactly one unit');

// 3. Ops are counted independently — a spent graph budget must not block checks.
await consumeQuota(uid, 'check');
console.log('PASS  quotas are per-operation, not shared');

// 4. Concurrent calls cannot both slip under the limit.
const uid2 = 'quota-race-' + Math.random().toString(36).slice(2);
const results = await Promise.allSettled(
  Array.from({ length: 12 }, () => consumeQuota(uid2, 'graph')),
);
const ok = results.filter((r) => r.status === 'fulfilled').length;
assert.equal(ok, PER_USER_GRAPH, `race let ${ok} through, cap is ${PER_USER_GRAPH}`);
console.log(`PASS  12 concurrent calls, exactly ${ok} admitted (no oversell)`);

// 5. The global counter tracks alongside the per-user one.
const day = new Date().toISOString().slice(0, 10);
const globalDoc = await getFirestore().collection('usage').doc(day).get();
assert.ok((globalDoc.data()?.graph ?? 0) >= PER_USER_GRAPH, 'global counter should have advanced');
console.log(`PASS  global counter advanced to ${globalDoc.data().graph}`);

// 6. Students cannot write their own counters (rules deny it) — checked in
//    firestore.rules; here we assert the doc lives under the student.
const userDoc = await getFirestore()
  .collection('students').doc(uid).collection('usage').doc(day).get();
assert.ok(userDoc.exists, 'per-user counter should be under students/{uid}/usage');
console.log('PASS  per-user counters stored under the student');
process.exit(0);
