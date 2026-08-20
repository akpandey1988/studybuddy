import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../state/AppState';
import { colors, fonts } from '../theme/tokens';
import { BarChartIcon, ChatIcon, FriendsIcon, HomeIcon } from './Icons';
import type { Route } from '../state/types';

const TABS: { key: Route; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { key: 'home', label: 'Today', Icon: HomeIcon },
  { key: 'nexora', label: 'Nexora', Icon: ChatIcon },
  { key: 'progress', label: 'Progress', Icon: BarChartIcon },
  { key: 'friends', label: 'Friends', Icon: FriendsIcon },
];

export function TabBar({ active }: { active: Route }) {
  const { actions } = useApp();
  const insets = useSafeAreaInsets();
  const go = { home: actions.goHome, nexora: actions.goNexora, progress: actions.goProgress, friends: actions.goFriends };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map(({ key, label, Icon }) => {
        const on = key === active;
        const color = on ? colors.accent700 : colors.neutral600;
        return (
          <Pressable key={key} onPress={go[key as 'home' | 'nexora' | 'progress' | 'friends']} style={styles.tab}>
            <Icon size={24} color={color} />
            <Text style={[styles.label, { color, fontWeight: on ? '800' : '700' }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: 12, paddingHorizontal: 16,
    backgroundColor: colors.white, borderTopWidth: 2, borderTopColor: colors.neutral200,
  },
  tab: { alignItems: 'center', gap: 4 },
  label: { fontFamily: fonts.bodyBold, fontSize: 11 },
});
