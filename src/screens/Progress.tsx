import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';
import type { ConceptNode } from '../services/backend';

const STATE_LABEL: Record<ConceptNode['state'], string> = {
  unknown: 'Not tested',
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
  const { nodes, plan, readiness, masteredCount, activeExam, readyExams, activeExamId, actions } = useApp();

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

  const nexoraRead = plan
    ? plan.action === 'done'
      ? 'Everything in this syllabus is solid. Keep revising so it holds.'
      : plan.reason
    : 'Add a syllabus and I will map out what to do.';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.h2}>Progress</Text>
          <Pressable onPress={actions.goBadges} style={styles.badgesBtn}>
            <Text style={styles.badgesBtnText}>Badges</Text>
          </Pressable>
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
          </ScrollView>
        )}

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.accent2_100 }]}>
            <Text style={[styles.statValue, { color: colors.accent2_800 }]}>{readiness}%</Text>
            <Text style={[styles.statLabel, { color: colors.accent2_800 }]}>{activeExam?.subject ?? 'Ready'}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.accent100 }]}>
            <Text style={[styles.statValue, { color: colors.accent800 }]}>{masteredCount}</Text>
            <Text style={[styles.statLabel, { color: colors.accent800 }]}>Learned</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.neutral200 }]}>
            <Text style={styles.statValue}>{plan?.daysToExam ?? '—'}</Text>
            <Text style={[styles.statLabel, { color: colors.neutral700 }]}>Days left</Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <View style={styles.noteAvatar}><Text style={styles.noteAvatarText}>N</Text></View>
          <Text style={styles.noteText}>{nexoraRead}</Text>
        </View>

        {chapters.map(([chapter, list]) => (
          <View key={chapter} style={{ gap: 12 }}>
            <Text style={styles.chapterLabel}>{chapter}</Text>
            {list.map((n) => (
              <View key={n.id} style={{ gap: 7 }}>
                <View style={styles.topicHeaderRow}>
                  <Text style={styles.topicName} numberOfLines={1}>{n.name}</Text>
                  <Text style={[styles.topicLabel, { color: fillFor(n.state) }]}>{STATE_LABEL[n.state]}</Text>
                </View>
                <View style={styles.cellsRow}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[styles.cell, {
                        backgroundColor: i < Math.round(n.strength * 5) ? fillFor(n.state) : colors.neutral200,
                      }]}
                    />
                  ))}
                </View>
                {n.prereqs.length > 0 && (
                  <Text style={styles.prereqLine}>needs {n.prereqs.length} earlier concept{n.prereqs.length === 1 ? '' : 's'}</Text>
                )}
              </View>
            ))}
          </View>
        ))}

        {nodes.length === 0 && (
          <Text style={styles.empty}>No plan yet. Add an exam with a syllabus to see your map.</Text>
        )}
      </ScrollView>
      <TabBar active="progress" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral100 },
  content: { paddingHorizontal: 24, paddingBottom: 18, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h2: { fontFamily: fonts.heading, fontSize: 28, color: colors.text },
  badgesBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16, backgroundColor: colors.accent100 },
  badgesBtnText: { fontFamily: fonts.bodyExtraBold, fontSize: 14, fontWeight: '800', color: colors.accent800 },
  pillRow: { alignItems: 'center', gap: 8 },
  pill: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  pillOn: { backgroundColor: colors.accent },
  pillOff: { backgroundColor: '#fff', borderWidth: 2, borderColor: colors.neutral200 },
  pillLabel: { fontFamily: fonts.bodyExtraBold, fontSize: 14, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: radius.md, padding: 14 },
  statValue: { fontFamily: fonts.heading, fontSize: 26, color: colors.text },
  statLabel: { fontFamily: fonts.bodyBold, fontSize: 12, fontWeight: '700' },
  chartCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, gap: 14, ...shadow.sm },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chartTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  chartDays: { fontFamily: fonts.bodyBold, fontSize: 12, fontWeight: '700', color: colors.neutral600 },
  chartBars: { height: 108, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  bar: { flex: 1, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  chartFooterText: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral600 },
  readCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.accent100, borderRadius: radius.lg, padding: 16, paddingHorizontal: 18 },
  readAvatar: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.accent2_500, alignItems: 'center', justifyContent: 'center' },
  readAvatarText: { fontFamily: fonts.heading, fontSize: 15, color: '#fff' },
  readText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.accent900 },
  parentBtn: { backgroundColor: '#fff', borderRadius: radius.md, padding: 14, paddingHorizontal: 16, ...shadow.sm },
  parentBtnText: { fontFamily: fonts.bodyBold, fontSize: 15, fontWeight: '700', color: colors.text },
  chapterLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  prereqLine: { fontFamily: fonts.body, fontSize: 12, color: colors.neutral500 },
  empty: { fontFamily: fonts.body, fontSize: 15, color: colors.neutral600, textAlign: 'center', paddingVertical: 40 },
  noteCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 16,
  },
  noteAvatar: {
    width: 34, height: 34, borderRadius: 999, backgroundColor: colors.accent2_500,
    alignItems: 'center', justifyContent: 'center',
  },
  noteAvatarText: { fontFamily: fonts.heading, fontSize: 16, color: '#fff' },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.accent2_900 },
  topicHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  topicName: { flex: 1, fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  topicLabel: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 14 },
  cellsRow: { flexDirection: 'row', gap: 5 },
  cell: { flex: 1, height: 9, borderRadius: 999 },
});
