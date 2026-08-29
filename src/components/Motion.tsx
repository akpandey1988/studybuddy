import React from 'react';
import { Animated, Easing, Pressable, StyleProp, ViewStyle } from 'react-native';

/**
 * Motion primitives. RN 0.86's New Architecture ships `Animated` with the
 * native driver, and nothing here animates layout — only transform and
 * opacity — so every animation in this file runs off the JS thread.
 */

// ── Press feedback ────────────────────────────────────────────────────────
/**
 * A Pressable that dips under the finger. Every tappable surface in the app
 * used to be visually inert on press, which is most of why it read as flat.
 */
export function PressableScale({
  children, onPress, style, to = 0.96, disabled, hitSlop,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  to?: number;
  disabled?: boolean;
  hitSlop?: number;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const spring = (toValue: number) =>
    Animated.spring(scale, {
      toValue, useNativeDriver: true, speed: 40, bounciness: 6,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => spring(to)}
      onPressOut={() => spring(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.55 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── Entrance ──────────────────────────────────────────────────────────────
/**
 * Fades and lifts content in on mount. `delay` staggers a column of cards so
 * a screen assembles itself instead of appearing all at once.
 */
export function Rise({
  children, delay = 0, distance = 14, style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(t, {
      toValue: 1, duration: 420, delay, useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [t, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ── Ambient loops ─────────────────────────────────────────────────────────
/** Slow breathing scale — used to keep the mascot alive while it sits idle. */
export function Breathe({
  children, amount = 0.03, duration = 2600, style, enabled = true,
}: {
  children: React.ReactNode;
  amount?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  enabled?: boolean;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!enabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
        Animated.timing(t, { toValue: 0, duration, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration, enabled]);

  return (
    <Animated.View
      style={[style, { transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + amount] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

/** Expanding halo, for anything that is actively listening or working. */
export function Pulse({
  children, color, size, style,
}: {
  children: React.ReactNode;
  color: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  const t = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size, height: size, borderRadius: size,
          backgroundColor: color,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
        }}
      />
      {children}
    </Animated.View>
  );
}

// ── Value animation ───────────────────────────────────────────────────────
/**
 * Eases a number towards `to`. SVG geometry can't take an `Animated.Value`
 * reliably under Fabric, so the driver feeds React state instead — kept inside
 * small leaf components so the re-renders stay local.
 */
export function useEasedValue(to: number, duration = 900, delay = 0) {
  const anim = React.useRef(new Animated.Value(0)).current;
  const [shown, setShown] = React.useState(0);

  React.useEffect(() => {
    const id = anim.addListener(({ value }) => setShown(value));
    Animated.timing(anim, {
      toValue: to, duration, delay, useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
    return () => anim.removeListener(id);
  }, [anim, to, duration, delay]);

  return shown;
}
