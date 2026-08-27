import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { CheckIcon, LeafIcon, UploadIcon } from '../components/Icons';
import { examStats, useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

export function HomeScreen() {
  const {
    s, active, st, ready, missingSyllabus, second, secondStats,
    activeName, readiness, focus, topicProgress, actions,
  } = useApp();

  const dayLine = `Day 4 · ${ready.length} exam${ready.length === 1 ? '' : 's'} running`;
  const firstName = s.name.trim().split(' ')[0] || 'there';
  const hasMissing = missingSyllabus.length > 0;
  const missingText = hasMissing
    ? missingSyllabus.map((e) => e.subject).join(', ') + (missingSyllabus.length === 1 ? ' has no syllabus yet' : ' have no syllabus yet')
    : '';
  const readinessLabel = `${activeName} readiness`;
  const warmupTitle = st
    ? `Warm-up: 5 quick ${(st.cat.topics.find((t) => t !== focus) || st.cat.topics[0]).toLowerCase()} questions`
    : 'Warm-up: 5 quick questions';
  // The focus card follows the loop: taught yet? checked yet? failed a check?
  const attempts = topicProgress.attempts;
  const allDone = Boolean(st && st.allMastered);
  const focusTitle = allDone
    ? 'Every topic learned'
    : attempts > 0
      ? `${focus}: one more go`
      : topicProgress.lessons > 0
        ? `${focus}: ready to check`
        : st && st.weak.indexOf(focus) >= 0
          ? `${focus}: the bit you missed`
          : `${focus}: new ground`;
  const focusWhy = allDone
    ? 'You have proved every topic in this subject with a check. Keep them warm and you are done.'
    : attempts > 0
      ? `You got ${topicProgress.lastScore} of ${topicProgress.outOf} last time. Nexora explains it again, then a fresh check — new questions, not the same ones.`
      : topicProgress.lessons > 0
        ? 'Nexora has walked you through this. Take the check to prove it stuck.'
        : st && st.weak.indexOf(focus) >= 0
          ? 'You slipped on this in the baseline. Nexora walks it through, then checks you on it.'
          : 'Not proved yet. Nexora teaches this one, then checks you on it.';
  const focusCta = attempts > 0 ? 'Go again with Nexora' : 'Start with Nexora';
  const secondTitle = second && secondStats ? `${second.subject}: ${secondStats.focus} drill · 8 min` : '';
  const secondMeta = second ? `Exam ${second.dateLabel} — kept warm while ${activeName} is the priority` : '';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dayLine}>{dayLine}</Text>
            <Text style={styles.h2}>Hi {firstName}</Text>
          </View>
          <View style={styles.streakChip}>
            <LeafIcon size={17} />
            <Text style={styles.streakNum}>4</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {ready.map((e) => {
            const es = examStats(e);
            const on = active && e.id === active.id;
            return (
              <Pressable key={e.id} onPress={() => actions.pickSubjectPill(e.id)} style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
                <Text style={[styles.pillLabel, { color: on ? '#fff' : colors.neutral700 }]}>{e.subject} {es.readiness}%</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={actions.goExams} style={styles.addExamPill}>
            <Text style={styles.addExamLabel}>+ Exam</Text>
          </Pressable>
        </ScrollView>

        <View style={styles.body}>
          {hasMissing && (
            <Pressable onPress={actions.fixMissing} style={styles.missingBanner}>
              <View style={styles.missingIcon}><UploadIcon size={17} color="#fff" /></View>
              <Text style={styles.missingText}>{missingText} — add it now</Text>
            </Pressable>
          )}

          <View style={styles.readinessCard}>
            <View style={styles.readinessHeader}>
              <Text style={styles.readinessLabel}>{readinessLabel}</Text>
              <Text style={styles.readinessValue}>{readiness}%</Text>
            </View>
            <View style={styles.readinessTrack}>
              <View style={[styles.readinessFill, { width: `${readiness}%` }]} />
            </View>
            <View style={styles.readinessFooter}>
              <Text style={styles.readinessFooterText}>
                {st && st.masteredCount > 0 ? `${st.masteredCount} topic${st.masteredCount === 1 ? '' : 's'} learned` : 'From your baseline'}
              </Text>
              <Text style={styles.readinessFooterText}>Target 85%</Text>
            </View>
          </View>

          <View style={styles.todayRow}>
            <Text style={styles.todayLabel}>Today · 25 min</Text>
            <Text style={styles.todayNote}>Built from your baseline</Text>
          </View>

          <View style={{ gap: 10 }}>
            <View style={styles.warmupDone}>
              <View style={styles.warmupCheck}><CheckIcon size={16} color="#fff" /></View>
              <Text style={styles.warmupTitle}>{warmupTitle}</Text>
            </View>

            <View style={styles.focusCard}>
              <View style={styles.focusBadgeRow}>
                <View style={styles.nowBadge}><Text style={styles.nowBadgeText}>NOW</Text></View>
                <View style={styles.subjBadge}><Text style={styles.subjBadgeText}>{activeName}</Text></View>
                <Text style={styles.minText}>12 min</Text>
              </View>
              <View>
                <Text style={styles.focusTitle}>{focusTitle}</Text>
                <Text style={styles.focusWhy}>{focusWhy}</Text>
              </View>
              <Pressable onPress={actions.goNexora} style={styles.startBtn}>
                <Text style={styles.startBtnLabel}>{focusCta}</Text>
              </Pressable>
              {st && (
                <Text style={styles.masteryLine}>
                  {st.masteredCount} of {st.cat.topics.length} topics learned
                  {st.gaps.length > 1 ? ` · ${st.gaps.length - 1} more after this` : ''}
                </Text>
              )}
            </View>

            {second && (
              <Pressable onPress={actions.goSecond} style={styles.listRow}>
                <View style={styles.ringBullet} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>{secondTitle}</Text>
                  <Text style={styles.listRowMeta}>{secondMeta}</Text>
                </View>
              </Pressable>
            )}

            <Pressable onPress={actions.goGroup} style={styles.listRow}>
              <View style={styles.ringBullet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listRowTitle}>Fraction Face-Off · 8 min</Text>
                <Text style={styles.listRowMeta}>3 friends waiting in the room</Text>
              </View>
            </Pressable>

            <Pressable onPress={actions.goCall} style={styles.listRow}>
              <View style={styles.ringBullet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listRowTitle}>Study room with Ishita · 5 min</Text>
                <Text style={styles.listRowMeta}>She's on the same topic today</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <TabBar active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral100 },
  scroll: { paddingTop: 14 },
  headerRow: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLine: {
    fontFamily: fonts.bodyExtraBold, fontSize: 13, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.accent700,
  },
  h2: { fontFamily: fonts.heading, fontSize: 27, marginTop: 4, color: colors.text },
  streakChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent100, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14,
  },
  streakNum: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 15, color: colors.accent800 },
  pillRow: { paddingHorizontal: 24, paddingTop: 14, alignItems: 'center', gap: 8 },
  pill: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  pillOn: { backgroundColor: colors.accent },
  pillOff: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.neutral200 },
  pillLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, fontWeight: '800' },
  addExamPill: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.accent300, backgroundColor: colors.accent100,
    borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14,
  },
  addExamLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, fontWeight: '800', color: colors.accent800 },
  body: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24, gap: 16 },
  missingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.accent100, borderRadius: radius.md, padding: 13, paddingHorizontal: 16,
  },
  missingIcon: {
    width: 30, height: 30, borderRadius: 999, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  missingText: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 19, fontWeight: '700', color: colors.accent900 },
  readinessCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, gap: 12, ...shadow.md },
  readinessHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  readinessLabel: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 16, color: colors.text },
  readinessValue: { fontFamily: fonts.heading, fontSize: 24, color: colors.accent2_700 },
  readinessTrack: { height: 14, borderRadius: 999, backgroundColor: colors.neutral200, overflow: 'hidden' },
  readinessFill: { height: '100%', borderRadius: 999, backgroundColor: colors.accent2_500 },
  readinessFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  readinessFooterText: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral700 },
  todayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  todayNote: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.accent700 },
  warmupDone: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 14, paddingHorizontal: 16,
  },
  warmupCheck: {
    width: 28, height: 28, borderRadius: 999, backgroundColor: colors.accent2_500,
    alignItems: 'center', justifyContent: 'center',
  },
  warmupTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, textDecorationLine: 'line-through', color: colors.neutral600 },
  focusCard: {
    borderWidth: 2, borderColor: colors.accent, borderRadius: radius.md, backgroundColor: '#fff',
    padding: 16, gap: 12, ...shadow.sm,
  },
  focusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nowBadge: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, backgroundColor: colors.accent },
  nowBadgeText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800', color: '#fff' },
  subjBadge: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, backgroundColor: colors.accent2_100 },
  subjBadgeText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800', color: colors.accent2_800 },
  minText: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.neutral700 },
  focusTitle: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 24, color: colors.text },
  focusWhy: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral700, marginTop: 5 },
  masteryLine: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral600, textAlign: 'center' },
  startBtn: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  startBtnLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, color: '#fff' },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: '#fff', borderRadius: radius.md, padding: 14, paddingHorizontal: 16, ...shadow.sm,
  },
  ringBullet: { width: 28, height: 28, borderRadius: 999, borderWidth: 2.75, borderColor: colors.neutral300 },
  listRowTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  listRowMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
});
