import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { HeroBlobs, Nexora, NexoraAvatar, ProgressRing, ReadinessRing, StrengthDots } from '../components/Art';
import { PressableScale, Rise } from '../components/Motion';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';
import type { ConceptNode } from '../services/backend';

/** Only the states worth naming — "not tested" was on 29 of 32 rows. */
const STATE_LABEL: Partial<Record<ConceptNode['state'], string>> = {
  learning: 'Needs work',
  shaky: 'Getting there',
  mastered: 'Strong',
};

function fillFor(state: ConceptNode['state']): string {
  if (state === 'mastered') return colors.accent2_500;
  if (state === 'shaky') return colors.accent2_400;
  if (state === 'learning') return colors.accent;
  return colors.neutral300;
}

/** The graph, grouped by chapter, with this student's standing on each node. */
export function ProgressScreen() {
  const { nodes, plan, focusNode, readiness, masteredCount, activeExam, readyExams, activeExamId, actions } = useApp();

  const chapters = React.useMemo(() => {
    const map = new Map<string, ConceptNode[]>();
    for (const n of nodes) {
      const list = map.get(n.chapter) ?? [];
      list.push(n);
      map.set(n.chapter, list);
    }
    // Foundations first inside each chapter, so the order reads like a path.
    for (const list of map.values()) list.sort((a, b) => a.depth - b.depth || b.weight - a.weight);
    return [...map.entries()];
  }, [nodes]);

  /**
   * A full syllabus is 30+ concepts; listing every one expanded made this
   * screen a wall of near-identical rows. Chapters collapse, and the one
   * being worked on opens itself.
   */
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const focusChapter = focusNode?.chapter;
  const isOpen = (chapter: string) => open[chapter] ?? chapter === focusChapter;
  const toggle = (chapter: string) =>
    setOpen((o) => ({ ...o, [chapter]: !(o[chapter] ?? chapter === focusChapter) }));

  const nexoraRead = plan
    ? plan.action === 'done'
      ? 'Everything in this syllabus is solid. Keep revising so it holds.'
      : plan.reason
    : 'Add a syllabus and I will map out what to do.';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <HeroBlobs height={230} />

          <View style={styles.headerRow}>
            <Text style={styles.h2}>Progress</Text>
            <PressableScale onPress={actions.goBadges} style={styles.badgesBtn}>
              <Text style={styles.badgesBtnText}>Badges</Text>
            </PressableScale>
          </View>

          <Rise>
            <View style={styles.heroRow}>
              <ReadinessRing value={readiness} caption={activeExam?.subject ?? 'Ready'} size={128} />
              <View style={styles.heroStats}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniValue}>{masteredCount}</Text>
                  <Text style={styles.miniLabel}>Learned</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniValue}>{nodes.length}</Text>
                  <Text style={styles.miniLabel}>Concepts</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniValue}>{plan?.daysToExam ?? '—'}</Text>
                  <Text style={styles.miniLabel}>Days left</Text>
                </View>
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
          </ScrollView>
        )}

        <View style={styles.body}>
          {/* Home already shows this in full; here it's a summary line. */}
          <Rise delay={60}>
            <View style={styles.noteCard}>
              <NexoraAvatar size={36} mood={plan?.action === 'done' ? 'cheer' : 'idle'} />
              <Text style={styles.noteText} numberOfLines={3}>{nexoraRead}</Text>
            </View>
          </Rise>

          {chapters.map(([chapter, list], ci) => {
            const done = list.filter((n) => n.state === 'mastered').length;
            const pct = list.length ? (done / list.length) * 100 : 0;
            const expanded = isOpen(chapter);

            return (
              <Rise key={chapter} delay={100 + ci * 50}>
                <View style={styles.chapterCard}>
                  <PressableScale onPress={() => toggle(chapter)} style={styles.chapterHead} to={0.985}>
                    <ProgressRing value={pct} size={46} stroke={6} color={colors.accent2_500} delay={200}>
                      <Text style={styles.chapterPct}>{done}</Text>
                    </ProgressRing>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chapterName} numberOfLines={1}>{chapter}</Text>
                      <Text style={styles.chapterMeta}>{done} of {list.length} learned</Text>
                    </View>
                    <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
                  </PressableScale>

                  {expanded && (
                    <View style={styles.chapterBody}>
                      {list.map((n) => {
                        const label = STATE_LABEL[n.state];
                        return (
                          <View key={n.id} style={{ gap: 7 }}>
                            <View style={styles.topicHeaderRow}>
                              <Text style={styles.topicName} numberOfLines={1}>{n.name}</Text>
                              {label && <Text style={[styles.topicLabel, { color: fillFor(n.state) }]}>{label}</Text>}
                            </View>
                            <StrengthDots strength={n.strength} color={fillFor(n.state)} />
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </Rise>
            );
          })}

          {nodes.length === 0 && (
            <View style={styles.emptyWrap}>
              <Nexora size={110} mood="thinking" />
              <Text style={styles.empty}>No map yet — add an exam with a syllabus.</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <TabBar active="progress" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral100 },
  content: { paddingBottom: 18 },
  hero: { paddingTop: 4, paddingBottom: 4 },
  headerRow: { paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h2: { fontFamily: fonts.heading, fontSize: 28, color: colors.text },
  badgesBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16, backgroundColor: colors.accent100 },
  badgesBtnText: { fontFamily: fonts.bodyExtraBold, fontSize: 14, fontWeight: '800', color: colors.accent800 },
  heroRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12, gap: 18 },
  heroStats: { flex: 1, gap: 10 },
  miniStat: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  miniValue: { fontFamily: fonts.heading, fontSize: 22, color: colors.text, minWidth: 34 },
  miniLabel: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, color: colors.neutral600 },
  pillRow: { paddingHorizontal: 24, paddingTop: 14, alignItems: 'center', gap: 8 },
  pill: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  pillOn: { backgroundColor: colors.accent },
  pillOff: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.neutral200 },
  pillLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, fontWeight: '800' },
  body: { paddingHorizontal: 24, paddingTop: 16, gap: 12 },
  noteCard: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 14,
  },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.accent2_900 },
  chapterCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 14, ...shadow.sm },
  chapterHead: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  chapterPct: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 14, color: colors.accent2_800 },
  chapterName: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, color: colors.text },
  chapterMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600, marginTop: 2 },
  chevron: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.neutral500, paddingHorizontal: 4 },
  chapterBody: {
    gap: 14, marginTop: 14, paddingTop: 14,
    borderTopWidth: 2, borderTopColor: colors.neutral200,
  },
  topicHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  topicName: { flex: 1, fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  topicLabel: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13 },
  emptyWrap: { alignItems: 'center', gap: 14, paddingVertical: 30 },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.neutral600, textAlign: 'center' },
});
