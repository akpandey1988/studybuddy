import React, { useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatInput } from '../components/ChatInput';
import { VideoIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

export function FriendChatScreen() {
  const { s, actions } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={actions.goFriends} hitSlop={10}><Text style={styles.back}>‹</Text></Pressable>
          <View style={styles.avatar}><Text style={styles.avatarText}>I</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ishita</Text>
            <Text style={styles.subtitle}>Studying Fractions</Text>
          </View>
          <Pressable onPress={actions.goCall} style={styles.callBtn}><VideoIcon size={20} color="#8c491a" /></Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.dayChip}>Today</Text>
          <Bubble>did you get q7 in the ratio drill</Bubble>
          <Bubble mine>nope. nexora made me redo it twice</Bubble>

          <View style={styles.sharedCard}>
            <Text style={styles.sharedKicker}>Shared question</Text>
            <Text style={styles.sharedQ}>If 4 pens cost ₹36, what do 7 pens cost?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={actions.goCall} style={styles.solveBtn}><Text style={styles.solveBtnText}>Solve together</Text></Pressable>
              <Pressable onPress={actions.goNexora} style={styles.askBtn}><Text style={styles.askBtnText}>Ask Nexora</Text></Pressable>
            </View>
          </View>

          <Bubble mine>study room in 5? i'll bring my notes</Bubble>
          <Bubble>yes ok</Bubble>

          {s.friendMsgs.map((m) => <Bubble key={m.id} mine={m.mine}>{m.text}</Bubble>)}
        </ScrollView>

        <ChatInput placeholder="Message" onSend={actions.sendFriend} />
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
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderBottomWidth: 2, borderBottomColor: colors.neutral200,
  },
  back: { fontSize: 30, lineHeight: 30, color: colors.neutral700 },
  avatar: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.accent400, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heading, fontSize: 17, color: '#fff' },
  title: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 17, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.accent2_700 },
  callBtn: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' },
  thread: { padding: 20, gap: 12 },
  dayChip: {
    alignSelf: 'center', fontFamily: fonts.bodyBold, fontSize: 12, fontWeight: '700', color: colors.neutral600,
    backgroundColor: colors.neutral200, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12,
  },
  bubble: { maxWidth: '78%', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 15 },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 6, ...shadow.sm },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 6 },
  bubbleText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  sharedCard: { alignSelf: 'flex-start', width: '84%', backgroundColor: '#fff', borderRadius: radius.md, padding: 14, gap: 10, ...shadow.sm },
  sharedKicker: {
    fontFamily: fonts.bodyExtraBold, fontSize: 11, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  sharedQ: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.text },
  solveBtn: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.accent2_100 },
  solveBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.accent2_800 },
  askBtn: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.neutral200 },
  askBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.neutral700 },
});
