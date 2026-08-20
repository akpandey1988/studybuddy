import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme/tokens';

// ── CTA pill button (matches the dc.html `cta(on)` helper) ────────────────
export function CtaButton({
  label, onPress, active = true, style,
}: { label: string; onPress: () => void; active?: boolean; style?: ViewStyle }) {
  return (
    <Pressable
      onPress={active ? onPress : undefined}
      style={[styles.cta, active ? styles.ctaOn : styles.ctaOff, style]}
    >
      <Text style={[styles.ctaLabel, { color: active ? '#fff' : colors.neutral500 }]}>{label}</Text>
    </Pressable>
  );
}

// ── Selectable chip (matches the dc.html `chip(on)` helper) ───────────────
export function Chip({
  label, onPress, active = false, style, textStyle,
}: { label: string; onPress: () => void; active?: boolean; style?: ViewStyle; textStyle?: TextStyle }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipOn : styles.chipOff, style]}>
      <Text style={[styles.chipLabel, { color: active ? '#fff' : colors.neutral700 }, textStyle]}>{label}</Text>
    </Pressable>
  );
}

// ── Small "Nexora says" note card ──────────────────────────────────────────
export function NexoraNote({ text, initial = 'N' }: { text: string; initial?: string }) {
  return (
    <View style={styles.note}>
      <View style={styles.noteAvatar}><Text style={styles.noteAvatarText}>{initial}</Text></View>
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

export function BackChevron({ onPress, color = colors.neutral700 }: { onPress: () => void; color?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.backBtn}>
      <Text style={[styles.backChevron, { color }]}>‹</Text>
    </Pressable>
  );
}

export function Kicker({ children, color = colors.accent700 }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.kicker, { color }]}>{children}</Text>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// Pushes everything after it to the bottom of a flex-grow container
// (mirrors the dc.html `margin-top: auto` pattern).
export function Spacer() {
  return <View style={{ flexGrow: 1, minHeight: 12 }} />;
}

const styles = StyleSheet.create({
  cta: {
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaOn: { backgroundColor: colors.accent, ...shadow.md },
  ctaOff: { backgroundColor: colors.neutral200 },
  ctaLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 17 },

  chip: {
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 2,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipOff: { backgroundColor: colors.white, borderColor: colors.neutral200 },
  chipLabel: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15 },

  note: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.accent2_100, borderRadius: radius.md,
    padding: 14, paddingHorizontal: 16,
  },
  noteAvatar: {
    width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.accent2_500,
    alignItems: 'center', justifyContent: 'center',
  },
  noteAvatarText: { fontFamily: fonts.heading, fontSize: 15, color: '#fff' },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.accent2_900 },

  backBtn: { alignSelf: 'flex-start', paddingRight: 4 },
  backChevron: { fontSize: 30, lineHeight: 30 },

  kicker: {
    fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700',
    letterSpacing: 1.3, textTransform: 'uppercase',
  },
  sectionLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1.2, textTransform: 'uppercase', color: colors.neutral600,
  },
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, ...shadow.sm,
  },
});
