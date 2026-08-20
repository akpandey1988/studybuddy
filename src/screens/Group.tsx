import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackChevron } from '../components/UI';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

const PLAYERS = [
  { initial: 'I', name: 'Ishita', bg: colors.accent2_100, avatarBg: colors.accent400, nameColor: colors.accent2_900, border: false },
  { initial: 'A', name: 'You', bg: colors.accent100, avatarBg: colors.accent2_500, nameColor: colors.accent900, border: true },
  { initial: 'R', name: 'Rehan', bg: colors.neutral200, avatarBg: colors.accent2_400, nameColor: colors.neutral800, border: false },
  { initial: 'S', name: 'Sara', bg: colors.accent2_100, avatarBg: colors.accent500, nameColor: colors.accent2_900, border: false },
];

const SCORES = [
  { color: colors.accent400, pct: 78, value: 7 },
  { color: colors.accent2_500, pct: 66, value: 6 },
  { color: colors.neutral400, pct: 44, value: 4, trackFill: colors.neutral400 },
];

export function GroupScreen() {
  const { actions } = useApp();

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <BackChevron onPress={actions.goHome} />
        <View>
          <Text style={styles.kicker}>Group session · 4 in</Text>
          <Text style={styles.h2}>Fraction Face-Off</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {PLAYERS.map((p) => (
          <View key={p.name} style={[styles.tile, { backgroundColor: p.bg }, p.border && styles.tileBorder]}>
            <View style={[styles.tileAvatar, { backgroundColor: p.avatarBg }]}><Text style={styles.tileAvatarText}>{p.initial}</Text></View>
            <Text style={[styles.tileName, { color: p.nameColor }]}>{p.name}</Text>
          </View>
        ))}
      </View>

      <View style={styles.qCard}>
        <View style={styles.qHeaderRow}>
          <Text style={styles.qKicker}>Question 3 of 8</Text>
          <Text style={styles.qTimer}>0:22</Text>
        </View>
        <Text style={styles.qText}>Order these: 2/3, 5/9, 7/12</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={styles.optOff}><Text style={styles.optOffText}>Smallest first</Text></View>
          <View style={styles.optOn}><Text style={styles.optOnText}>Largest first</Text></View>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.sectionLabel}>Room score</Text>
        {SCORES.map((row, i) => (
          <View key={i} style={styles.scoreRow}>
            <View style={[styles.scoreDot, { backgroundColor: row.color }]} />
            <View style={styles.scoreTrack}>
              <View style={[styles.scoreFill, { width: `${row.pct}%`, backgroundColor: row.trackFill ?? row.color }]} />
            </View>
            <Text style={styles.scoreValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>Everyone's wins here still count toward your own plan.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 66, paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  kicker: {
    fontFamily: fonts.bodyExtraBold, fontSize: 13, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.accent700,
  },
  h2: { fontFamily: fonts.heading, fontSize: 26, marginTop: 4, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', height: 112, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', position: 'relative' as const },
  tileBorder: { borderWidth: 2.5, borderColor: colors.accent },
  tileAvatar: { width: 52, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tileAvatarText: { fontFamily: fonts.heading, fontSize: 22, color: '#fff' },
  tileName: { position: 'absolute', left: 10, bottom: 8, fontFamily: fonts.bodyExtraBold, fontSize: 11, fontWeight: '800' },
  qCard: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 18, gap: 12, ...shadow.md },
  qHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qKicker: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  qTimer: { fontFamily: fonts.bodyExtraBold, fontSize: 13, fontWeight: '800', color: colors.accent700 },
  qText: { fontFamily: fonts.heading, fontSize: 21, lineHeight: 26, color: colors.text },
  optOff: { flex: 1, alignItems: 'center', borderWidth: 2, borderColor: colors.neutral300, borderRadius: 999, paddingVertical: 11 },
  optOffText: { fontFamily: fonts.bodyBold, fontSize: 14, fontWeight: '700', color: colors.text },
  optOn: { flex: 1, alignItems: 'center', borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accent100, borderRadius: 999, paddingVertical: 11 },
  optOnText: { fontFamily: fonts.bodyBold, fontSize: 14, fontWeight: '700', color: colors.accent800 },
  sectionLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreDot: { width: 26, height: 26, borderRadius: 999 },
  scoreTrack: { flex: 1, height: 12, borderRadius: 999, backgroundColor: colors.neutral200 },
  scoreFill: { height: '100%', borderRadius: 999 },
  scoreValue: { width: 26, textAlign: 'right', fontFamily: fonts.bodyExtraBold, fontSize: 13, fontWeight: '800', color: colors.text },
  footerNote: { marginTop: 'auto' as const, backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 13, paddingHorizontal: 16 },
  footerNoteText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.accent2_900 },
});
