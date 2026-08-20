import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { ChatIcon, HangUpIcon, MicIcon, VideoIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

export function CallScreen() {
  const { actions } = useApp();

  return (
    <Screen style={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Study room · 18:42</Text>
        </View>
        <Text style={styles.subjectText}>Fractions</Text>
      </View>

      <View style={styles.videoArea}>
        <View style={styles.mainAvatar}><Text style={styles.mainAvatarText}>I</Text></View>
        <Text style={styles.nameTag}>Ishita</Text>
        <View style={styles.pip}>
          <View style={styles.pipAvatar}><Text style={styles.pipAvatarText}>A</Text></View>
        </View>
      </View>

      <View style={styles.noteRow}>
        <View style={styles.noteAvatar}><Text style={styles.noteAvatarText}>N</Text></View>
        <Text style={styles.noteText}><Text style={{ fontWeight: '700' }}>Nexora is watching along.</Text> Stuck for 2 minutes? Tap me in.</Text>
      </View>

      <View style={styles.controlRow}>
        <View style={styles.controlBtn}><MicIcon size={24} /></View>
        <View style={styles.controlBtn}><VideoIcon size={24} /></View>
        <Pressable onPress={actions.goNexora} style={styles.controlBtnAccent2}><ChatIcon size={24} color="#fff" /></Pressable>
        <Pressable onPress={actions.goFchat} style={styles.controlBtn}><ChatIcon size={24} color="#645c50" /></Pressable>
        <Pressable onPress={actions.goHome} style={styles.hangupBtn}><HangUpIcon size={24} /></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 14, paddingTop: 62, paddingBottom: 34, flexGrow: 1, gap: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingBottom: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accent100, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  statusDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.accent },
  statusText: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.accent800 },
  subjectText: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.neutral700 },
  videoArea: {
    flex: 1, minHeight: 300, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.accent2_100,
    alignItems: 'center', justifyContent: 'center', position: 'relative' as const,
  },
  mainAvatar: { width: 130, height: 130, borderRadius: 999, backgroundColor: colors.accent400, alignItems: 'center', justifyContent: 'center' },
  mainAvatarText: { fontFamily: fonts.heading, fontSize: 54, color: '#fff' },
  nameTag: {
    position: 'absolute', left: 14, bottom: 14, fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700',
    color: colors.accent2_900, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 13,
  },
  pip: {
    position: 'absolute', right: 14, bottom: 14, width: 108, height: 148, borderRadius: 20,
    backgroundColor: colors.neutral200, borderWidth: 2.5, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center', ...shadow.md,
  },
  pipAvatar: { width: 58, height: 58, borderRadius: 999, backgroundColor: colors.accent2_500, alignItems: 'center', justifyContent: 'center' },
  pipAvatarText: { fontFamily: fonts.heading, fontSize: 24, color: '#fff' },
  noteRow: {
    marginVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.accent2_100, borderRadius: radius.md, padding: 14, paddingHorizontal: 16,
  },
  noteAvatar: { width: 34, height: 34, borderRadius: 999, backgroundColor: colors.accent2_500, alignItems: 'center', justifyContent: 'center' },
  noteAvatarText: { fontFamily: fonts.heading, fontSize: 15, color: '#fff' },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.accent2_900 },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  controlBtn: { width: 54, height: 54, borderRadius: 999, backgroundColor: colors.neutral200, alignItems: 'center', justifyContent: 'center' },
  controlBtnAccent2: { width: 54, height: 54, borderRadius: 999, backgroundColor: colors.accent2_500, alignItems: 'center', justifyContent: 'center' },
  hangupBtn: { width: 54, height: 54, borderRadius: 999, backgroundColor: colors.accent600, alignItems: 'center', justifyContent: 'center' },
});
