import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FixedScreen } from '../components/Screen';
import { BackChevron, CtaButton, SecondaryButton } from '../components/UI';
import { CameraIcon, UploadIcon } from '../components/Icons';
import { Nexora } from '../components/Art';
import { PressableScale, Rise } from '../components/Motion';
import { SyllabusInputError, captureSyllabusPhoto, pickSyllabusImage } from '../services/syllabusInput';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

/**
 * Photograph a page, a question or your own working, and Nexora works out
 * which concept in your syllabus it belongs to before teaching it — so the
 * lesson knows what it builds on and what it unlocks.
 */
export function ScanScreen() {
  const { scan, busy, error, actions } = useApp();
  const working = busy === 'scan';

  const capture = async (take: boolean) => {
    try {
      const shot = take ? await captureSyllabusPhoto() : await pickSyllabusImage();
      if (shot) actions.identifyScan(shot);
    } catch (e) {
      actions.setScanError(e instanceof SyllabusInputError ? e.message : (e as Error).message);
    }
  };

  return (
    <FixedScreen>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <BackChevron onPress={actions.goHome} />
          <Text style={styles.h2}>Scan & learn</Text>
        </View>

        <ScrollView contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
          {!scan.image && !scan.match && (
            <>
              <View style={styles.introWrap}>
                <Nexora size={116} mood="thinking" />
                <Text style={styles.intro}>Photograph it and I'll teach it.</Text>
              </View>
              <Rise delay={60}>
                <PressableScale onPress={() => capture(true)} disabled={working} style={styles.source}>
                  <View style={styles.sourceIcon}><CameraIcon size={22} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceTitle}>Take a photo</Text>
                    <Text style={styles.sourceHint}>A question, a page, or your working</Text>
                  </View>
                </PressableScale>
              </Rise>
              <Rise delay={130}>
                <PressableScale onPress={() => capture(false)} disabled={working} style={styles.source}>
                  <View style={styles.sourceIcon}><UploadIcon size={22} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sourceTitle}>Choose a photo</Text>
                    <Text style={styles.sourceHint}>From your gallery</Text>
                  </View>
                </PressableScale>
              </Rise>
            </>
          )}

          {scan.image && (
            <Image
              source={{ uri: `data:${scan.image.mediaType};base64,${scan.image.data}` }}
              style={styles.preview}
              resizeMode="cover"
            />
          )}

          {working && (
            <View style={styles.thinking}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.thinkingText}>Working out what this is…</Text>
            </View>
          )}

          {error && !working && (
            <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View>
          )}

          {scan.match && !working && (
            <View style={[styles.match, scan.match.offSyllabus ? styles.matchOff : styles.matchOn]}>
              <Text style={styles.matchWhat}>{scan.match.whatItShows}</Text>
              {scan.match.conceptId ? (
                <>
                  <Text style={styles.matchLabel}>In your syllabus this is</Text>
                  <Text style={styles.matchName}>{scan.match.conceptName}</Text>
                  {scan.match.confidence !== 'high' && (
                    <Text style={styles.matchHedge}>
                      I'm not certain — if that's not right, go back and try a clearer photo.
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.matchHedge}>
                  This doesn't look like part of your syllabus. Nexora can still talk it
                  through, but it won't count towards your plan.
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        {scan.match && !working && (
          <View style={{ gap: 10, paddingTop: 12 }}>
            <CtaButton
              label={scan.match.conceptId ? `Learn ${scan.match.conceptName}` : 'Ask Nexora about it'}
              active={Boolean(scan.match.conceptId)}
              onPress={actions.learnFromScan}
            />
            <SecondaryButton label="Scan something else" onPress={actions.resetScan} />
          </View>
        )}
      </View>
    </FixedScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 66, paddingBottom: 40, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  h2: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 31, color: colors.text },
  introWrap: { alignItems: 'center', gap: 10, paddingBottom: 4 },
  intro: {
    fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 16,
    lineHeight: 22, color: colors.neutral700, textAlign: 'center',
  },
  source: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: radius.md, borderWidth: 2, borderColor: colors.neutral200,
    padding: 14, paddingHorizontal: 16, ...shadow.sm,
  },
  sourceIcon: {
    width: 44, height: 44, borderRadius: 999, backgroundColor: colors.accent100,
    alignItems: 'center', justifyContent: 'center',
  },
  sourceTitle: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 16, color: colors.text },
  sourceHint: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  preview: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.neutral200 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 },
  thinkingText: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.neutral700 },
  errorCard: {
    backgroundColor: colors.accent100, borderRadius: radius.md, borderWidth: 2,
    borderColor: colors.accent300, padding: 14,
  },
  errorText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.accent900 },
  match: { borderRadius: radius.md, padding: 16, gap: 6 },
  matchOn: { backgroundColor: colors.accent2_100 },
  matchOff: { backgroundColor: colors.accent100 },
  matchWhat: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  matchLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 11, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600, marginTop: 4,
  },
  matchName: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 25, color: colors.text },
  matchHedge: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.neutral700 },
});
