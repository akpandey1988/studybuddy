import React from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SendIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { BackendError, getThread, streamTutor } from '../services/backend';
import type { ChatTurn } from '../services/backend';
import { colors, fonts, radius, shadow } from '../theme/tokens';

/**
 * The lesson. The thread lives on the server so Nexora keeps its context
 * across devices and reloads; this screen holds only the reply being streamed.
 */
export function NexoraChatScreen() {
  const { activeExamId, plan, focusNode, reteachAsk, actions } = useApp();

  const [turns, setTurns] = React.useState<ChatTurn[]>([]);
  const [draft, setDraft] = React.useState('');
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const scroller = React.useRef<ScrollView>(null);
  const abort = React.useRef<AbortController | null>(null);
  const conceptId = plan?.conceptId ?? null;

  const send = React.useCallback(async (message?: string, hidden = false) => {
    if (!activeExamId || !conceptId) return;
    setSending(true);
    setError(null);
    setDraft('');

    const controller = new AbortController();
    abort.current = controller;
    let reply = '';

    try {
      for await (const chunk of streamTutor(activeExamId, conceptId, message, controller.signal, hidden)) {
        reply += chunk;
        setDraft(reply);
      }
      if (reply.trim()) setTurns((t) => [...t, { role: 'assistant', content: reply }]);
      else setError('Nexora went quiet. Try again.');
    } catch (e) {
      if (!controller.signal.aborted) {
        setError(e instanceof BackendError ? e.message : `Something went wrong: ${(e as Error).message}`);
      }
      // Keep whatever streamed before the failure rather than losing it.
      if (reply.trim()) setTurns((t) => [...t, { role: 'assistant', content: reply }]);
    } finally {
      setDraft('');
      setSending(false);
      abort.current = null;
    }
  }, [activeExamId, conceptId]);

  // Load what's already been said, and open the lesson if nothing has.
  const opened = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!activeExamId || !conceptId || opened.current === conceptId) return;
    opened.current = conceptId;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { turns: existing } = await getThread(activeExamId, conceptId);
        if (cancelled) return;
        setTurns(existing);
        if (existing.length === 0) await send();
      } catch (e) {
        if (!cancelled) setError(e instanceof BackendError ? e.message : (e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeExamId, conceptId, send]);

  // Arriving from a failed check: ask Nexora to teach it again, differently.
  React.useEffect(() => {
    if (!reteachAsk || !activeExamId || !conceptId || sending) return;
    const ask = reteachAsk;
    actions.consumeReteachAsk();
    (async () => {
      const { turns: existing } = await getThread(activeExamId, conceptId).catch(() => ({ turns: [] }));
      setTurns(existing);
      setLoading(false);
      opened.current = conceptId;
      await send(ask, true);
    })();
  }, [reteachAsk, activeExamId, conceptId, sending, actions, send]);

  React.useEffect(() => () => abort.current?.abort(), []);

  const onSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setTurns((t) => [...t, { role: 'user', content: text }]);
    setInput('');
    send(text);
  };

  const restart = async () => {
    await actions.resetThread();
    setTurns([]);
    opened.current = null;
    setError(null);
  };

  const readyToCheck = !sending && !loading && turns.some((t) => t.role === 'assistant');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={actions.goHome} hitSlop={10}><Text style={styles.back}>‹</Text></Pressable>
        <View style={styles.avatar}><Text style={styles.avatarText}>N</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Nexora</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {plan ? `${plan.conceptName}${focusNode ? ` · ${focusNode.chapter}` : ''}` : 'Getting ready…'}
          </Text>
        </View>
        {turns.length > 0 && (
          <Pressable onPress={restart} hitSlop={8} style={styles.timer}>
            <Text style={styles.timerText}>Restart</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scroller}
          contentContainerStyle={styles.thread}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
          keyboardDismissMode="on-drag"
        >
          {/* Why this concept, carried over from the plan. */}
          {plan?.reason && turns.length > 0 && (
            <View style={styles.whyCard}><Text style={styles.whyText}>{plan.reason}</Text></View>
          )}

          {turns.map((t, i) => (
            <Bubble key={i} mine={t.role === 'user'}>{t.content}</Bubble>
          ))}

          {draft.length > 0 && <Bubble>{draft}</Bubble>}

          {(sending || loading) && draft.length === 0 && (
            <View style={[styles.bubble, styles.bubbleTheirs, styles.thinking]}>
              <ActivityIndicator size="small" color={colors.neutral600} />
              <Text style={styles.thinkingText}>Nexora is thinking…</Text>
            </View>
          )}

          {error && (
            <Pressable onPress={() => { setError(null); send(); }} style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.errorRetry}>Tap to try again</Text>
            </Pressable>
          )}
        </ScrollView>

        {readyToCheck && (
          <Pressable onPress={actions.startCheck} style={styles.checkBar}>
            <Text style={styles.checkBarLabel}>
              {focusNode && focusNode.attempts > 0 ? 'Try the check again' : "I've got it — check me"}
            </Text>
            <Text style={styles.checkBarMeta}>
              {focusNode && focusNode.attempts > 0
                ? `Attempt ${focusNode.attempts + 1} · fresh questions`
                : `Questions on ${plan?.conceptName ?? 'this'}`}
            </Text>
          </Pressable>
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your answer…"
            placeholderTextColor={colors.neutral600}
            style={styles.inputField}
            multiline
            onSubmitEditing={onSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <Pressable
            onPress={onSend}
            disabled={!input.trim() || sending}
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnOff]}
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
  error: {
    alignSelf: 'flex-start', maxWidth: '86%', backgroundColor: '#fff', borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.accent300, padding: 14, gap: 4,
  },
  errorText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.text },
  errorRetry: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, color: colors.accent700 },
  whyCard: { backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 14 },
  whyText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.accent2_800 },
  checkBar: {
    marginHorizontal: 20, marginBottom: 4, backgroundColor: colors.accent2_500,
    borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', gap: 2,
  },
  checkBarLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 15, color: '#fff' },
  checkBarMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.accent2_100 },
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
