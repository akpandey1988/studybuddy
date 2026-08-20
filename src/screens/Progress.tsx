import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { examStats, useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

const BAR_HEIGHTS = [38, 40, 43, 46, 52, 58, 64, 70, 76, 85, 100];

export function ProgressScreen() {
  const { active, ready, st, readiness, focus, second, secondStats, activeName, actions } = useApp();

  const nexoraRead = st && st.allStrong
    ? `${activeName} came back clean. We're ahead of pace there, so I gave those minutes to your nearer exam.`
    : `in ${activeName}, ${focus} is dragging. I moved its easier chapters later so we can hit it twice this week.`;
  const examDays = active ? active.days : 30;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.h2}>Progress</Text>
          <Pressable onPress={actions.goBadges} style={styles.badgesBtn}>
            <Text style={styles.badgesBtnText}>Badges</Text>
          </Pressable>
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
        </ScrollView>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.accent2_100 }]}>
            <Text style={[styles.statValue, { color: colors.accent2_800 }]}>{readiness}%</Text>
            <Text style={[styles.statLabel, { color: colors.accent2_800 }]}>{activeName}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.accent100 }]}>
            <Text style={[styles.statValue, { color: colors.accent800 }]}>4</Text>
            <Text style={[styles.statLabel, { color: colors.accent800 }]}>Day streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.neutral200 }]}>
            <Text style={styles.statValue}>96</Text>
            <Text style={[styles.statLabel, { color: colors.neutral700 }]}>Minutes</Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Readiness over the sprint</Text>
            <Text style={styles.chartDays}>{examDays} days</Text>
          </View>
          <View style={styles.chartBars}>
            {BAR_HEIGHTS.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { height: `${h}%`, backgroundColor: i === 3 ? colors.accent2_600 : i < 3 ? colors.accent2_500 : i === 10 ? colors.accent300 : colors.neutral300 },
                ]}
              />
            ))}
          </View>
          <View style={styles.chartFooter}>
            <Text style={styles.chartFooterText}>Day 1</Text>
            <Text style={[styles.chartFooterText, { fontWeight: '800', color: colors.accent700 }]}>Today</Text>
            <Text style={styles.chartFooterText}>Exam day</Text>
          </View>
        </View>

        <View style={styles.readCard}>
          <View style={styles.readAvatar}><Text style={styles.readAvatarText}>N</Text></View>
          <Text style={styles.readText}><Text style={{ fontWeight: '700' }}>Nexora's read:</Text> {nexoraRead}</Text>
        </View>

        <Pressable onPress={actions.goParent} style={styles.parentBtn}>
          <Text style={styles.parentBtnText}>Parent &amp; teacher view →</Text>
        </Pressable>
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
});
