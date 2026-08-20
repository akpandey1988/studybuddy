import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SendIcon } from './Icons';
import { colors, fonts } from '../theme/tokens';

// Shared composer for the Nexora and friend threads — both used the same bar.
export function ChatInput({ placeholder, onSend }: { placeholder: string; onSend: (text: string) => void }) {
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <View style={styles.inputBar}>
      <TextInput
        style={styles.inputField}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={send}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral600}
        returnKeyType="send"
        submitBehavior="submit"
      />
      <Pressable
        onPress={send}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        style={[styles.sendBtn, { opacity: canSend ? 1 : 0.45 }]}
      >
        <SendIcon size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    padding: 12, paddingHorizontal: 20, backgroundColor: '#fff',
    borderTopWidth: 2, borderTopColor: colors.neutral200,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  inputField: {
    flex: 1, borderRadius: 999, backgroundColor: colors.neutral100,
    borderWidth: 2, borderColor: colors.neutral200,
    paddingVertical: 12, paddingHorizontal: 16,
    fontFamily: fonts.body, fontSize: 15, color: colors.text,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 999, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
