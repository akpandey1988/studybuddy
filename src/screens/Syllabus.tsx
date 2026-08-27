import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackChevron, CtaButton, Kicker } from '../components/UI';
import { UploadIcon } from '../components/Icons';
import { CATALOG, dateLabel } from '../data/catalog';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

/**
 * The syllabus is the input the whole knowledge graph is built from, so this
 * screen is no longer decorative — what gets typed here decides what Nexora
 * teaches and in what order.
 */
export function SyllabusScreen() {
  const { draftSubject, draftDays, draftSyllabus, actions } = useApp();

  const subject = draftSubject ?? '';
  const fallback = CATALOG.find((c) => c.name === subject)?.topics ?? [];
  const typed = draftSyllabus.trim();
  const lines = typed ? typed.split('\n').filter((l) => l.trim()).length : 0;

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <BackChevron onPress={actions.goAddsub} />
        <View style={{ gap: 4 }}>
          <Kicker>{subject}</Kicker>
          <Text style={styles.h2}>What's on the paper?</Text>
        </View>
      </View>

      <Text style={styles.intro}>
        Type or paste the chapters and topics your exam covers — straight off the
        syllabus sheet is perfect. Nexora reads this to work out what to teach you,
        and what has to come first.
      </Text>

      <View style={styles.inputWrap}>
        <TextInput
          value={draftSyllabus}
          onChangeText={actions.setDraftSyllabus}
          placeholder={fallback.length ? `${fallback.slice(0, 3).join('\n')}\n…` : 'Chapter 1: …'}
          placeholderTextColor={colors.neutral500}
          style={styles.input}
          multiline
          textAlignVertical="top"
        />
        <View style={styles.inputFooter}>
          <UploadIcon size={16} />
          <Text style={styles.inputFooterText}>
            {lines > 0 ? `${lines} line${lines === 1 ? '' : 's'}` : 'Leave it blank to use the standard syllabus'}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 'auto' as const, gap: 14 }}>
        <View style={styles.dateCard}>
          <Text style={styles.dateCardLabel}>Exam date</Text>
          <Text style={styles.dateCardValue}>{dateLabel(draftDays)}</Text>
          <Text style={styles.dateCardSub}>{draftDays} days to prepare.</Text>
        </View>
        <CtaButton label="Build my plan" active={Boolean(subject)} onPress={actions.buildExam} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  h2: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 31, color: colors.text },
  intro: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.neutral700 },
  inputWrap: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 4, ...shadow.sm },
  input: {
    minHeight: 190, borderRadius: radius.md, padding: 16,
    fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text,
  },
  inputFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  inputFooterText: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  dateCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, paddingHorizontal: 18, gap: 4, ...shadow.sm },
  dateCardLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  dateCardValue: { fontFamily: fonts.heading, fontSize: 22, color: colors.accent700 },
  dateCardSub: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral700 },
});
