import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { CtaButton, SecondaryButton } from '../components/UI';
import { useApp } from '../state/AppState';
import { colors, fonts, radius } from '../theme/tokens';

/** Everything here comes from the server's grading — nothing is scored locally. */
export function CheckResultScreen() {
  const { check, result, nodes, actions } = useApp();

  if (!result) {
    return (
      <Screen style={styles.content}>
        <Text style={styles.h2}>No result to show</Text>
        <CtaButton label="Back to today" onPress={actions.finishCheck} style={{ marginTop: 'auto' as const }} />
      </Screen>
    );
  }

  const topic = check.conceptName || 'this concept';
  const { score, outOf, passed, passMark, next } = result;
  const learned = nodes.filter((n) => n.state === 'mastered').length;

  const title = passed ? `You got it —\n${topic}` : 'Nearly —\nlet’s go again';
  const note = passed
    ? `${score} of ${outOf} right. ${topic} is marked learned.`
    : `${score} of ${outOf} right — you need ${passMark}. Nexora will come at it a different way, then a fresh check.`;

  return (
    <Screen style={styles.content}>
      <ScrollView contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, passed ? styles.badgePass : styles.badgeRetry]}>
          <Text style={[styles.badgeText, { color: passed ? colors.accent2_800 : colors.accent800 }]}>
            {passed ? 'PASSED' : 'NOT YET'}
          </Text>
        </View>

        <Text style={styles.h2}>{title}</Text>

        <View style={[styles.scoreCard, passed ? styles.scorePass : styles.scoreRetry]}>
          <Text style={styles.scoreValue}>{score}<Text style={styles.scoreOf}> / {outOf}</Text></Text>
          <Text style={styles.scoreNote}>{note}</Text>
        </View>

        {/* The whole paper, now that it's graded and the key can be shown. */}
        <Text style={styles.sectionLabel}>Every question</Text>
        <View style={{ gap: 10 }}>
          {result.questions.map((q, i) => {
            const picked = check.picks[i];
            const right = picked === q.answer;
            return (
              <View key={i} style={[styles.qRow, right ? styles.qRight : styles.qWrong]}>
                <Text style={styles.qText}>{q.q}</Text>
                <Text style={styles.qAnswer}>
                  {right ? '✓ ' : '✗ '}
                  {typeof picked === 'number' ? q.opts[picked] : 'no answer'}
                  {!right && ` — it's ${q.opts[q.answer]}`}
                </Text>
                <Text style={styles.qWhy}>{q.why}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Concepts learned</Text>
          <Text style={styles.progressValue}>{learned} of {nodes.length}</Text>
        </View>

        {/* The planner has already recomputed what comes next. */}
        {next && next.action !== 'done' && (
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>Next up</Text>
            <Text style={styles.nextName}>{next.conceptName}</Text>
            <Text style={styles.nextReason}>{next.reason}</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ gap: 12, paddingTop: 12 }}>
        {passed ? (
          <CtaButton
            label={next && next.action !== 'done' ? `Start ${next.conceptName}` : 'Back to today'}
            onPress={next && next.action !== 'done' ? actions.reteach : actions.finishCheck}
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
  content: { paddingTop: 66, paddingBottom: 40, gap: 12 },
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
  sectionLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600, marginTop: 6,
  },
  qRow: { borderRadius: radius.md, borderWidth: 2, padding: 14, gap: 4 },
  qRight: { backgroundColor: '#fff', borderColor: colors.accent2_300 },
  qWrong: { backgroundColor: '#fff', borderColor: colors.accent300 },
  qText: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 14, lineHeight: 20, color: colors.text },
  qAnswer: { fontFamily: fonts.bodySemiBold, fontWeight: '600', fontSize: 13, color: colors.neutral700 },
  qWhy: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.neutral600 },
  progressRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 2, borderTopColor: colors.neutral200, paddingTop: 14,
  },
  progressLabel: { fontFamily: fonts.body, fontSize: 15, color: colors.neutral700 },
  progressValue: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 15, color: colors.text },
  nextCard: { backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 16, gap: 4 },
  nextLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 11, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.accent2_800,
  },
  nextName: { fontFamily: fonts.heading, fontSize: 19, color: colors.text },
  nextReason: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.accent2_900 },
});
