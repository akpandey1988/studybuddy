import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { CtaButton, NexoraNote } from '../components/UI';
import { useApp } from '../state/AppState';
import { MAX_EXAMS, PRIME_PRICE } from '../data/catalog';
import { colors, fonts, radius, shadow } from '../theme/tokens';
import type { ExamRecord } from '../services/store';

function statusFor(e: ExamRecord) {
  if (e.graphStatus === 'pending') return { text: 'Building plan…', bg: colors.neutral200, fg: colors.neutral700 };
  if (e.graphStatus === 'failed') return { text: 'Plan failed', bg: colors.accent100, fg: colors.accent800 };
  return { text: `${e.conceptCount} concepts`, bg: colors.accent2_100, fg: colors.accent2_800 };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const whenLabel = (ms: number) => {
  const d = new Date(ms);
  const days = Math.max(0, Math.ceil((ms - Date.now()) / 86_400_000));
  return `Exam ${d.getDate()} ${MONTHS[d.getMonth()]} · ${days} days`;
};

export function ExamsHubScreen() {
  const { exams, prime, readyExams, atCap, needsPrime, busy, account, actions } = useApp();
  const who = account.phoneNumber || account.email || null;

  const examsIntro = exams.length === 0
    ? "Start with the exam that's closest — the first one is free. I'll split each day between your exams by how close each one is."
    : "I split each day across these by exam date and weak topics. Add or top up a syllabus any time.";

  const addLabel = atCap ? 'Eight exams is the limit' : needsPrime ? '+ Add an exam · Prime' : '+ Add an exam';
  const footerText = prime
    ? `Prime · ${PRIME_PRICE}/month · up to 8 exams`
    : `Free plan · 1 exam. Prime is ${PRIME_PRICE}/month for up to 8.`;

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.h1}>My exams</Text>
        <Text style={styles.count}>{exams.length} of {MAX_EXAMS}</Text>
      </View>
      <Text style={styles.intro}>{examsIntro}</Text>

      <View style={{ gap: 10 }}>
        {exams.map((e) => {
          const st = statusFor(e);
          const meta = whenLabel(e.examDate);
          return (
            <Pressable key={e.id} onPress={() => actions.openExam(e.id)} style={styles.row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowName}>{e.subject}</Text>
                <Text style={styles.rowMeta}>{meta}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                <Text style={[styles.statusText, { color: st.fg }]}>{st.text}</Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable onPress={actions.goAddsub} disabled={atCap} style={[styles.addBtn, atCap ? styles.addBtnDisabled : styles.addBtnEnabled]}>
          <Text style={[styles.addBtnLabel, { color: atCap ? colors.neutral500 : colors.accent800 }]}>{addLabel}</Text>
        </Pressable>
      </View>

      {exams.length === 0 && (
        <NexoraNote text="Start with the exam that's closest. You can add the rest in a minute." />
      )}

      <Pressable onPress={actions.goPrime}>
        <Text style={styles.footerLink}>{footerText}</Text>
      </Pressable>

      <View style={{ marginTop: 'auto' as const, gap: 10 }}>
        <CtaButton label="Go to today's plan" active={readyExams.length > 0} onPress={actions.examsCta} />
        {/* The only account screen sits behind Progress, which needs an exam —
            so a student with none could otherwise never sign out. */}
        <Pressable onPress={account.isGuest ? actions.goLogin : actions.signOut} disabled={busy === 'auth'}>
          <Text style={styles.account}>
            {busy === 'auth' ? 'Signing out…'
              : account.isGuest ? 'Sign in to save your progress'
                : `Sign out${who ? ` · ${who}` : ''}`}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: {
    fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 14,
    color: colors.accent700, textAlign: 'center', paddingVertical: 8,
  },
  content: { paddingTop: 70, paddingBottom: 40, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  h1: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 33, color: colors.text },
  count: { fontFamily: fonts.bodyExtraBold, fontSize: 13, fontWeight: '800', color: colors.neutral600 },
  intro: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.neutral700 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: radius.md, padding: 15, paddingHorizontal: 16, ...shadow.sm,
  },
  rowName: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, color: colors.text },
  rowMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600, marginTop: 2 },
  statusPill: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  statusText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800' },
  addBtn: { borderRadius: radius.md, padding: 16, borderWidth: 2, borderStyle: 'dashed' },
  addBtnEnabled: { borderColor: colors.accent300, backgroundColor: colors.accent100 },
  addBtnDisabled: { borderColor: colors.neutral200, backgroundColor: colors.neutral100 },
  addBtnLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, textAlign: 'left' },
  footerLink: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.neutral600 },
});
