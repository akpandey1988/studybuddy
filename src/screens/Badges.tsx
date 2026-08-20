import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackChevron, SectionLabel } from '../components/UI';
import { CheckIcon, ClockIcon, DropIcon, FriendsIcon, LeafIcon, StarIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

const EARNED = [
  { key: 'spark', label: '3-day spark', bg: colors.accent100, Icon: LeafIcon, color: '#8c491a' },
  { key: 'sprint', label: 'First sprint', bg: colors.accent2_100, Icon: DropIcon, color: '#56633f' },
  { key: 'early', label: 'Early bird', bg: colors.accent100, Icon: ClockIcon, color: '#8c491a' },
  { key: 'buddy', label: 'Study buddy', bg: colors.accent2_100, Icon: FriendsIcon, color: '#56633f' },
  { key: 'sweep', label: 'Clean sweep', bg: colors.accent100, Icon: CheckIcon, color: '#8c491a' },
];

export function BadgesScreen() {
  const { actions } = useApp();

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <BackChevron onPress={actions.goProgress} />
        <Text style={styles.h2}>Your shelf</Text>
      </View>

      <View style={styles.earnedBanner}>
        <View style={styles.earnedIconWrap}><StarIcon size={36} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.earnedTitle}>Baseline Brave</Text>
          <Text style={styles.earnedSub}>Earned just now — you finished the baseline honestly.</Text>
        </View>
      </View>

      <SectionLabel>Earned · 6</SectionLabel>
      <View style={styles.grid}>
        {EARNED.map(({ key, label, bg, Icon, color }) => (
          <View key={key} style={styles.badgeCell}>
            <View style={[styles.badgeCircle, { backgroundColor: bg }]}><Icon size={30} color={color} /></View>
            <Text style={styles.badgeLabel}>{label}</Text>
          </View>
        ))}
        <View style={[styles.badgeCell, { opacity: 0.45 }]}>
          <View style={styles.badgeLocked}><Text style={styles.badgeLockedText}>?</Text></View>
          <Text style={styles.badgeLabel}>Day 10</Text>
        </View>
      </View>

      <View style={styles.nextCard}>
        <Text style={styles.nextTitle}>Next badge</Text>
        <View style={styles.nextTrack}><View style={styles.nextFill} /></View>
        <Text style={styles.nextText}>Two more Ratio wins for <Text style={{ fontWeight: '700' }}>Ratio Ranger</Text>.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingBottom: 40, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  h2: { fontFamily: fonts.heading, fontSize: 28, color: colors.text },
  earnedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.accent2_100, borderRadius: radius.lg, padding: 20,
  },
  earnedIconWrap: {
    width: 74, height: 74, borderRadius: 999, backgroundColor: colors.accent2_500,
    alignItems: 'center', justifyContent: 'center',
  },
  earnedTitle: { fontFamily: fonts.heading, fontSize: 20, color: colors.accent2_900 },
  earnedSub: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.accent2_800, marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  badgeCell: { width: '30%', alignItems: 'center', gap: 7 },
  badgeCircle: { width: 72, height: 72, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badgeLocked: {
    width: 72, height: 72, borderRadius: 999, backgroundColor: colors.neutral200,
    borderWidth: 2.75, borderStyle: 'dashed', borderColor: colors.neutral300,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeLockedText: { fontFamily: fonts.heading, fontSize: 22, color: colors.neutral600 },
  badgeLabel: { fontFamily: fonts.bodyBold, fontSize: 12, fontWeight: '700', textAlign: 'center', color: colors.text },
  nextCard: { marginTop: 'auto' as const, backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, paddingHorizontal: 18, gap: 10, ...shadow.sm },
  nextTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  nextTrack: { height: 10, borderRadius: 999, backgroundColor: colors.neutral200 },
  nextFill: { width: '60%', height: '100%', borderRadius: 999, backgroundColor: colors.accent400 },
  nextText: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral700 },
});
