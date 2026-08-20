import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { ChatIcon, PlusIcon, VideoIcon } from '../components/Icons';
import { useApp } from '../state/AppState';
import { colors, fonts, radius, shadow } from '../theme/tokens';

const ALL_FRIENDS = [
  { i: 'K', name: 'Kabir', meta: 'Last studied 2h ago' },
  { i: 'S', name: 'Sara', meta: 'Same exam · 19 Sep' },
];

export function FriendsScreen() {
  const { s, actions } = useApp();

  const query = s.friendQuery.trim().toLowerCase();
  const match = (name: string) => name.toLowerCase().indexOf(query) >= 0;
  const showIshita = match('Ishita');
  const showRehan = match('Rehan');
  const allFriends = ALL_FRIENDS.filter((f) => match(f.name));
  const showStudyingNow = showIshita || showRehan || !query;
  const nothingFound = !showStudyingNow && allFriends.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.h2}>Friends</Text>
          <View style={styles.inviteBtn}><Text style={styles.inviteBtnText}>+ Invite</Text></View>
        </View>

        <TextInput
          style={styles.searchBar}
          value={s.friendQuery}
          onChangeText={actions.setFriendQuery}
          placeholder="Search friends"
          placeholderTextColor={colors.neutral600}
          returnKeyType="search"
          autoCorrect={false}
        />

        <View style={styles.bannerRow}>
          <View style={styles.stack}>
            <View style={[styles.stackAvatar, { backgroundColor: colors.accent400 }]}><Text style={styles.stackAvatarText}>I</Text></View>
            <View style={[styles.stackAvatar, { backgroundColor: colors.accent2_500, marginLeft: -12 }]}><Text style={styles.stackAvatarText}>R</Text></View>
            <View style={[styles.stackAvatar, { backgroundColor: colors.neutral400, marginLeft: -12 }]}><Text style={styles.stackAvatarText}>K</Text></View>
          </View>
          <Text style={styles.bannerText}>3 friends are on <Text style={{ fontWeight: '700' }}>Fractions</Text> today too.</Text>
        </View>

        {showStudyingNow && <Text style={styles.sectionLabel}>Studying now</Text>}
        <View style={{ gap: 10 }}>
          {showIshita && (
          <View style={styles.friendRow}>
            <View style={[styles.avatar44, { backgroundColor: colors.accent400 }]}><Text style={styles.avatar44Text}>I</Text></View>
            <Pressable onPress={actions.goFchat} style={{ flex: 1 }}>
              <Text style={styles.friendName}>Ishita</Text>
              <View style={styles.statusRow}>
                <View style={styles.dot} />
                <Text style={styles.statusText}>In a study room · Fractions</Text>
              </View>
            </Pressable>
            <Pressable onPress={actions.goFchat} style={styles.iconBtnLight}><ChatIcon size={20} color="#8c491a" /></Pressable>
            <Pressable onPress={actions.goCall} style={styles.iconBtnDark}><VideoIcon size={20} color="#fff" /></Pressable>
          </View>
          )}
          {showRehan && (
          <View style={styles.friendRow}>
            <View style={[styles.avatar44, { backgroundColor: colors.accent2_500 }]}><Text style={styles.avatar44Text}>R</Text></View>
            <Pressable onPress={actions.goFchat} style={{ flex: 1 }}>
              <Text style={styles.friendName}>Rehan</Text>
              <View style={styles.statusRow}>
                <View style={styles.dot} />
                <Text style={styles.statusText}>Day 6 streak · Decimals</Text>
              </View>
            </Pressable>
            <Pressable onPress={actions.goFchat} style={styles.iconBtnLight}><ChatIcon size={20} color="#8c491a" /></Pressable>
          </View>
          )}
          {!query && (
          <Pressable onPress={actions.goGroup} style={styles.joinRow}>
            <View style={styles.joinIcon}><PlusIcon size={20} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.joinTitle}>Join Fraction Face-Off</Text>
              <Text style={styles.joinSub}>3 in the room now</Text>
            </View>
          </Pressable>
          )}
        </View>

        {nothingFound && <Text style={styles.emptyText}>No friends match "{s.friendQuery.trim()}".</Text>}

        {allFriends.length > 0 && <Text style={styles.sectionLabel}>All friends</Text>}
        <View style={{ gap: 10 }}>
          {allFriends.map((f) => (
            <Pressable key={f.name} onPress={actions.goFchat} style={styles.plainRow}>
              <View style={[styles.avatar40, { backgroundColor: colors.neutral400 }]}><Text style={styles.avatar40Text}>{f.i}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.plainName}>{f.name}</Text>
                <Text style={styles.plainMeta}>{f.meta}</Text>
              </View>
              <Text style={styles.nudge}>Nudge</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <TabBar active="friends" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral100 },
  content: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 18, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h2: { fontFamily: fonts.heading, fontSize: 28, color: colors.text },
  inviteBtn: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16, backgroundColor: colors.accent100 },
  inviteBtnText: { fontFamily: fonts.bodyExtraBold, fontSize: 14, fontWeight: '800', color: colors.accent800 },
  searchBar: {
    borderRadius: 999, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.neutral200,
    padding: 12, paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 15, color: colors.text,
  },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.neutral600, paddingVertical: 6 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.accent2_100, borderRadius: radius.lg, padding: 16, paddingHorizontal: 18 },
  stack: { flexDirection: 'row' },
  stackAvatar: { width: 36, height: 36, borderRadius: 999, borderWidth: 2.5, borderColor: colors.accent2_100, alignItems: 'center', justifyContent: 'center' },
  stackAvatarText: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 14, color: '#fff' },
  bannerText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 19, color: colors.accent2_900 },
  sectionLabel: {
    fontFamily: fonts.bodyExtraBold, fontSize: 12, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600,
  },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff', borderRadius: radius.md, padding: 13, paddingHorizontal: 15, ...shadow.sm },
  avatar44: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatar44Text: { fontFamily: fonts.heading, fontSize: 18, color: '#fff' },
  friendName: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 16, color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.accent2_500 },
  statusText: { fontFamily: fonts.body, fontSize: 13, color: colors.accent2_700 },
  iconBtnLight: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.accent100, alignItems: 'center', justifyContent: 'center' },
  iconBtnDark: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  joinRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.accent100, borderRadius: radius.md, padding: 14, paddingHorizontal: 16 },
  joinIcon: { width: 40, height: 40, borderRadius: 999, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  joinTitle: { fontFamily: fonts.bodyExtraBold, fontWeight: '800', fontSize: 15, color: colors.accent900 },
  joinSub: { fontFamily: fonts.body, fontSize: 13, color: colors.accent800 },
  plainRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 4 },
  avatar40: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatar40Text: { fontFamily: fonts.heading, fontSize: 16, color: '#fff' },
  plainName: { fontFamily: fonts.bodyBold, fontWeight: '700', fontSize: 15, color: colors.text },
  plainMeta: { fontFamily: fonts.body, fontSize: 13, color: colors.neutral600 },
  nudge: { fontFamily: fonts.bodyBold, fontSize: 13, fontWeight: '700', color: colors.neutral600 },
});
