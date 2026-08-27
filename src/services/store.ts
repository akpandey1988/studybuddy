// Client-side Firestore reads and profile writes.
//
// Only the student profile and the exam record itself are written from here —
// security rules make concepts, attempts and threads read-only, because
// mastery must come from graded checks rather than the client's word for it.

import {
  collection, doc, getDoc, getDocs, getFirestore, setDoc,
} from 'firebase/firestore';
import { app } from './firebase';

const db = () => getFirestore(app());

export type Profile = { name: string; grade: number | null; board: string | null };

export type ExamRecord = {
  id: string;
  subject: string;
  examDate: number;
  grade: number | null;
  board: string | null;
  graphStatus: 'pending' | 'ready' | 'failed';
  conceptCount: number;
};

export async function loadProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db(), 'students', uid));
  return snap.exists() ? (snap.data() as Profile) : null;
}

export async function saveProfile(uid: string, profile: Profile): Promise<void> {
  await setDoc(
    doc(db(), 'students', uid),
    { ...profile, updatedAt: Date.now() },
    { merge: true },
  );
}

export async function loadExams(uid: string): Promise<ExamRecord[]> {
  const snap = await getDocs(collection(db(), 'students', uid, 'exams'));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ExamRecord, 'id'>) }))
    .sort((a, b) => a.examDate - b.examDate);
}

export function newExamId(): string {
  return doc(collection(db(), 'ids')).id;
}
