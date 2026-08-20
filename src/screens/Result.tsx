import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Screen } from '../components/Screen';
import { CtaButton, SectionLabel } from '../components/UI';
import { useApp } from '../state/AppState';
import { colors, fonts, radius } from '../theme/tokens';
import type { TopicStat } from '../state/types';

const RING_SIZE = 92;
const RING_STROKE = 11;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

function ReadinessRing({ pct }: { pct: number }) {
  const filled = (pct / 100) * RING_C;
  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          stroke={colors.neutral300} strokeWidth={RING_STROKE} fill="none"
        />
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          stroke={colors.accent2_500} strokeWidth={RING_STROKE} fill="none"
          strokeDasharray={`${filled} ${RING_C}`}
          strokeLinecap="round"
          rotation={-90}
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringPct}>{pct}%</Text>
        <Text style={styles.ringLabel}>READY</Text>
      </View>
    </View>
  );
}

function topicColors(level: number, label: string) {
  const labelColor = level === 0 ? colors.neutral600
    : level >= 4 ? colors.accent2_700
      : level === 3 ? colors.neutral700
        : colors.accent700;
  const fill = level >= 4 ? colors.accent2_500 : level === 3 ? colors.accent2_400 : colors.accent;
  return { labelColor, fill };
}

function TopicRow({ t }: { t: TopicStat }) {
  const { labelColor, fill } = topicColors(t.level, t.label);
  return (
    <View style={{ gap: 7 }}>
      <View style={styles.topicHeaderRow}>
        <Text style={styles.topicName}>{t.name}</Text>
        <Text style={[styles.topicLabel, { color: labelColor }]}>{t.label}</Text>
      </View>
      <View style={styles.cellsRow}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.cell, { backgroundColor: i < t.level ? fill : colors.neutral200 }]} />
        ))}
      </View>
    </View>
  );
}

export function ResultScreen() {
  const { st, qTotal, readiness, focus, activeName, actions, s } = useApp();

  const missing = s.exams.filter((e) => !e.syllabus).length > 0
    || s.exams.some((e) => e.syllabus && !e.baselineDone);
  const resultCtaLabel = missing ? 'Back to my exams' : 'See day 1';

  const resultNote = st
    ? `${activeName} baseline done — ${st.correct} of ${qTotal} right. Target for exam day: 85%. `
      + (st.allStrong
        ? `Nothing weak here, so we start on ${focus} and keep the rest sharp.`
        : `That's ${st.weak.length + st.mid.length} topic${(st.weak.length + st.mid.length) === 1 ? '' : 's'} to lift first.`)
    : '';

  return (
    <Screen style={styles.content}>
      <Text style={styles.h2}>Here's where{'\n'}you stand</Text>

      <View style={styles.resultCard}>
        <ReadinessRing pct={readiness} />
        <Text style={styles.resultNote}>{resultNote}</Text>
      </View>

      <SectionLabel>Topic mastery</SectionLabel>
      <View style={{ gap: 13 }}>
        {(st?.topics ?? []).map((t) => <TopicRow key={t.name} t={t} />)}
      </View>

      <CtaButton label={resultCtaLabel} onPress={actions.resultCta} style={{ marginTop: 'auto' as const }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 18 },
  h2: { fontFamily: fonts.heading, fontSize: 29, lineHeight: 32, color: colors.text },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 18,
    backgroundColor: colors.accent2_100, borderRadius: radius.lg, padding: 20,
  },
  ringWrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: {
    position: 'absolute', width: 68, height: 68, borderRadius: 999, backgroundColor: colors.accent2_100,
    alignItems: 'center', justifyContent: 'center',
  },
  ringPct: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  ringLabel: { fontFamily: fonts.bodyBold, fontSize: 10, fontWeight: '700', letterSpacing: 1, color: colors.accent2_700 },
  resultNote: { flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.accent2_900 },
  topicHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  topicName: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  topicLabel: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15 },
  cellsRow: { flexDirection: 'row', gap: 5 },
  cell: { flex: 1, height: 9, borderRadius: 999 },
});
