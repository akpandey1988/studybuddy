import React from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
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

/**
 * One tab. The active pill grows in behind the icon rather than appearing,
 * and every tab dips under the finger — the bar used to be entirely inert.
 */
function Tab({
  label, Icon, active, onPress,
}: {
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  active: boolean;
  onPress: () => void;
}) {
  const on = React.useRef(new Animated.Value(active ? 1 : 0)).current;
  const press = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(on, {
      toValue: active ? 1 : 0, duration: 220, useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [on, active]);

  const color = active ? colors.accent700 : colors.neutral600;

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      onPressIn={() => Animated.spring(press, { toValue: 0.9, useNativeDriver: true, speed: 45, bounciness: 8 }).start()}
      onPressOut={() => Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 45, bounciness: 8 }).start()}
    >
      <Animated.View style={{ alignItems: 'center', gap: 4, transform: [{ scale: press }] }}>
        <View style={styles.iconWrap}>
          <Animated.View
            style={[
              styles.pill,
              { opacity: on, transform: [{ scale: on.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] },
            ]}
          />
          <Icon size={24} color={color} />
        </View>
        <Text style={[styles.label, { color, fontWeight: active ? '800' : '700' }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({ active }: { active: Route }) {
  const { actions } = useApp();
  const insets = useSafeAreaInsets();
  const go = { home: actions.goHome, nexora: actions.goNexora, progress: actions.goProgress, friends: actions.goFriends };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map(({ key, label, Icon }) => (
        <Tab
          key={key}
          label={label}
          Icon={Icon}
          active={key === active}
          onPress={go[key as 'home' | 'nexora' | 'progress' | 'friends']}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: 10, paddingHorizontal: 16,
    backgroundColor: colors.white, borderTopWidth: 2, borderTopColor: colors.neutral200,
  },
  tab: { alignItems: 'center' },
  iconWrap: { width: 56, height: 34, alignItems: 'center', justifyContent: 'center' },
  pill: {
    position: 'absolute', width: 56, height: 34, borderRadius: 999,
    backgroundColor: colors.accent100,
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 11 },
});
