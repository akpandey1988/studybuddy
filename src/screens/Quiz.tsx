import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { CtaButton } from '../components/UI';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

export function QuizScreen() {
  const { s, q, qTotal, activeName, actions } = useApp();

  const pct = qTotal ? Math.round(((s.qi + (s.sel === null ? 0 : 1)) / qTotal) * 100) : 0;
  const hint = s.sel === null
    ? 'Tap "Not sure" freely — it makes the plan better.'
    : 'No marks here. Nexora just needs a signal.';
  const nextLabel = s.qi >= qTotal - 1 ? 'See my result' : 'Next question';

  return (
    <Screen style={styles.content}>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{s.qi + 1} / {qTotal}</Text>
      </View>

      <View style={styles.warmupRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>N</Text></View>
        <Text style={styles.warmupText}>Warm-up check — no marks, I just need to know where you are.</Text>
      </View>

      <View style={styles.qCard}>
        <Text style={styles.qKicker}>{activeName} · {q?.topic ?? ''}</Text>
        <Text style={styles.qText}>{q?.q ?? ''}</Text>
      </View>

      <View style={{ gap: 11 }}>
        {(q?.opts ?? []).map((label, i) => {
          const on = s.sel === i;
          return (
            <Pressable key={i} onPress={() => actions.selectOption(i)} style={[styles.opt, on ? styles.optOn : styles.optOff]}>
              <View style={[styles.dot, on ? styles.dotOn : styles.dotOff]} />
              <Text style={[styles.optLabel, { color: on ? colors.accent800 : colors.text, fontWeight: on ? '700' : '600' }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 'auto' as const, gap: 12 }}>
        <Text style={styles.hint}>{hint}</Text>
        <CtaButton label={nextLabel} active={s.sel !== null} onPress={actions.nextQuestion} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: colors.neutral200, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.accent2_500 },
  progressLabel: { fontFamily: fonts.bodyBold, fontSize: 14, fontWeight: '700', color: colors.neutral700 },
  warmupRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 999, backgroundColor: colors.accent2_100,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.heading, fontSize: 18, color: colors.accent2_800 },
  warmupText: { flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 20, color: colors.neutral800 },
  qCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 22, gap: 8, ...shadow.md },
  qKicker: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  qText: { fontFamily: fonts.heading, fontSize: 26, lineHeight: 32, color: colors.text },
  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 999, borderWidth: 2, paddingVertical: 15, paddingHorizontal: 20,
  },
  optOn: { backgroundColor: colors.accent100, borderColor: colors.accent },
  optOff: { backgroundColor: '#fff', borderColor: colors.neutral200 },
  optLabel: { fontFamily: fonts.body, fontSize: 17, flexShrink: 1 },
  dot: { width: 26, height: 26, borderRadius: 999 },
  dotOn: { borderWidth: 8, borderColor: colors.accent },
  dotOff: { borderWidth: 2.75, borderColor: colors.neutral300 },
  hint: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral600, textAlign: 'center' },
});
