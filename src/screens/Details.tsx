import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Chip, CtaButton, Kicker, NexoraNote } from '../components/UI';
import { useApp } from '../state/AppState';
import { colors, fonts } from '../theme/tokens';

const GRADES = [4, 5, 6, 7, 8];
const BOARDS = ['CBSE', 'ICSE', 'State board', 'IB / Other'];

export function DetailsScreen() {
  const { name, grade, board, detailsOk, busy, error, guestProgressLost, actions } = useApp();

  const detailsNote = grade === null
    ? 'Your grade and board tell me which syllabus to expect.'
    : `Got it — Grade ${grade}${board ? `, ${board}` : ''}. I'll pitch questions at that level.`;

  return (
    <Screen style={styles.content}>
      <View style={{ gap: 6 }}>
        <Kicker>Nearly there</Kicker>
        <Text style={styles.h1}>Tell me about you</Text>
      </View>

      {/* Signing in found an existing account, so anything done as a guest on
          this phone belongs to a different uid and cannot come across. */}
      {guestProgressLost && (
        <Pressable onPress={actions.dismissGuestWarning} style={styles.notice}>
          <Text style={styles.noticeText}>
            You already had an account, so we've signed you into that one. Anything you
            did before signing in on this phone stays with the guest session.
          </Text>
          <Text style={styles.noticeDismiss}>Got it</Text>
        </Pressable>
      )}

      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={actions.setName}
          placeholder="Aarav"
          placeholderTextColor={colors.neutral500}
          style={styles.input}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Grade</Text>
        <View style={styles.gradeRow}>
          {GRADES.map((g) => (
            <Chip
              key={g}
              label={String(g)}
              active={grade === g}
              onPress={() => actions.pickGrade(g)}
              style={styles.gradeChip}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Board</Text>
        <View style={styles.boardRow}>
          {BOARDS.map((b) => (
            <Chip key={b} label={b} active={board === b} onPress={() => actions.pickBoard(b)} />
          ))}
        </View>
      </View>

      <NexoraNote text={detailsNote} />

      <CtaButton label="Continue" active={detailsOk} onPress={actions.finishDetails} style={{ marginTop: 'auto' as const }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.accent100, borderRadius: 16, borderWidth: 2,
    borderColor: colors.accent300, padding: 14, gap: 6,
  },
  noticeText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.accent900 },
  noticeDismiss: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 14, color: colors.accent700 },
  content: { paddingTop: 70, paddingBottom: 40, gap: 20 },
  h1: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 33, color: colors.text },
  label: {
    fontFamily: fonts.bodyExtraBold, fontSize: 13, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  input: {
    borderWidth: 2, borderColor: colors.neutral200, backgroundColor: '#fff', borderRadius: 999,
    paddingVertical: 15, paddingHorizontal: 20, fontFamily: fonts.bodySemiBold, fontSize: 17,
    fontWeight: '600', color: colors.text,
  },
  gradeRow: { flexDirection: 'row', gap: 8 },
  gradeChip: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  boardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
