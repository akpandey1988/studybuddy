// Spend controls.
//
// Every expensive operation costs Anthropic tokens, and anonymous sign-in
// means anyone holding the (necessarily public) web API key can mint uids.
// Per-user limits alone would therefore be trivially bypassed by farming
// accounts, so each operation is capped twice: per user, and globally across
// the whole project. The global cap is the one that actually protects the
// bill; the per-user cap stops one student running away with it.

import { FieldValue, getFirestore } from 'firebase-admin/firestore';

export type Op = 'graph' | 'check' | 'tutor';

/** Per user, per UTC day. */
const PER_USER: Record<Op, number> = {
  graph: 5,      // 5 syllabuses a day is far beyond real use
  check: 60,
  tutor: 300,
};

/**
 * Project-wide, per UTC day. Sized as a backstop against uid farming, not as
 * a product limit — raise deliberately as real usage grows.
 */
const GLOBAL: Record<Op, number> = {
  graph: 150,
  check: 4000,
  tutor: 20000,
};

const LABEL: Record<Op, string> = {
  graph: 'syllabus plans',
  check: 'checks',
  tutor: 'lessons',
};

export class QuotaError extends Error {
  readonly scope: 'user' | 'global';
  constructor(scope: 'user' | 'global', message: string) {
    super(message);
    this.scope = scope;
  }
}

const day = (now: number) => new Date(now).toISOString().slice(0, 10);

/**
 * Reserve one unit of an operation, or throw. Check and increment happen in
 * one transaction so concurrent calls cannot both slip under the limit.
 */
export async function consumeQuota(uid: string, op: Op, now = Date.now()): Promise<void> {
  const db = getFirestore();
  const d = day(now);
  const userRef = db.collection('students').doc(uid).collection('usage').doc(d);
  const globalRef = db.collection('usage').doc(d);

  await db.runTransaction(async (tx) => {
    const [userSnap, globalSnap] = await Promise.all([tx.get(userRef), tx.get(globalRef)]);
    const used = (userSnap.data()?.[op] as number | undefined) ?? 0;
    const usedGlobal = (globalSnap.data()?.[op] as number | undefined) ?? 0;

    if (used >= PER_USER[op]) {
      throw new QuotaError(
        'user',
        `You've hit today's limit of ${PER_USER[op]} ${LABEL[op]}. It resets tomorrow.`,
      );
    }
    if (usedGlobal >= GLOBAL[op]) {
      throw new QuotaError(
        'global',
        'Nexora is at capacity for today. Please try again tomorrow.',
      );
    }

    tx.set(userRef, { [op]: FieldValue.increment(1), updatedAt: now }, { merge: true });
    tx.set(globalRef, { [op]: FieldValue.increment(1), updatedAt: now }, { merge: true });
  });
}

/**
 * Give back a reservation when the work failed before costing anything.
 * Best effort — a lost refund only makes the cap slightly stricter.
 */
export async function refundQuota(uid: string, op: Op, now = Date.now()): Promise<void> {
  const db = getFirestore();
  const d = day(now);
  try {
    await Promise.all([
      db.collection('students').doc(uid).collection('usage').doc(d)
        .set({ [op]: FieldValue.increment(-1) }, { merge: true }),
      db.collection('usage').doc(d)
        .set({ [op]: FieldValue.increment(-1) }, { merge: true }),
    ]);
  } catch {
    // Not worth failing the request over.
  }
}
