// Firestore access. Everything a student owns hangs off students/{uid}, which
// is what makes the security rules a single ownership check.

import { getFirestore } from 'firebase-admin/firestore';
import { emptyProgress } from './types.js';
import type { ChatTurn, Concept, ConceptNode, ConceptProgress, Exam } from './types.js';

export const db = () => getFirestore();

const examRef = (uid: string, examId: string) =>
  db().collection('students').doc(uid).collection('exams').doc(examId);

export const conceptsRef = (uid: string, examId: string) => examRef(uid, examId).collection('concepts');

export async function getExam(uid: string, examId: string): Promise<Exam | null> {
  const snap = await examRef(uid, examId).get();
  return snap.exists ? (snap.data() as Exam) : null;
}

export async function setExam(uid: string, examId: string, exam: Partial<Exam>): Promise<void> {
  await examRef(uid, examId).set(exam, { merge: true });
}

/** Write a freshly built graph, preserving any progress already recorded. */
export async function writeGraph(uid: string, examId: string, concepts: Concept[]): Promise<void> {
  const col = conceptsRef(uid, examId);
  const existing = await col.get();
  const prior = new Map(existing.docs.map((d) => [d.id, d.data() as ConceptProgress]));

  // Firestore caps a batch at 500 writes; graphs are 15-40 nodes but chunk anyway.
  for (let i = 0; i < concepts.length; i += 400) {
    const batch = db().batch();
    for (const c of concepts.slice(i, i + 400)) {
      batch.set(col.doc(c.id), { ...c, ...(prior.get(c.id) ?? emptyProgress()) });
    }
    await batch.commit();
  }

  // Drop nodes that no longer exist in the regenerated syllabus.
  const live = new Set(concepts.map((c) => c.id));
  const stale = existing.docs.filter((d) => !live.has(d.id));
  if (stale.length > 0) {
    const batch = db().batch();
    stale.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function getNodes(uid: string, examId: string): Promise<ConceptNode[]> {
  const snap = await conceptsRef(uid, examId).get();
  return snap.docs.map((d) => d.data() as ConceptNode);
}

export async function getNode(uid: string, examId: string, conceptId: string): Promise<ConceptNode | null> {
  const snap = await conceptsRef(uid, examId).doc(conceptId).get();
  return snap.exists ? (snap.data() as ConceptNode) : null;
}

export async function updateProgress(
  uid: string, examId: string, conceptId: string, progress: Partial<ConceptProgress>,
): Promise<void> {
  await conceptsRef(uid, examId).doc(conceptId).set(progress, { merge: true });
}

export async function recordAttemptDoc(
  uid: string, examId: string, attempt: Record<string, unknown>,
): Promise<void> {
  await examRef(uid, examId).collection('attempts').add(attempt);
}

export async function getThread(uid: string, examId: string, conceptId: string): Promise<ChatTurn[]> {
  const snap = await examRef(uid, examId).collection('threads').doc(conceptId).get();
  return snap.exists ? ((snap.data()?.turns ?? []) as ChatTurn[]) : [];
}

export async function setThread(
  uid: string, examId: string, conceptId: string, turns: ChatTurn[],
): Promise<void> {
  // Keep threads bounded — the tutor only needs recent context.
  const trimmed = turns.slice(-40);
  await examRef(uid, examId).collection('threads').doc(conceptId)
    .set({ turns: trimmed, updatedAt: Date.now() });
}
