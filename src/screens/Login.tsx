import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { CtaButton, Spacer } from '../components/UI';
import { GoogleMark } from '../components/Icons';
import { HeroBlobs, Nexora } from '../components/Art';
import { PressableScale } from '../components/Motion';
import { useApp } from '../state/AppState';
import { colors, fonts } from '../theme/tokens';

export function LoginScreen() {
  const { phone, phoneOk, busy, error, actions } = useApp();
  const working = busy === 'auth';

  return (
    <Screen style={styles.content}>
      <HeroBlobs height={300} />

      <View style={styles.intro}>
        <Nexora size={132} mood="happy" />
        <Text style={styles.h1}>Hello, I'm Nexora</Text>
        <Text style={styles.body}>Your study buddy for the next exam.</Text>
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
        <Text style={styles.helper}>We'll text you a code.</Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <Spacer />

      <View style={{ gap: 14 }}>
        <CtaButton
          label={working ? 'Sending…' : 'Send me a code'}
          active={phoneOk && !working}
          onPress={actions.sendCode}
        />

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        <PressableScale onPress={actions.signInGoogle} disabled={working} style={styles.google}>
          <GoogleMark size={20} />
          <Text style={styles.googleLabel}>Continue with Google</Text>
        </PressableScale>

        {/* The app hands out an anonymous uid on first run, so this has to be
            reachable — otherwise "guest" is a promise the UI never keeps. */}
        <Pressable onPress={actions.continueAsGuest} disabled={working}>
          <Text style={styles.guest}>Have a look around first</Text>
        </Pressable>

        <Text style={styles.footer}>By continuing you agree to study for 25 minutes a day. Mostly.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 56, paddingBottom: 40, gap: 24 },
  intro: { alignItems: 'center', gap: 12 },
  h1: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 36, color: colors.text, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.neutral700, textAlign: 'center' },
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
  error: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, color: colors.accent700, lineHeight: 19 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 2, backgroundColor: colors.neutral200 },
  orText: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  google: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#fff', borderWidth: 2, borderColor: colors.neutral300,
    borderRadius: 999, paddingVertical: 15,
  },
  googleLabel: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 16, color: colors.neutral800 },
  guest: {
    fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15,
    color: colors.neutral700, textAlign: 'center', paddingVertical: 6,
  },
  footer: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, textAlign: 'center', color: colors.neutral600 },
});
