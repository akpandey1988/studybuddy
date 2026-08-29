import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { CtaButton } from '../components/UI';
import { Nexora, SubjectGlyph } from '../components/Art';
import { PressableScale, Rise } from '../components/Motion';
import { useApp } from '../state/AppState';
import { MAX_EXAMS, PRIME_PRICE } from '../data/catalog';
import { colors, fonts, radius, shadow } from '../theme/tokens';
import type { ExamRecord } from '../services/store';

function statusFor(e: ExamRecord) {
  if (e.graphStatus === 'pending') return { text: 'Building…', bg: colors.neutral200, fg: colors.neutral700 };
  if (e.graphStatus === 'failed') return { text: 'Failed', bg: colors.accent100, fg: colors.accent800 };
  return { text: `${e.conceptCount} concepts`, bg: colors.accent2_100, fg: colors.accent2_800 };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const whenLabel = (ms: number) => {
  const d = new Date(ms);
  const days = Math.max(0, Math.ceil((ms - Date.now()) / 86_400_000));
  return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${days} days`;
};

export function ExamsHubScreen() {
  const { exams, prime, readyExams, atCap, needsPrime, busy, account, actions } = useApp();
  const who = account.phoneNumber || account.email || null;

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
      {/* Was three lines of prose; the rows below already say most of it. */}
      <Text style={styles.intro}>Each day is split by exam date and weak topics.</Text>

      <View style={{ gap: 10 }}>
        {exams.map((e, i) => {
          const st = statusFor(e);
          return (
            <Rise key={e.id} delay={i * 60}>
              <PressableScale onPress={() => actions.openExam(e.id)} style={styles.row}>
                <SubjectGlyph subject={e.subject} size={46} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowName} numberOfLines={1}>{e.subject}</Text>
                  <Text style={styles.rowMeta}>{whenLabel(e.examDate)}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusText, { color: st.fg }]}>{st.text}</Text>
                </View>
              </PressableScale>
            </Rise>
          );
        })}
        <PressableScale
          onPress={actions.goAddsub}
          disabled={atCap}
          style={[styles.addBtn, atCap ? styles.addBtnDisabled : styles.addBtnEnabled]}
        >
          <Text style={[styles.addBtnLabel, { color: atCap ? colors.neutral500 : colors.accent800 }]}>{addLabel}</Text>
        </PressableScale>
      </View>

      {/* The screen ran to a large blank middle with only one exam on it. */}
      <View style={styles.fill}>
        <Nexora size={exams.length === 0 ? 132 : 104} mood={exams.length === 0 ? 'thinking' : 'happy'} />
        <Text style={styles.fillText}>
          {exams.length === 0
            ? 'Start with the exam that’s closest — the first one is free.'
            : 'Add or top up a syllabus any time.'}
        </Text>
      </View>

      <Pressable onPress={actions.goPrime}>
        <Text style={styles.footerLink}>{footerText}</Text>
      </Pressable>

      <View style={{ gap: 10 }}>
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
  content: { paddingTop: 70, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  h1: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 33, color: colors.text },
  count: { fontFamily: fonts.bodyExtraBold, fontSize: 13, fontWeight: '800', color: colors.neutral600 },
  intro: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.neutral700 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: '#fff', borderRadius: radius.md, padding: 14, paddingHorizontal: 15, ...shadow.sm,
  },
  rowName: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, color: colors.text },
  rowMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600, marginTop: 2 },
  statusPill: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  statusText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800' },
  addBtn: { borderRadius: radius.md, padding: 16, borderWidth: 2, borderStyle: 'dashed' },
  addBtnEnabled: { borderColor: colors.accent300, backgroundColor: colors.accent100 },
  addBtnDisabled: { borderColor: colors.neutral200, backgroundColor: colors.neutral100 },
  addBtnLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, textAlign: 'left' },
  fill: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 12 },
  fillText: {
    fontFamily: fonts.body, fontSize: 14, lineHeight: 20,
    color: colors.neutral600, textAlign: 'center', maxWidth: 260,
  },
  footerLink: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.neutral600, textAlign: 'center' },
});
