import React, { useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatInput } from '../components/ChatInput';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

const QUICK_REPLIES = ['4/7', '5/9', 'Show me again'];

export function NexoraChatScreen() {
  const { s, actions } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={actions.goHome} hitSlop={10}><Text style={styles.back}>‹</Text></Pressable>
          <View style={styles.avatar}><Text style={styles.avatarText}>N</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Nexora</Text>
            <Text style={styles.subtitle}>Fractions · day 4 lesson</Text>
          </View>
          <View style={styles.timer}><Text style={styles.timerText}>12:00 left</Text></View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          <Bubble>Right — 3/5 vs 5/8. Before any maths: which one <Text style={{ fontStyle: 'italic' }}>feels</Text> bigger to you?</Bubble>
          <Bubble mine>5/8, because 8 is bigger</Bubble>
          <Bubble>Good honest answer, and it's the trap most people fall into. A bigger bottom number means <Text style={{ fontWeight: '700' }}>smaller slices</Text>. Look:</Bubble>

          <View style={styles.fractionCard}>
            <View style={{ gap: 5 }}>
              <Text style={styles.fractionLabel}>3/5 = 24/40</Text>
              <View style={styles.fractionBarRow}>
                <View style={[styles.fractionSeg, { flex: 3, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, backgroundColor: colors.accent400 }]} />
                <View style={[styles.fractionSeg, { flex: 2, borderTopRightRadius: 6, borderBottomRightRadius: 6, backgroundColor: colors.neutral200 }]} />
              </View>
            </View>
            <View style={{ gap: 5 }}>
              <Text style={styles.fractionLabel}>5/8 = 25/40</Text>
              <View style={styles.fractionBarRow}>
                <View style={[styles.fractionSeg, { flex: 5, borderTopLeftRadius: 6, borderBottomLeftRadius: 6, backgroundColor: colors.accent2_500 }]} />
                <View style={[styles.fractionSeg, { flex: 3, borderTopRightRadius: 6, borderBottomRightRadius: 6, backgroundColor: colors.neutral200 }]} />
              </View>
            </View>
            <Text style={styles.fractionFooter}>One slice out of forty apart.</Text>
          </View>

          <Bubble>Your turn: 4/7 or 5/9?</Bubble>

          {s.nexoraMsgs.length === 0 && (
          <View style={styles.chipRow}>
            {QUICK_REPLIES.map((label, i) => {
              const muted = i === QUICK_REPLIES.length - 1;
              return (
                <Pressable
                  key={label}
                  onPress={() => actions.sendNexora(label)}
                  style={muted ? styles.replyChipMuted : styles.replyChip}
                >
                  <Text style={muted ? styles.replyChipMutedText : styles.replyChipText}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          )}

          {s.nexoraMsgs.map((m) => <Bubble key={m.id} mine={m.mine}>{m.text}</Bubble>)}
        </ScrollView>

        <ChatInput placeholder="Type or say your answer…" onSend={actions.sendNexora} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ children, mine = false }: { children: React.ReactNode; mine?: boolean }) {
  return (
    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <Text style={[styles.bubbleText, { color: mine ? '#fff' : colors.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral100 },
  header: {
    paddingTop: 14, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.accent2_100,
  },
  back: { fontSize: 30, lineHeight: 30, color: colors.accent2_800, marginRight: -4 },
  avatar: {
    width: 44, height: 44, borderRadius: 999, backgroundColor: colors.accent2_500,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.heading, fontSize: 20, color: '#fff' },
  title: { fontFamily: fonts.heading, fontSize: 19, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.accent2_800 },
  timer: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fff' },
  timerText: { fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800', color: colors.accent2_800 },
  thread: { padding: 20, gap: 14 },
  bubble: { maxWidth: '86%', borderRadius: 20, paddingVertical: 13, paddingHorizontal: 16 },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 6, ...shadow.sm },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 6 },
  bubbleText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  fractionCard: {
    alignSelf: 'flex-start', width: '88%', backgroundColor: '#fff', borderRadius: radius.md,
    padding: 16, gap: 12, ...shadow.sm,
  },
  fractionLabel: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.neutral700 },
  fractionBarRow: { flexDirection: 'row', gap: 2 },
  fractionSeg: { height: 22 },
  fractionFooter: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral800 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 'auto' as const },
  replyChip: {
    borderWidth: 2, borderColor: colors.accent300, borderRadius: 999,
    paddingVertical: 9, paddingHorizontal: 15, backgroundColor: colors.accent100,
  },
  replyChipText: { fontFamily: fonts.bodyBold, fontSize: 14, fontWeight: '700', color: colors.accent800 },
  replyChipMuted: {
    borderWidth: 2, borderColor: colors.neutral300, borderRadius: 999,
    paddingVertical: 9, paddingHorizontal: 15,
  },
  replyChipMutedText: { fontFamily: fonts.bodyBold, fontSize: 14, fontWeight: '700', color: colors.neutral700 },
});
