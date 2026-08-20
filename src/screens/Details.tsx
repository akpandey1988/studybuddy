import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Chip, CtaButton, Kicker, NexoraNote } from '../components/UI';
import { useApp } from '../state/AppState';
import { colors, fonts } from '../theme/tokens';

const GRADES = [4, 5, 6, 7, 8];
const BOARDS = ['CBSE', 'ICSE', 'State board', 'IB / Other'];

export function DetailsScreen() {
  const { s, detailsOk, actions } = useApp();

  const detailsNote = s.grade === null
    ? 'Your grade and board tell me which syllabus to expect.'
    : `Got it — Grade ${s.grade}${s.board ? `, ${s.board}` : ''}. I'll pitch questions at that level.`;

  return (
    <Screen style={styles.content}>
      <View style={{ gap: 6 }}>
        <Kicker>Nearly there</Kicker>
        <Text style={styles.h1}>Tell me about you</Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Your name</Text>
        <TextInput
          value={s.name}
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
              active={s.grade === g}
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
            <Chip key={b} label={b} active={s.board === b} onPress={() => actions.pickBoard(b)} />
          ))}
        </View>
      </View>

      <NexoraNote text={detailsNote} />

      <CtaButton label="Continue" active={detailsOk} onPress={actions.finishDetails} style={{ marginTop: 'auto' as const }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
