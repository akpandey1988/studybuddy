import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { CtaButton, SecondaryButton } from '../components/UI';
import { CHECK_PASS } from '../data/catalog';
import { useApp } from '../state/AppState';
import { colors, fonts, radius } from '../theme/tokens';

export function CheckResultScreen() {
  const { s, st, checkScore, checkTotal, checkPassed, checkProgress, actions } = useApp();

  const topic = s.check.topic || 'this topic';
  const attempts = checkProgress.attempts;
  const remaining = st ? st.gaps.length : 0;
  const nextGap = st ? st.gaps.find((g) => g !== topic) : undefined;

  const title = checkPassed
    ? (attempts > 1 ? `You got it —\n${topic}` : `${topic}:\nlearned`)
    : 'Nearly —\nlet’s go again';

  const note = checkPassed
    ? attempts > 1
      ? `${checkScore} of ${checkTotal} right, on attempt ${attempts}. That's the one that counts — it stuck.`
      : `${checkScore} of ${checkTotal} right, first go. ${topic} is marked learned.`
    : `${checkScore} of ${checkTotal} right — you need ${CHECK_PASS}. Nexora will explain the bits you missed a different way, then you can take a fresh check.`;

  const nextLine = checkPassed
    ? st && st.allMastered
      ? 'Every topic in this subject is learned. Readiness is as high as it goes.'
      : nextGap
        ? `Next up: ${nextGap}.`
        : ''
    : '';

  return (
    <Screen style={styles.content}>
      <View style={[styles.badge, checkPassed ? styles.badgePass : styles.badgeRetry]}>
        <Text style={[styles.badgeText, { color: checkPassed ? colors.accent2_800 : colors.accent800 }]}>
          {checkPassed ? 'PASSED' : `ATTEMPT ${attempts}`}
        </Text>
      </View>

      <Text style={styles.h2}>{title}</Text>

      <View style={[styles.scoreCard, checkPassed ? styles.scorePass : styles.scoreRetry]}>
        <Text style={styles.scoreValue}>{checkScore}<Text style={styles.scoreOf}> / {checkTotal}</Text></Text>
        <Text style={styles.scoreNote}>{note}</Text>
      </View>

      {nextLine !== '' && <Text style={styles.nextLine}>{nextLine}</Text>}

      {st && (
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Topics learned</Text>
          <Text style={styles.progressValue}>
            {st.masteredCount} of {st.cat.topics.length}
          </Text>
        </View>
      )}

      <View style={{ marginTop: 'auto' as const, gap: 12 }}>
        {checkPassed ? (
          <CtaButton
            label={remaining > 0 && nextGap ? `Start ${nextGap}` : 'Back to today'}
            onPress={actions.finishCheck}
          />
        ) : (
          <>
            <CtaButton label="Show me again" onPress={actions.reteach} />
            <SecondaryButton label="Later — back to today" onPress={actions.finishCheck} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 16 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  badgePass: { backgroundColor: colors.accent2_100 },
  badgeRetry: { backgroundColor: colors.accent100 },
  badgeText: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  h2: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 34, color: colors.text },
  scoreCard: { borderRadius: radius.lg, padding: 22, gap: 10 },
  scorePass: { backgroundColor: colors.accent2_100 },
  scoreRetry: { backgroundColor: colors.accent100 },
  scoreValue: { fontFamily: fonts.heading, fontSize: 44, color: colors.text },
  scoreOf: { fontSize: 24, color: colors.neutral600 },
  scoreNote: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.neutral800 },
  nextLine: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.accent700 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 2, borderTopColor: colors.neutral200, paddingTop: 14,
  },
  progressLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.neutral700 },
  progressValue: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 15, color: colors.text },
});
