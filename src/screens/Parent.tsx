import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackChevron, Kicker, SectionLabel } from '../components/UI';
import { GearIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEK_STUDIED = [true, true, false, true, true, false, true];

export function ParentScreen() {
  const { activeExam, exams, plan, nodes, readiness, masteredCount, activeName, firstName, actions } = useApp();

  const parentNote = plan && nodes.length > 0
    ? `${activeName} is at ${readiness}%, with ${masteredCount} of ${nodes.length} concepts proved.`
      + (plan.action === 'done'
        ? ' Everything on the syllabus is solid — revision from here.'
        : ` Right now the work is ${plan.conceptName}.`)
      + ' Ten minutes of reading the question aloud together helps more than extra drills.'
    : "Add an exam and I'll send a weekly read on how it's going.";

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <BackChevron onPress={actions.goProgress} />
        <View>
          <Kicker>Parent view</Kicker>
          <Text style={styles.h2}>{firstName} · week 1</Text>
        </View>
      </View>

      <View style={styles.weekCard}>
        <View style={styles.weekHeaderRow}>
          <Text style={styles.weekTitle}>Studied 5 of 7 days</Text>
          <Text style={styles.weekMinutes}>96 min</Text>
        </View>
        <View style={styles.weekBarsRow}>
          {WEEK_STUDIED.map((studied, i) => (
            <View key={i} style={[styles.weekBar, { backgroundColor: studied ? colors.accent2_500 : colors.neutral200 }]} />
          ))}
        </View>
        <View style={styles.weekLabelsRow}>
          {WEEK_DAYS.map((d, i) => <Text key={i} style={styles.weekLabel}>{d}</Text>)}
        </View>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Nexora's note home</Text>
        <Text style={styles.noteText}>{parentNote}</Text>
      </View>

      <SectionLabel>Exams running</SectionLabel>
      <View>
        {exams.map((e) => {
          const ready = e.graphStatus === 'ready';
          const isActive = e.id === activeExam?.id;
          const value = !ready
            ? (e.graphStatus === 'pending' ? 'Building plan' : 'Plan failed')
            : isActive ? `${readiness}% ready` : `${e.conceptCount} concepts`;
          return (
            <View key={e.id} style={styles.examRow}>
              <Text style={styles.examName}>{e.subject}</Text>
              <Text style={[styles.examValue, { color: ready ? colors.accent2_700 : colors.neutral600 }]}>{value}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.digestBtn}><Text style={styles.digestBtnText}>Weekly digest on</Text></View>
        <View style={styles.gearBtn}><GearIcon size={22} /></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  h2: { fontFamily: fonts.heading, fontSize: 27, marginTop: 4, color: colors.text },
  weekCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, gap: 12, ...shadow.sm },
  weekHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  weekTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 16, color: colors.text },
  weekMinutes: { fontFamily: fonts.heading, fontSize: 20, color: colors.accent2_700 },
  weekBarsRow: { flexDirection: 'row', gap: 6 },
  weekBar: { flex: 1, height: 40, borderRadius: 10 },
  weekLabelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekLabel: { fontFamily: fonts.bodyBold, fontSize: 12, fontWeight: '700', color: colors.neutral600 },
  noteCard: { backgroundColor: colors.accent100, borderRadius: radius.lg, padding: 16, paddingHorizontal: 18, gap: 8 },
  noteTitle: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 15, color: colors.accent900 },
  noteText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.accent900 },
  examRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 2,
    borderBottomWidth: 2, borderBottomColor: colors.neutral200,
  },
  examName: { fontFamily: fonts.bodySemiBold, fontWeight: '600', fontSize: 15, color: colors.text },
  examValue: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15 },
  footerRow: { marginTop: 'auto' as const, flexDirection: 'row', gap: 10 },
  digestBtn: { flex: 1, alignItems: 'center', borderRadius: 999, paddingVertical: 14, backgroundColor: colors.accent },
  digestBtnText: { fontFamily: fonts.bodyExtraBold, fontSize: 15, fontWeight: '800', color: '#fff' },
  gearBtn: { width: 52, borderRadius: 999, backgroundColor: colors.neutral200, alignItems: 'center', justifyContent: 'center' },
});
