import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useApp } from '../state/AppState';
import { colors, fonts, radius } from '../theme/tokens';

const BEATS = [
  'Reading your syllabus…',
  'Splitting it into things you can learn in one sitting…',
  'Working out what has to come before what…',
  'Weighting it by what the exam actually asks for…',
];

/**
 * Building the graph is the one genuinely slow call in the product — a large
 * reasoning request over the whole syllabus. Say what's happening rather than
 * showing a bare spinner for a minute.
 */
export function BuildingScreen() {
  const { draftSubject, error, actions } = useApp();
  const [beat, setBeat] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setBeat((b) => Math.min(b + 1, BEATS.length - 1)), 6000);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <Screen style={styles.content}>
        <Text style={styles.h2}>That didn't work</Text>
        <Text style={styles.body}>{error}</Text>
        <View style={styles.actions}>
          <Text style={styles.link} onPress={() => { actions.clearError(); actions.buildExam(); }}>
            Try again
          </Text>
          <Text style={styles.linkMuted} onPress={() => { actions.clearError(); actions.goExams(); }}>
            Back to my exams
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.content}>
      <View style={styles.card}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.h2}>Building your{'\n'}{draftSubject ?? 'exam'} plan</Text>
        <Text style={styles.body}>{BEATS[beat]}</Text>
        <Text style={styles.hint}>
          This takes a minute. It only happens once per exam — after this, Nexora knows
          exactly what to teach you and in what order.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 20, justifyContent: 'center', flexGrow: 1 },
  card: { backgroundColor: colors.accent2_100, borderRadius: radius.lg, padding: 26, gap: 14, alignItems: 'flex-start' },
  h2: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 34, color: colors.text },
  body: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 16, lineHeight: 23, color: colors.accent2_800 },
  hint: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.neutral700 },
  actions: { marginTop: 8, gap: 14 },
  link: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 16, color: colors.accent700 },
  linkMuted: { fontFamily: fonts.body, fontSize: 15, color: colors.neutral600 },
});
