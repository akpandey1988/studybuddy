import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FixedScreen } from '../components/Screen';
import { CtaButton, SecondaryButton } from '../components/UI';
import { Burst, Nexora, ProgressRing } from '../components/Art';
import { PressableScale, Rise } from '../components/Motion';
import { useApp } from '../state/AppState';
import { colors, fonts, radius } from '../theme/tokens';

/** Everything here comes from the server's grading — nothing is scored locally. */
export function CheckResultScreen() {
  const { check, result, nodes, actions } = useApp();
  // Every question, its answer and its explanation is a long read to land on
  // straight after a check. It's all still here, one tap away.
  const [showAll, setShowAll] = React.useState(false);

  if (!result) {
    return (
      <FixedScreen>
      <View style={styles.content}>
        <Text style={styles.h2}>No result to show</Text>
        <CtaButton label="Back to today" onPress={actions.finishCheck} style={{ marginTop: 'auto' as const }} />
      </View>
    </FixedScreen>
    );
  }

  const topic = check.conceptName || 'this concept';
  const { score, outOf, passed, passMark, next } = result;
  const learned = nodes.filter((n) => n.state === 'mastered').length;

  const title = passed ? 'You got it' : 'Nearly';
  const note = passed
    ? `${topic} is marked learned.`
    : `You need ${passMark}. Nexora will come at it a different way.`;
  const pct = outOf ? (score / outOf) * 100 : 0;
  const ringColor = passed ? colors.accent2_500 : colors.accent;

  return (
    <FixedScreen>
      <View style={styles.content}>
      <ScrollView contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* The number, the face and the verdict in one glance. */}
        <Rise>
          <View style={styles.hero}>
            {passed && <Burst size={230} color={colors.accent2_300} />}
            <ProgressRing value={pct} size={150} stroke={14} color={ringColor}>
              <Text style={styles.scoreValue}>{score}<Text style={styles.scoreOf}>/{outOf}</Text></Text>
            </ProgressRing>
            <Nexora size={104} mood={passed ? 'cheer' : 'oops'} />
            <Text style={styles.h2}>{title}</Text>
            <Text style={styles.scoreNote}>{note}</Text>
          </View>
        </Rise>

        <PressableScale onPress={() => setShowAll((v) => !v)} style={styles.reviewToggle} to={0.98}>
          <Text style={styles.reviewToggleText}>
            {showAll ? 'Hide the answers' : `Go through all ${result.questions.length} questions`}
          </Text>
          <Text style={styles.reviewChevron}>{showAll ? '⌃' : '⌄'}</Text>
        </PressableScale>

        <View style={{ gap: 10, display: showAll ? 'flex' : 'none' }}>
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
    </View>
    </FixedScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 66, paddingBottom: 40, gap: 12 },
  hero: { alignItems: 'center', gap: 10, paddingVertical: 6 },
  reviewToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16,
  },
  reviewToggleText: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  reviewChevron: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.neutral500 },
  h2: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 34, color: colors.text, textAlign: 'center' },
  scoreValue: { fontFamily: fonts.heading, fontSize: 38, color: colors.text },
  scoreOf: { fontSize: 20, color: colors.neutral600 },
  scoreNote: {
    fontFamily: fonts.body, fontSize: 15, lineHeight: 22,
    color: colors.neutral700, textAlign: 'center',
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
