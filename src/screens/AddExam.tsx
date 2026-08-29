import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Screen } from '../components/Screen';
import { BackChevron, Card, Chip, CtaButton, NexoraNote } from '../components/UI';
import { useApp } from '../state/AppState';
import { dateLabel } from '../data/catalog';
import { colors, fonts, radius } from '../theme/tokens';

export function AddExamScreen() {
  const { draftSubject, draftDays, subjectOptions, actions } = useApp();

  const draftNote = draftSubject
    ? `${draftSubject} in ${draftDays} days — that's ${dateLabel(draftDays)}. Next, your syllabus.`
    : 'Pick the subject, then how far away the exam is.';

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <BackChevron onPress={actions.goExams} />
        <Text style={styles.h1}>Add an exam</Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Subject</Text>
        <View style={styles.subjectRow}>
          {subjectOptions.map((c) => (
            <Chip key={c.name} label={c.name} active={draftSubject === c.name} onPress={() => actions.pickDraftSubject(c.name)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Text style={styles.label}>Exam date</Text>
        <Card style={{ gap: 16, padding: 18 }}>
          <View style={styles.dateHeaderRow}>
            <Text style={styles.dateLabel}>{dateLabel(draftDays)}</Text>
            <Text style={styles.daysAway}>{draftDays} days away</Text>
          </View>
          <Slider
            minimumValue={3}
            maximumValue={60}
            step={1}
            value={draftDays}
            onValueChange={actions.setDraftDays}
            minimumTrackTintColor={colors.accent400}
            maximumTrackTintColor={colors.neutral200}
            thumbTintColor={colors.accent}
          />
          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>3 days</Text>
            <Text style={styles.rangeText}>60 days</Text>
          </View>
        </Card>
      </View>

      <NexoraNote text={draftNote} />

      <View style={{ marginTop: 'auto' as const, gap: 10 }}>
        <CtaButton label="Next: your syllabus" active={!!draftSubject} onPress={actions.goSyllabus} />
        <Pressable onPress={() => draftSubject && actions.buildExam()} style={styles.laterBtn}>
          <Text style={[styles.laterLabel, { color: draftSubject ? colors.neutral800 : colors.neutral500 }]}>
            Use the standard {draftSubject ?? ''} syllabus
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 70, paddingBottom: 40, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  h1: { fontFamily: fonts.heading, fontSize: 28, color: colors.text },
  label: {
    fontFamily: fonts.bodyExtraBold, fontSize: 13, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  dateLabel: { fontFamily: fonts.heading, fontSize: 26, color: colors.accent700 },
  daysAway: { fontFamily: fonts.bodyBold, fontSize: 14, fontWeight: '700', color: colors.neutral600 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeText: { fontFamily: fonts.bodyBold, fontSize: 12, fontWeight: '700', color: colors.neutral600 },
  laterBtn: {
    borderWidth: 2, borderColor: colors.neutral200, backgroundColor: '#fff',
    borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center',
  },
  laterLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16 },
});
