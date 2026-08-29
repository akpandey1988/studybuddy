import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Nexora } from '../components/Art';
import { PressableScale, Pulse, Rise } from '../components/Motion';
import { CheckIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { colors, fonts, radius } from '../theme/tokens';

const STEPS = [
  'Reading your syllabus',
  'Splitting it into single sittings',
  'Working out what comes before what',
  'Weighting it by exam marks',
];

/**
 * Building the graph is the one genuinely slow call in the product — a large
 * reasoning request over the whole syllabus. Showing the steps ticking off
 * says "still working" better than a spinner and a paragraph did.
 */
export function BuildingScreen() {
  const { draftSubject, error, actions } = useApp();
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 6000);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <Screen style={styles.content}>
        <View style={styles.centre}>
          <Nexora size={124} mood="oops" />
          <Text style={styles.h2}>That didn’t work</Text>
          <Text style={styles.body}>{error}</Text>
        </View>
        <View style={{ gap: 10 }}>
          <PressableScale onPress={() => { actions.clearError(); actions.buildExam(); }} style={styles.retry}>
            <Text style={styles.retryLabel}>Try again</Text>
          </PressableScale>
          <Text style={styles.linkMuted} onPress={() => { actions.clearError(); actions.goExams(); }}>
            Back to my exams
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.content}>
      <View style={styles.centre}>
        <Pulse color={colors.accent2_300} size={150}>
          <Nexora size={132} mood="thinking" />
        </Pulse>
        <Text style={styles.h2}>Building your{'\n'}{draftSubject ?? 'exam'} plan</Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((label, i) => {
          const done = i < step;
          const now = i === step;
          return (
            <Rise key={label} delay={i * 90}>
              <View style={[styles.step, now && styles.stepNow]}>
                <View style={[styles.bullet, done ? styles.bulletDone : now ? styles.bulletNow : styles.bulletIdle]}>
                  {done ? <CheckIcon size={14} color="#fff" /> : now ? <ActivityIndicator size="small" color={colors.accent} /> : null}
                </View>
                <Text
                  style={[styles.stepLabel, {
                    color: done ? colors.neutral600 : now ? colors.text : colors.neutral500,
                    fontWeight: now ? '800' : '600',
                  }]}
                >
                  {label}
                </Text>
              </View>
            </Rise>
          );
        })}
      </View>

      <Text style={styles.hint}>Once per exam — after this, Nexora knows the order.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 22, justifyContent: 'center', flexGrow: 1 },
  centre: { alignItems: 'center', gap: 16 },
  h2: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 33, color: colors.text, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.neutral700, textAlign: 'center' },
  steps: { gap: 8 },
  step: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  stepNow: { backgroundColor: colors.accent2_100 },
  bullet: { width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  bulletDone: { backgroundColor: colors.accent2_500 },
  bulletNow: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.accent300 },
  bulletIdle: { backgroundColor: colors.neutral200 },
  stepLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 21 },
  hint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.neutral600, textAlign: 'center' },
  retry: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  retryLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, color: '#fff' },
  linkMuted: { fontFamily: fonts.body, fontSize: 15, color: colors.neutral600, textAlign: 'center', paddingVertical: 6 },
});
