import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackChevron, Card, CtaButton, Kicker } from '../components/UI';
import { useApp } from '../state/AppState';
import { PRIME_PRICE } from '../data/catalog';
import { colors, fonts } from '../theme/tokens';

const ROWS = [
  { label: 'Exams at once', free: '1', paid: 'Up to 8' },
  { label: 'Syllabus uploads', free: '1', paid: 'One per exam' },
  { label: 'Baseline + daily plan', free: 'Yes', paid: 'Per subject' },
  { label: 'Study rooms with friends', free: 'Yes', paid: 'Yes' },
  { label: 'Parent weekly digest', free: '—', paid: 'Yes' },
];

export function PrimeScreen() {
  const { exams, prime, actions } = useApp();

  const headline = prime ? 'Prime is on' : 'One exam is free';
  const body = prime
    ? "All eight exam slots are unlocked. Nexora splits every day across them by exam date."
    : `You're using your free exam. Prime unlocks up to eight exams at once, each with its own syllabus, baseline and daily slice.`;
  const ctaLabel = prime ? 'Add another exam' : `Start Prime · ${PRIME_PRICE}/month`;

  return (
    <Screen style={styles.content}>
      <View style={styles.headerRow}>
        <BackChevron onPress={actions.goExams} />
        <Kicker>Nexora Prime</Kicker>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.h1}>{headline}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      <Card style={styles.table}>
        <View style={styles.tableHead}>
          <Text style={{ flex: 1 }} />
          <Text style={styles.headFree}>Free</Text>
          <Text style={styles.headPaid}>Prime</Text>
        </View>
        {ROWS.map((r) => (
          <View key={r.label} style={styles.tableRow}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowFree}>{r.free}</Text>
            <Text style={styles.rowPaid}>{r.paid}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{PRIME_PRICE}</Text>
        <Text style={styles.priceSub}>per month · cancel any time</Text>
      </View>

      <View style={{ marginTop: 'auto' as const, gap: 12 }}>
        <CtaButton label={ctaLabel} onPress={actions.primeCta} />
        <Text style={styles.footer}>A parent completes the payment. Your free exam keeps working either way.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 70, paddingBottom: 40, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  h1: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 35, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.neutral700 },
  table: { padding: 0, paddingHorizontal: 18, borderRadius: 28 },
  tableHead: {
    flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: colors.neutral200,
  },
  headFree: {
    width: 62, textAlign: 'right', fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  headPaid: {
    width: 78, textAlign: 'right', fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.accent700,
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: colors.neutral200,
  },
  rowLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontWeight: '600', fontSize: 15, color: colors.text },
  rowFree: { width: 62, textAlign: 'right', fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.neutral600 },
  rowPaid: { width: 78, textAlign: 'right', fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 15, color: colors.accent2_700 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontFamily: fonts.heading, fontSize: 34, color: colors.accent700 },
  priceSub: { fontFamily: fonts.bodyBold, fontSize: 15, fontWeight: '700', color: colors.neutral700 },
  footer: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, textAlign: 'center', color: colors.neutral600 },
});
