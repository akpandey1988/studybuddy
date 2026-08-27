import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { LeafIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

/** Today's plan, straight from the planner — nothing is decided on the client. */
export function HomeScreen() {
  const {
    firstName, exams, activeExam, activeExamId, readyExams, plan, focusNode,
    readiness, masteredCount, nodes, busy, error, actions,
  } = useApp();

  const loading = busy === 'plan' && !plan;
  const daysLine = plan
    ? `${plan.daysToExam} day${plan.daysToExam === 1 ? '' : 's'} to go · ${readyExams.length} exam${readyExams.length === 1 ? '' : 's'}`
    : 'Getting your plan…';

  const actionLabel = plan?.action === 'review' ? 'Revise'
    : plan?.action === 'practise' ? 'Check' : 'Learn';
  const ctaLabel = plan?.action === 'review' ? 'Revise with Nexora'
    : plan?.action === 'practise' ? 'Take the check'
      : 'Start with Nexora';
  const onCta = plan?.action === 'practise' ? actions.startCheck : actions.goNexora;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={busy === 'plan'} onRefresh={actions.refreshPlan} tintColor={colors.accent} />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dayLine}>{daysLine}</Text>
            <Text style={styles.h2}>Hi {firstName}</Text>
          </View>
          <View style={styles.streakChip}>
            <LeafIcon size={17} />
            <Text style={styles.streakNum}>{masteredCount}</Text>
          </View>
        </View>

        {readyExams.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {readyExams.map((e) => {
              const on = e.id === activeExamId;
              return (
                <Pressable key={e.id} onPress={() => actions.pickSubjectPill(e.id)} style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
                  <Text style={[styles.pillLabel, { color: on ? '#fff' : colors.neutral700 }]}>{e.subject}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={actions.goExams} style={styles.addExamPill}>
              <Text style={styles.addExamLabel}>+ Exam</Text>
            </Pressable>
          </ScrollView>
        )}

        <View style={styles.body}>
          {error && (
            <Pressable onPress={actions.refreshPlan} style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorRetry}>Tap to try again</Text>
            </Pressable>
          )}

          <View style={styles.readinessCard}>
            <View style={styles.readinessHeader}>
              <Text style={styles.readinessLabel}>{activeExam?.subject ?? 'Your exam'} readiness</Text>
              <Text style={styles.readinessValue}>{readiness}%</Text>
            </View>
            <View style={styles.readinessTrack}>
              <View style={[styles.readinessFill, { width: `${readiness}%` }]} />
            </View>
            <View style={styles.readinessFooter}>
              <Text style={styles.readinessFooterText}>
                {masteredCount} of {nodes.length} concepts learned
              </Text>
              <Text style={styles.readinessFooterText}>Weighted by exam marks</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText}>Working out what to do next…</Text>
            </View>
          ) : plan?.action === 'done' ? (
            <View style={styles.doneCard}>
              <Text style={styles.focusTitle}>Nothing left to learn</Text>
              <Text style={styles.focusWhy}>{plan.reason}</Text>
            </View>
          ) : plan ? (
            <>
              <View style={styles.todayRow}>
                <Text style={styles.todayLabel}>Next up</Text>
                <Text style={styles.todayNote}>Chosen from your syllabus</Text>
              </View>

              <View style={styles.focusCard}>
                <View style={styles.focusBadgeRow}>
                  <View style={styles.nowBadge}><Text style={styles.nowBadgeText}>{actionLabel.toUpperCase()}</Text></View>
                  {focusNode && (
                    <View style={styles.subjBadge}><Text style={styles.subjBadgeText}>{focusNode.chapter}</Text></View>
                  )}
                </View>
                <View>
                  <Text style={styles.focusTitle}>{plan.conceptName}</Text>
                  {/* The planner's own justification — why this, and not something else. */}
                  <Text style={styles.focusWhy}>{plan.reason}</Text>
                </View>

                {plan.unlocks && (
                  <View style={styles.unlockRow}>
                    <Text style={styles.unlockText}>Unlocks {plan.unlocks.name}</Text>
                  </View>
                )}

                <Pressable onPress={onCta} style={styles.startBtn}>
                  <Text style={styles.startBtnLabel}>{ctaLabel}</Text>
                </Pressable>
              </View>

              {plan.dueForReview.length > 0 && (
                <View style={styles.reviewCard}>
                  <Text style={styles.reviewTitle}>
                    {plan.dueForReview.length} going stale
                  </Text>
                  <Text style={styles.reviewBody}>
                    {plan.dueForReview.slice(0, 3).map((d) => d.name).join(', ')}
                    {plan.dueForReview.length > 3 ? ' and more' : ''} — worth a revisit soon.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Pressable onPress={actions.goExams} style={styles.loadingCard}>
              <Text style={styles.loadingText}>
                {exams.length === 0 ? 'Add an exam to get started.' : 'Pick an exam to see your plan.'}
              </Text>
            </Pressable>
          )}
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
  errorBanner: {
    backgroundColor: colors.accent100, borderRadius: radius.md, borderWidth: 2,
    borderColor: colors.accent300, padding: 14, gap: 4,
  },
  errorText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.accent900 },
  errorRetry: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, color: colors.accent700 },
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
  loadingCard: {
    backgroundColor: '#fff', borderRadius: radius.md, padding: 24,
    alignItems: 'center', gap: 12, ...shadow.sm,
  },
  loadingText: { fontFamily: fonts.body, fontSize: 15, color: colors.neutral700, textAlign: 'center' },
  doneCard: { backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 20, gap: 6 },
  focusCard: {
    borderWidth: 2, borderColor: colors.accent, borderRadius: radius.md, backgroundColor: '#fff',
    padding: 16, gap: 12, ...shadow.sm,
  },
  focusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  nowBadge: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, backgroundColor: colors.accent },
  nowBadgeText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800', color: '#fff' },
  subjBadge: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, backgroundColor: colors.accent2_100 },
  subjBadgeText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800', color: colors.accent2_800 },
  focusTitle: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 24, color: colors.text },
  focusWhy: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.neutral700, marginTop: 5 },
  unlockRow: { backgroundColor: colors.accent2_100, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 12 },
  unlockText: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, color: colors.accent2_800 },
  startBtn: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  startBtnLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, color: '#fff' },
  reviewCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, gap: 4, ...shadow.sm },
  reviewTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  reviewBody: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.neutral600 },
});
