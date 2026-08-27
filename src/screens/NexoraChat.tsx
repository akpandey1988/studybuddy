import React from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SendIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { KICKOFF, NexoraError, isConfigured, streamReply, studentContext } from '../services/nexora';
import type { ChatTurn } from '../state/types';
import { colors, fonts, radius, shadow } from '../theme/tokens';

export function NexoraChatScreen() {
  const { s, active, st, chat, actions } = useApp();

  const [draft, setDraft] = React.useState('');       // streaming reply, not yet committed
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scroller = React.useRef<ScrollView>(null);
  const abort = React.useRef<AbortController | null>(null);
  const examId = active ? active.id : null;

  const send = React.useCallback(async (turns: ChatTurn[]) => {
    if (examId === null || !active || !st) return;

    setSending(true);
    setError(null);
    setDraft('');

    const controller = new AbortController();
    abort.current = controller;
    let reply = '';

    try {
      const student = studentContext(s.name, s.grade, s.board, active.subject, st);
      for await (const chunk of streamReply(student, turns, controller.signal)) {
        reply += chunk;
        setDraft(reply);
      }
      if (reply.trim()) actions.appendTurn(examId, { role: 'assistant', content: reply });
      else setError('Nexora went quiet. Try again.');
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof NexoraError ? e.message : `Something went wrong: ${(e as Error).message}`);
      }
      // Keep whatever streamed before the failure so the student doesn't lose it.
      if (reply.trim()) actions.appendTurn(examId, { role: 'assistant', content: reply });
    } finally {
      setDraft('');
      setSending(false);
      abort.current = null;
    }
  }, [examId, active, st, s.name, s.grade, s.board, actions]);

  // Open the lesson: a hidden kickoff turn so Claude speaks first.
  const started = React.useRef(false);
  React.useEffect(() => {
    if (started.current || examId === null || chat.length > 0 || !isConfigured()) return;
    started.current = true;
    const kickoff: ChatTurn = { role: 'user', content: KICKOFF, hidden: true };
    actions.appendTurn(examId, kickoff);
    send([kickoff]);
  }, [examId, chat.length, actions, send]);

  React.useEffect(() => () => abort.current?.abort(), []);

  const onSend = () => {
    const text = input.trim();
    if (!text || sending || examId === null) return;
    const turn: ChatTurn = { role: 'user', content: text };
    actions.appendTurn(examId, turn);
    setInput('');
    send(chat.concat([turn]));
  };

  const retry = () => {
    setError(null);
    if (chat.length > 0) send(chat);
  };

  const visible = chat.filter((t) => !t.hidden);
  const configured = isConfigured();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={actions.goHome} hitSlop={10}><Text style={styles.back}>‹</Text></Pressable>
        <View style={styles.avatar}><Text style={styles.avatarText}>N</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Nexora</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {st ? `${st.focus} · ${active?.subject ?? ''}` : 'Getting ready…'}
          </Text>
        </View>
        {visible.length > 0 && (
          <Pressable onPress={() => { started.current = false; if (examId !== null) actions.resetChat(examId); }} hitSlop={8} style={styles.timer}>
            <Text style={styles.timerText}>Restart</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scroller}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
          keyboardDismissMode="on-drag"
        >
          {!configured && (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Nexora isn't connected yet</Text>
              <Text style={styles.noticeBody}>
                Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then deploy
                the nexora edge function. See README.md.
              </Text>
            </View>
          )}

          {visible.map((t, i) => (
            <Bubble key={i} mine={t.role === 'user'}>{t.content}</Bubble>
          ))}

          {draft.length > 0 && <Bubble>{draft}</Bubble>}

          {sending && draft.length === 0 && (
            <View style={[styles.bubble, styles.bubbleTheirs, styles.thinking]}>
              <ActivityIndicator size="small" color={colors.neutral600} />
              <Text style={styles.thinkingText}>Nexora is thinking…</Text>
            </View>
          )}

          {error && (
            <Pressable onPress={retry} style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorRetry}>Tap to try again</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your answer…"
            placeholderTextColor={colors.neutral600}
            style={styles.inputField}
            multiline
            editable={configured}
            onSubmitEditing={onSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <Pressable
            onPress={onSend}
            disabled={!input.trim() || sending || !configured}
            style={[styles.sendBtn, (!input.trim() || sending || !configured) && styles.sendBtnOff]}
          >
            <SendIcon size={22} />
          </Pressable>
        </View>
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
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thinkingText: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral600 },
  notice: {
    backgroundColor: colors.accent100, borderRadius: radius.md, borderWidth: 2,
    borderColor: colors.accent300, padding: 16, gap: 6,
  },
  noticeTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.accent800 },
  noticeBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.accent800 },
  error: {
    alignSelf: 'flex-start', maxWidth: '86%', backgroundColor: '#fff', borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.accent300, padding: 14, gap: 4,
  },
  errorText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
  errorRetry: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, color: colors.accent700 },
  inputBar: {
    padding: 12, paddingHorizontal: 20, backgroundColor: '#fff', borderTopWidth: 2, borderTopColor: colors.neutral200,
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
  },
  inputField: {
    flex: 1, maxHeight: 120, borderRadius: 22, backgroundColor: colors.neutral100,
    borderWidth: 2, borderColor: colors.neutral200,
    paddingVertical: 12, paddingHorizontal: 16,
    fontFamily: fonts.body, fontSize: 15, color: colors.text,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 999, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: colors.neutral300 },
});
