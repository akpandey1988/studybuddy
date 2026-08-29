import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { CameraIcon, LeafIcon } from '../components/Icons';
import { HeroBlobs, Nexora, ReadinessRing, SubjectGlyph } from '../components/Art';
import { PressableScale, Rise } from '../components/Motion';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

/** Today's plan, straight from the planner — nothing is decided on the client. */
export function HomeScreen() {
  const {
    firstName, exams, activeExam, activeExamId, readyExams, plan, focusNode,
    readiness, masteredCount, nodes, busy, error, actions,
  } = useApp();

  // The planner's justification runs to five lines on a real graph, which used
  // to push the only call to action off the bottom of the screen. It's kept,
  // but folded away until it's asked for.
  const [whyOpen, setWhyOpen] = React.useState(false);

  const loading = busy === 'plan' && !plan;
  const daysLine = plan
    ? `${plan.daysToExam} day${plan.daysToExam === 1 ? '' : 's'} to go`
    : 'Getting your plan…';

  const actionLabel = plan?.action === 'review' ? 'Revise'
    : plan?.action === 'practise' ? 'Check' : 'Learn';
  const ctaLabel = plan?.action === 'review' ? 'Revise with Nexora'
    : plan?.action === 'practise' ? 'Take the check'
      : 'Start with Nexora';
  const onCta = plan?.action === 'practise' ? actions.startCheck : actions.goNexora;
  const mood = plan?.action === 'done' ? 'cheer' : readiness >= 50 ? 'happy' : 'idle';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={busy === 'plan'} onRefresh={actions.refreshPlan} tintColor={colors.accent} />
        }
      >
        <View style={styles.hero}>
          <HeroBlobs height={260} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dayLine}>{daysLine}</Text>
              <Text style={styles.h2}>Hi {firstName}</Text>
            </View>
            {/* The pill row below only appears with two or more exams, so a
                single-exam student needs this to reach the hub at all. */}
            <PressableScale onPress={actions.goExams} style={styles.examsChip}>
              <Text style={styles.examsChipText}>Exams</Text>
            </PressableScale>
            <View style={styles.streakChip}>
              <LeafIcon size={17} />
              <Text style={styles.streakNum}>{masteredCount}</Text>
            </View>
          </View>

          {/* The buddy and the number, side by side — the top of the screen
              was previously type all the way down. */}
          <Rise>
            <View style={styles.heroRow}>
              <Nexora size={104} mood={mood} />
              <View style={styles.heroRight}>
                <ReadinessRing
                  value={readiness}
                  caption={activeExam?.subject ?? 'Ready'}
                  size={112}
                />
                <Text style={styles.heroCaption}>{masteredCount} of {nodes.length} concepts</Text>
              </View>
            </View>
          </Rise>
        </View>

        {readyExams.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {readyExams.map((e) => {
              const on = e.id === activeExamId;
              return (
                <PressableScale key={e.id} onPress={() => actions.pickSubjectPill(e.id)} style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
                  <Text style={[styles.pillLabel, { color: on ? '#fff' : colors.neutral700 }]}>{e.subject}</Text>
                </PressableScale>
              );
            })}
            <PressableScale onPress={actions.goExams} style={styles.addExamPill}>
              <Text style={styles.addExamLabel}>+ Exam</Text>
            </PressableScale>
          </ScrollView>
        )}

        <View style={styles.body}>
          {error && (
            <PressableScale onPress={actions.refreshPlan} style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorRetry}>Tap to try again</Text>
            </PressableScale>
          )}

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText}>Working out what to do next…</Text>
            </View>
          ) : plan?.action === 'done' ? (
            <Rise delay={80}>
              <View style={styles.doneCard}>
                <Text style={styles.focusTitle}>Nothing left to learn</Text>
                <Text style={styles.focusWhy}>{plan.reason}</Text>
              </View>
            </Rise>
          ) : plan ? (
            <>
              <Rise delay={80}>
                <View style={styles.focusCard}>
                  <View style={styles.focusBadgeRow}>
                    {activeExam && <SubjectGlyph subject={activeExam.subject} size={40} />}
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={styles.badgeLine}>
                        <View style={styles.nowBadge}><Text style={styles.nowBadgeText}>{actionLabel.toUpperCase()}</Text></View>
                        {focusNode && (
                          <View style={styles.subjBadge}>
                            <Text style={styles.subjBadgeText} numberOfLines={1}>{focusNode.chapter}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <Text style={styles.focusTitle}>{plan.conceptName}</Text>

                  {/* Collapsed by default so the button below stays on screen. */}
                  <Pressable onPress={() => setWhyOpen((v) => !v)} hitSlop={6}>
                    <Text style={styles.focusWhy} numberOfLines={whyOpen ? undefined : 2}>
                      {plan.reason}
                    </Text>
                    <Text style={styles.whyToggle}>{whyOpen ? 'Show less' : 'Why this?'}</Text>
                  </Pressable>

                  {plan.unlocks && (
                    <View style={styles.unlockRow}>
                      <Text style={styles.unlockText} numberOfLines={1}>Unlocks {plan.unlocks.name}</Text>
                    </View>
                  )}

                  <PressableScale onPress={onCta} style={styles.startBtn}>
                    <Text style={styles.startBtnLabel}>{ctaLabel}</Text>
                  </PressableScale>
                </View>
              </Rise>

              {/* Not everything a student needs is the next thing in the plan. */}
              <Rise delay={160}>
                <PressableScale onPress={actions.goScan} style={styles.scanRow}>
                  <View style={styles.scanIcon}><CameraIcon size={20} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scanTitle}>Stuck on something else?</Text>
                    <Text style={styles.scanHint}>Scan it and talk it through</Text>
                  </View>
                </PressableScale>
              </Rise>

              {plan.dueForReview.length > 0 && (
                <Rise delay={220}>
                  <View style={styles.reviewCard}>
                    <Text style={styles.reviewTitle}>{plan.dueForReview.length} going stale</Text>
                    <Text style={styles.reviewBody} numberOfLines={2}>
                      {plan.dueForReview.slice(0, 3).map((d) => d.name).join(', ')}
                      {plan.dueForReview.length > 3 ? ' and more' : ''}
                    </Text>
                  </View>
                </Rise>
              )}
            </>
          ) : (
            <PressableScale onPress={actions.goExams} style={styles.loadingCard}>
              <Text style={styles.loadingText}>
                {exams.length === 0 ? 'Add an exam to get started.' : 'Pick an exam to see your plan.'}
              </Text>
            </PressableScale>
          )}
        </View>
      </ScrollView>
      <TabBar active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral100 },
  scroll: { paddingBottom: 24 },
  hero: { paddingTop: 14, paddingBottom: 6 },
  headerRow: {
    paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 8,
  },
  examsChip: {
    backgroundColor: colors.white, borderWidth: 2, borderColor: colors.neutral200,
    borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13,
  },
  examsChipText: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 13, color: colors.neutral700 },
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
  heroRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, gap: 14,
  },
  // Pinned to the ring's width; the caption is wider than the ring and was
  // otherwise stretching this column into the screen edge.
  heroRight: { alignItems: 'center', gap: 6, width: 124 },
  heroCaption: {
    fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 12,
    color: colors.neutral700, textAlign: 'center',
  },
  pillRow: { paddingHorizontal: 24, paddingTop: 10, alignItems: 'center', gap: 8 },
  pill: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  pillOn: { backgroundColor: colors.accent },
  pillOff: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.neutral200 },
  pillLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, fontWeight: '800' },
  addExamPill: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.accent300, backgroundColor: colors.accent100,
    borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14,
  },
  addExamLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, fontWeight: '800', color: colors.accent800 },
  body: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24, gap: 14 },
  errorBanner: {
    backgroundColor: colors.accent100, borderRadius: radius.md, borderWidth: 2,
    borderColor: colors.accent300, padding: 14, gap: 4,
  },
  errorText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.accent900 },
  errorRetry: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, color: colors.accent700 },
  loadingCard: {
    backgroundColor: '#fff', borderRadius: radius.md, padding: 24,
    alignItems: 'center', gap: 12, ...shadow.sm,
  },
  loadingText: { fontFamily: fonts.body, fontSize: 15, color: colors.neutral700, textAlign: 'center' },
  doneCard: { backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 20, gap: 6 },
  focusCard: {
    borderWidth: 2, borderColor: colors.accent, borderRadius: radius.lg, backgroundColor: '#fff',
    padding: 16, gap: 11, ...shadow.md,
  },
  focusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  badgeLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nowBadge: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, backgroundColor: colors.accent },
  nowBadgeText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800', color: '#fff' },
  subjBadge: { flexShrink: 1, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, backgroundColor: colors.accent2_100 },
  subjBadgeText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800', color: colors.accent2_800 },
  focusTitle: { fontFamily: fonts.heading, fontSize: 21, lineHeight: 26, color: colors.text },
  focusWhy: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.neutral700 },
  whyToggle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, color: colors.accent700, marginTop: 4 },
  unlockRow: { backgroundColor: colors.accent2_100, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 12 },
  unlockText: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, color: colors.accent2_800 },
  startBtn: { backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center', ...shadow.md },
  startBtnLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, color: '#fff' },
  scanRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: '#fff', borderRadius: radius.md, padding: 14, paddingHorizontal: 16, ...shadow.sm,
  },
  scanIcon: {
    width: 38, height: 38, borderRadius: 999, backgroundColor: colors.accent100,
    alignItems: 'center', justifyContent: 'center',
  },
  scanTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  scanHint: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  reviewCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, gap: 4, ...shadow.sm },
  reviewTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  reviewBody: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.neutral600 },
});
