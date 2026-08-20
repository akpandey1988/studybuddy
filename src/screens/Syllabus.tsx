import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackChevron, CtaButton, Kicker } from '../components/UI';
import { CheckIcon, UploadIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

export function SyllabusScreen() {
  const { active, activeName, st, qTotal, actions } = useApp();

  const syllabusFile = `${activeName.replace(/ /g, '_')}_Term2_Syllabus.pdf`;
  const syllabusChapters = st ? `${st.cat.chapters} chapters found` : '';
  const topics = st ? st.cat.topics : [];
  const examDateLabel = active ? active.dateLabel : '';
  const examDays = active ? active.days : 30;
  const quizCta = `Take the ${qTotal}-question baseline`;

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <BackChevron onPress={actions.goExams} />
        <View style={{ gap: 4 }}>
          <Kicker>{activeName}</Kicker>
          <Text style={styles.h2}>Add the syllabus</Text>
        </View>
      </View>

      <View style={styles.uploadBox}>
        <View style={styles.uploadIconWrap}><UploadIcon size={30} /></View>
        <Text style={styles.uploadTitle}>Add your syllabus</Text>
        <Text style={styles.uploadHint}>Photo of the sheet, a PDF, or just type the chapter names.</Text>
      </View>

      <View style={{ gap: 10 }}>
        <View style={styles.fileRow}>
          <View style={styles.pdfBadge}><Text style={styles.pdfBadgeText}>PDF</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.fileName}>{syllabusFile}</Text>
            <Text style={styles.fileMeta}>{syllabusChapters}</Text>
          </View>
          <CheckIcon size={20} />
        </View>
        <View style={styles.topicRow}>
          {topics.map((t) => (
            <View key={t} style={styles.topicChip}><Text style={styles.topicChipText}>{t}</Text></View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 'auto' as const, gap: 14 }}>
        <View style={styles.dateCard}>
          <View style={styles.dateCardRow}>
            <Text style={styles.dateCardLabel}>Exam date</Text>
            <Text style={styles.dateCardValue}>{examDateLabel}</Text>
          </View>
          <View style={styles.track}>
            <View style={styles.trackFill} />
            <View style={styles.trackKnob} />
          </View>
          <Text style={styles.dateCardSub}>That gives us <Text style={{ fontWeight: '700' }}>{examDays} days</Text> — 25 min a day.</Text>
        </View>
        <CtaButton label={quizCta} onPress={actions.startQuiz} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 22 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  h2: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 31, color: colors.text },
  uploadBox: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.neutral300, borderRadius: radius.lg,
    backgroundColor: '#fff', paddingVertical: 26, paddingHorizontal: 20,
    alignItems: 'center', gap: 12,
  },
  uploadIconWrap: {
    width: 66, height: 66, borderRadius: 999, backgroundColor: colors.accent100,
    alignItems: 'center', justifyContent: 'center',
  },
  uploadTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 17, color: colors.text },
  uploadHint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.neutral700, textAlign: 'center' },
  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: radius.md, padding: 13, paddingHorizontal: 16, ...shadow.sm,
  },
  pdfBadge: {
    width: 34, height: 34, borderRadius: 999, backgroundColor: colors.accent2_100,
    alignItems: 'center', justifyContent: 'center',
  },
  pdfBadgeText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800', color: colors.accent2_800 },
  fileName: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  fileMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  topicChip: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.accent100 },
  topicChipText: { fontFamily: fonts.bodySemiBold, fontSize: 13, fontWeight: '600', color: colors.accent800 },
  dateCard: {
    backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, paddingHorizontal: 18, gap: 10, ...shadow.sm,
  },
  dateCardRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  dateCardLabel: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  dateCardValue: { fontFamily: fonts.heading, fontSize: 18, color: colors.accent700 },
  track: { height: 10, borderRadius: 999, backgroundColor: colors.neutral200, position: 'relative' as const },
  trackFill: { position: 'absolute', left: 0, right: '34%', top: 0, bottom: 0, borderRadius: 999, backgroundColor: colors.accent400 },
  trackKnob: {
    position: 'absolute', left: '66%', top: -5, width: 20, height: 20, borderRadius: 999,
    backgroundColor: colors.accent, borderWidth: 3, borderColor: '#fff',
  },
  dateCardSub: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral700 },
});
