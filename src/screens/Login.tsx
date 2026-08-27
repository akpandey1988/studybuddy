import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { CtaButton, Spacer } from '../components/UI';
import { useApp } from '../state/AppState';
import { colors, fonts } from '../theme/tokens';

export function LoginScreen() {
  const { phone, phoneOk, busy, actions } = useApp();

  return (
    <Screen style={styles.content}>
      <View style={styles.avatar}><Text style={styles.avatarText}>N</Text></View>

      <View style={{ gap: 10 }}>
        <Text style={styles.h1}>Hello, I'm Nexora</Text>
        <Text style={styles.body}>Your study buddy for the next exam. Sign in with your phone number — that's all we need.</Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={styles.label}>Phone number</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.phonePrefix}>+91</Text>
          <View style={styles.divider} />
          <TextInput
            value={phone}
            onChangeText={actions.setPhone}
            placeholder="98765 43210"
            placeholderTextColor={colors.neutral500}
            keyboardType="number-pad"
            style={styles.phoneInput}
          />
        </View>
        <Text style={styles.helper}>We'll text a 4-digit code. A parent's number works too.</Text>
      </View>

      <Spacer />

      <View style={{ gap: 14 }}>
        <CtaButton label={busy === 'auth' ? 'Getting ready…' : 'Send me a code'} active={phoneOk && busy !== 'auth'} onPress={actions.sendCode} />
        <Text style={styles.footer}>By continuing you agree to study for 25 minutes a day. Mostly.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 92, paddingBottom: 40, gap: 24 },
  avatar: {
    width: 84, height: 84, borderRadius: 999, backgroundColor: colors.accent2_500,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.heading, fontSize: 38, color: '#fff' },
  h1: { fontFamily: fonts.heading, fontSize: 34, lineHeight: 36, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.neutral700 },
  label: {
    fontFamily: fonts.bodyExtraBold, fontSize: 13, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.neutral200,
    borderRadius: 999, paddingVertical: 4, paddingLeft: 18, paddingRight: 6,
  },
  phonePrefix: { fontFamily: fonts.bodyBold, fontSize: 17, fontWeight: '700', color: colors.neutral700 },
  divider: { width: 2, height: 24, backgroundColor: colors.neutral200 },
  phoneInput: {
    flex: 1, minWidth: 0, fontFamily: fonts.bodySemiBold, fontSize: 18, fontWeight: '600',
    letterSpacing: 0.5, paddingVertical: 14, paddingHorizontal: 8, color: colors.text,
  },
  helper: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  footer: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, textAlign: 'center', color: colors.neutral600 },
});
