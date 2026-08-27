import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackChevron, CtaButton } from '../components/UI';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

/**
 * A check on one concept. The client never holds the answer key — each pick is
 * sent to the server, which records it and returns the explanation for that
 * question alone. That keeps the immediate "here's why" feedback without
 * letting a student read ahead or grade themselves.
 */
export function CheckScreen() {
  const { check, checkQ, checkTotal, focusNode, busy, error, actions } = useApp();

  const building = busy === 'check' || (checkTotal === 0 && !error);

  if (building) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.loadingText}>Building a fresh check on {check.conceptName}…</Text>
        <Text style={styles.loadingHint}>New questions every time, so you can't pass by memory.</Text>
      </Screen>
    );
  }

  if (error && checkTotal === 0) {
    return (
      <Screen style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't build the check</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <CtaButton label="Try again" onPress={actions.startCheck} />
        <Pressable onPress={actions.goHome}><Text style={styles.link}>Back to today</Text></Pressable>
      </Screen>
    );
  }

  if (!checkQ) {
    return <Screen style={styles.centered}><Text style={styles.loadingText}>No questions.</Text></Screen>;
  }

  const { sel, revealed, qi } = check;
  const pct = Math.round(((qi + (revealed ? 1 : 0)) / checkTotal) * 100);
  const attempts = focusNode?.attempts ?? 0;
  const attemptLabel = attempts > 0 ? `Attempt ${attempts + 1}` : 'First check';
  const nextLabel = qi >= checkTotal - 1 ? 'See how I did' : 'Next question';
  const waiting = busy === 'answer' || busy === 'submit';

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <BackChevron onPress={actions.goHome} />
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{qi + 1} / {checkTotal}</Text>
      </View>

      <ScrollView contentContainerStyle={{ gap: 18 }} showsVerticalScrollIndicator={false}>
        <View style={styles.qCard}>
          <Text style={styles.qKicker}>{check.conceptName} · {attemptLabel}</Text>
          <Text style={styles.qText}>{checkQ.q}</Text>
        </View>

        <View style={{ gap: 11 }}>
          {checkQ.opts.map((label, i) => {
            const chosen = sel === i;
            const isAnswer = revealed ? i === revealed.answer : false;
            const style = !revealed
              ? (chosen ? styles.optOn : styles.optOff)
              : isAnswer ? styles.optRight
                : chosen ? styles.optWrong : styles.optOff;
            const labelColor = !revealed
              ? (chosen ? colors.accent800 : colors.text)
              : isAnswer ? colors.accent2_800
                : chosen ? colors.accent800 : colors.neutral600;
            return (
              <Pressable
                key={i}
                onPress={() => actions.answerCheck(i)}
                disabled={Boolean(revealed) || waiting}
                style={[styles.opt, style]}
              >
                <View style={[styles.dot, chosen || isAnswer ? styles.dotOn : styles.dotOff]} />
                <Text style={[styles.optLabel, { color: labelColor, fontWeight: chosen || isAnswer ? '700' : '600' }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {revealed && (
          <View style={[styles.whyCard, revealed.correct ? styles.whyRight : styles.whyWrong]}>
            <Text style={[styles.whyTitle, { color: revealed.correct ? colors.accent2_800 : colors.accent800 }]}>
              {revealed.correct ? 'That\u2019s it' : 'Not quite'}
            </Text>
            <Text style={styles.whyBody}>{revealed.why}</Text>
          </View>
        )}

        {error && checkTotal > 0 && <Text style={styles.inlineError}>{error}</Text>}
      </ScrollView>

      <CtaButton
        label={busy === 'submit' ? 'Marking…' : nextLabel}
        active={Boolean(revealed) && !waiting}
        onPress={actions.nextCheck}
        style={{ marginTop: 12 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 18 },
  centered: { paddingTop: 66, paddingBottom: 40, gap: 14, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  loadingText: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 16, color: colors.text, textAlign: 'center' },
  loadingHint: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral600, textAlign: 'center' },
  errorTitle: { fontFamily: fonts.heading, fontSize: 22, color: colors.text, textAlign: 'center' },
  errorBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.neutral700, textAlign: 'center' },
  link: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.accent700 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: { flex: 1, height: 10, borderRadius: 999, backgroundColor: colors.neutral200, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.accent2_500 },
  progressLabel: { fontFamily: fonts.bodyBold, fontSize: 14, fontWeight: '700', color: colors.neutral700 },
  qCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 22, gap: 8, ...shadow.md },
  qKicker: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  qText: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, color: colors.text },
  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 999, borderWidth: 2, paddingVertical: 15, paddingHorizontal: 20,
  },
  optOn: { backgroundColor: colors.accent100, borderColor: colors.accent },
  optOff: { backgroundColor: '#fff', borderColor: colors.neutral200 },
  optRight: { backgroundColor: colors.accent2_100, borderColor: colors.accent2_500 },
  optWrong: { backgroundColor: colors.accent100, borderColor: colors.accent },
  optLabel: { fontFamily: fonts.body, fontSize: 17, flexShrink: 1 },
  dot: { width: 26, height: 26, borderRadius: 999 },
  dotOn: { borderWidth: 8, borderColor: colors.accent },
  dotOff: { borderWidth: 2.75, borderColor: colors.neutral300 },
  inlineError: { fontFamily: fonts.body, fontSize: 14, color: colors.accent800, textAlign: 'center' },
  whyCard: { borderRadius: radius.md, borderWidth: 2, padding: 16, gap: 5 },
  whyRight: { backgroundColor: colors.accent2_100, borderColor: colors.accent2_300 },
  whyWrong: { backgroundColor: colors.accent100, borderColor: colors.accent300 },
  whyTitle: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 14 },
  whyBody: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21, color: colors.text },
});
