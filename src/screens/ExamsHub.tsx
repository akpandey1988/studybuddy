import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { CtaButton, NexoraNote } from '../components/UI';
import { examStats, useApp } from '../state/AppState';
import { MAX_EXAMS, FREE_EXAMS, PRIME_PRICE } from '../data/catalog';
import { colors, fonts, radius, shadow } from '../theme/tokens';
import type { Exam } from '../state/types';

function statusFor(e: Exam) {
  const es = examStats(e);
  if (!e.syllabus) return { text: 'Add syllabus', bg: colors.accent100, fg: colors.accent800 };
  if (!e.baselineDone) return { text: 'Baseline pending', bg: colors.neutral200, fg: colors.neutral700 };
  return { text: `${es.readiness}% ready`, bg: colors.accent2_100, fg: colors.accent2_800 };
}

export function ExamsHubScreen() {
  const { s, ready, atCap, needsPrime, actions } = useApp();

  const examsIntro = s.exams.length === 0
    ? "Start with the exam that's closest — the first one is free. I'll split each day between your exams by how close each one is."
    : "I split each day across these by exam date and weak topics. Add or top up a syllabus any time.";

  const addLabel = atCap ? 'Eight exams is the limit' : needsPrime ? '+ Add an exam · Prime' : '+ Add an exam';
  const footerText = s.prime
    ? `Prime · ${PRIME_PRICE}/month · up to 8 exams`
    : `Free plan · 1 exam. Prime is ${PRIME_PRICE}/month for up to 8.`;

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.h1}>My exams</Text>
        <Text style={styles.count}>{s.exams.length} of {MAX_EXAMS}</Text>
      </View>
      <Text style={styles.intro}>{examsIntro}</Text>

      <View style={{ gap: 10 }}>
        {s.exams.map((e) => {
          const st = statusFor(e);
          const es = examStats(e);
          const meta = `Exam ${e.dateLabel} · ${e.days} days${e.syllabus ? ` · ${es.cat.chapters} chapters` : ''}`;
          return (
            <Pressable key={e.id} onPress={() => actions.openExam(e)} style={styles.row}>
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

      {s.exams.length === 0 && (
        <NexoraNote text="Start with the exam that's closest. You can add the rest in a minute." />
      )}

      <Pressable onPress={actions.goPrime}>
        <Text style={styles.footerLink}>{footerText}</Text>
      </Pressable>

      <CtaButton label="Go to today's plan" active={ready.length > 0} onPress={actions.examsCta} style={{ marginTop: 'auto' as const }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
