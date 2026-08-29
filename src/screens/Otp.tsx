import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { BackChevron, CtaButton } from '../components/UI';
import { OTP_LENGTH, useApp } from '../state/AppState';
import { colors, fonts, radius } from '../theme/tokens';

export function OtpScreen() {
  const { otp, digits, phoneOk, otpDigits, otpOk, busy, error, actions } = useApp();
  const working = busy === 'auth';
  const phoneDisplay = phoneOk ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : 'your number';

  return (
    <Screen style={styles.content}>
      <BackChevron onPress={actions.goLogin} />

      <View style={{ gap: 10 }}>
        <Text style={styles.h1}>Enter your code</Text>
        <Text style={styles.body}>Sent to <Text style={{ fontWeight: '700' }}>{phoneDisplay}</Text>.</Text>
      </View>

      <View style={{ gap: 12 }}>
        <View style={styles.boxRow}>
          {Array.from({ length: OTP_LENGTH }, (_, i) => i).map((i) => (
            <View key={i} style={[styles.box, otpDigits[i] ? styles.boxFilled : styles.boxEmpty]}>
              <Text style={styles.boxChar}>{otpDigits[i] || ''}</Text>
            </View>
          ))}
        </View>
        <TextInput
          value={otp}
          onChangeText={actions.setOtp}
          placeholder={`Type the ${OTP_LENGTH} digits`}
          placeholderTextColor={colors.neutral500}
          keyboardType="number-pad"
          style={styles.input}
        />
        {error
          ? <Text style={styles.errorText}>{error}</Text>
          : <Text style={styles.helper}>Didn't get it? <Text style={styles.resend} onPress={actions.goLogin}>Send it again</Text></Text>}
      </View>

      <CtaButton
        label={working ? 'Checking…' : 'Verify'}
        active={otpOk && !working}
        onPress={actions.verifyOtp}
        style={{ marginTop: 'auto' as const }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 92, paddingBottom: 40, gap: 24 },
  h1: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 33, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.neutral700 },
  boxRow: { flexDirection: 'row', gap: 10 },
  box: {
    flex: 1, height: 64, borderRadius: radius.md, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  boxEmpty: { borderColor: colors.neutral200 },
  boxFilled: { borderColor: colors.accent },
  boxChar: { fontFamily: fonts.heading, fontSize: 26, color: colors.text },
  input: {
    borderWidth: 2, borderColor: colors.neutral200, backgroundColor: '#fff', borderRadius: 999,
    paddingVertical: 14, paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 16, color: colors.text,
  },
  helper: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  resend: { fontWeight: '700', color: colors.accent700 },
  errorText: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 13, lineHeight: 19, color: colors.accent700 },
});
