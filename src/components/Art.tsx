import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { Breathe, useEasedValue } from './Motion';
import { colors, fonts } from '../theme/tokens';

/**
 * Drawn artwork. The app ships no photography and shouldn't need any — every
 * illustration here is vector, themed from the same tokens as the rest of the
 * UI, and costs nothing to bundle.
 */

// ── Nexora ────────────────────────────────────────────────────────────────
export type Mood = 'idle' | 'happy' | 'cheer' | 'thinking' | 'oops';

const MOUTH: Record<Mood, { d: string; fill?: boolean }> = {
  idle: { d: 'M42 69 Q50 75 58 69' },
  happy: { d: 'M40 67 Q50 79 60 67' },
  cheer: { d: 'M39 66 Q50 84 61 66 Z', fill: true },
  thinking: { d: 'M43 72 Q50 70 57 73' },
  oops: { d: 'M42 76 Q50 68 58 76' },
};

/**
 * The study buddy the product is named after. It was an "N" in a circle on
 * every screen; a face that reacts to what just happened does the work a
 * paragraph of encouragement was doing before.
 */
export function Nexora({
  size = 96, mood = 'idle', animate = true, style,
}: {
  size?: number;
  mood?: Mood;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [blinking, setBlinking] = React.useState(false);

  // Irregular blinks — a fixed interval reads as a machine, not a character.
  React.useEffect(() => {
    if (!animate) return;
    let close: ReturnType<typeof setTimeout> | undefined;
    let next: ReturnType<typeof setTimeout>;
    const schedule = (): ReturnType<typeof setTimeout> => setTimeout(() => {
      setBlinking(true);
      close = setTimeout(() => setBlinking(false), 130);
      next = schedule();
    }, 2200 + Math.random() * 3200);
    next = schedule();
    return () => { clearTimeout(next); if (close) clearTimeout(close); };
  }, [animate]);

  const eyeRy = blinking ? 1.2 : 9;
  const mouth = MOUTH[mood];
  // A slight lean sells "working on it" better than a different mouth alone.
  const tilt = mood === 'thinking' ? -6 : 0;

  return (
    <Breathe enabled={animate} amount={mood === 'cheer' ? 0.06 : 0.03} style={style}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G rotation={tilt} origin="50, 60">
          {/* sprout */}
          <Path d="M50 22 L50 10" stroke={colors.accent2_700} strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M50 13 C57 3 71 3 77 7 C72 17 58 21 50 13 Z" fill={colors.accent2_400} />
          <Path d="M50 17 C44 9 33 9 28 12 C32 20 43 24 50 17 Z" fill={colors.accent2_600} />

          {/* body */}
          <Path
            d="M50 20 C74 20 88 34 88 57 C88 79 72 93 50 93 C28 93 12 79 12 57 C12 34 26 20 50 20 Z"
            fill={colors.accent2_500}
          />
          <Ellipse cx={35} cy={38} rx={11} ry={7} fill="#ffffff" opacity={0.18} />

          {/* face */}
          <Ellipse cx={37} cy={54} rx={8} ry={eyeRy} fill="#ffffff" />
          <Ellipse cx={63} cy={54} rx={8} ry={eyeRy} fill="#ffffff" />
          {!blinking && (
            <>
              <Circle cx={38.5} cy={56} r={4.2} fill={colors.neutral900} />
              <Circle cx={64.5} cy={56} r={4.2} fill={colors.neutral900} />
              <Circle cx={36.8} cy={53.6} r={1.5} fill="#ffffff" />
              <Circle cx={62.8} cy={53.6} r={1.5} fill="#ffffff" />
            </>
          )}
          <Circle cx={24} cy={65} r={5} fill={colors.accent400} opacity={0.55} />
          <Circle cx={76} cy={65} r={5} fill={colors.accent400} opacity={0.55} />
          <Path
            d={mouth.d}
            fill={mouth.fill ? colors.neutral900 : 'none'}
            stroke={colors.neutral900}
            strokeWidth={3.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </Svg>
    </Breathe>
  );
}

/** List-sized Nexora, replacing the lettered avatar circles. */
export function NexoraAvatar({ size = 36, mood = 'idle' }: { size?: number; mood?: Mood }) {
  return (
    <View style={[styles.avatarWrap, { width: size, height: size, borderRadius: size }]}>
      <Nexora size={size} mood={mood} animate={false} />
    </View>
  );
}

// ── Progress ring ─────────────────────────────────────────────────────────
/** An animated arc. Replaces the flat readiness bars — same data, read faster. */
export function ProgressRing({
  value, size = 116, stroke = 12, color = colors.accent2_500,
  track = colors.neutral200, children, delay = 120,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
  delay?: number;
}) {
  const shown = useEasedValue(Math.max(0, Math.min(100, value)), 1000, delay);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - shown / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/**
 * The common case: a ring with its own number inside. At 2% a bar looks
 * broken; a ring with a visible cap still reads as "started".
 */
export function ReadinessRing({
  value, caption, size = 116, color = colors.accent2_500,
}: { value: number; caption?: string; size?: number; color?: string }) {
  const shown = useEasedValue(Math.max(0, Math.min(100, value)), 1000, 120);
  return (
    <ProgressRing value={value} size={size} color={color}>
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.ringValue, { fontSize: size * 0.27, color }]}>{Math.round(shown)}%</Text>
        {caption ? <Text style={styles.ringCaption}>{caption}</Text> : null}
      </View>
    </ProgressRing>
  );
}

// ── Subject artwork ───────────────────────────────────────────────────────
type Glyph = 'maths' | 'science' | 'language' | 'social' | 'computer' | 'general';

const GLYPH_RULES: [Glyph, RegExp][] = [
  ['maths', /math|algebra|geometry|calculus|trig|statist|account/i],
  ['science', /science|physic|chem|bio|zoo|botan/i],
  ['language', /english|hindi|language|literat|sanskrit|french|writing|grammar/i],
  ['social', /history|geograph|civic|social|econom|politic/i],
  ['computer', /comput|code|coding|program|informat/i],
];

const GLYPH_COLOR: Record<Glyph, { bg: string; fg: string }> = {
  maths: { bg: colors.accent100, fg: colors.accent700 },
  science: { bg: colors.accent2_100, fg: colors.accent2_700 },
  language: { bg: colors.accent200, fg: colors.accent800 },
  social: { bg: colors.accent2_200, fg: colors.accent2_800 },
  computer: { bg: colors.neutral200, fg: colors.neutral700 },
  general: { bg: colors.accent100, fg: colors.accent700 },
};

export function glyphFor(subject: string): Glyph {
  for (const [glyph, re] of GLYPH_RULES) if (re.test(subject)) return glyph;
  return 'general';
}

/** A drawn tile per subject, so a list of exams scans by shape and colour. */
export function SubjectGlyph({ subject, size = 46 }: { subject: string; size?: number }) {
  const kind = glyphFor(subject);
  const { bg, fg } = GLYPH_COLOR[kind];
  const s = size * 0.54;

  return (
    <View style={[styles.glyphWrap, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg }]}>
      <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        {kind === 'maths' && (
          <>
            <Path d="M4 7h6M7 4v6" stroke={fg} strokeWidth={2.6} strokeLinecap="round" />
            <Path d="M14 6.5h6" stroke={fg} strokeWidth={2.6} strokeLinecap="round" />
            <Path d="M14 17h6M14 20h6" stroke={fg} strokeWidth={2.6} strokeLinecap="round" />
            <Path d="M4.5 15l5 5M9.5 15l-5 5" stroke={fg} strokeWidth={2.6} strokeLinecap="round" />
          </>
        )}
        {kind === 'science' && (
          <>
            <Path d="M9 3v6.2L4.4 18A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.8-3L15 9.2V3" stroke={fg} strokeWidth={2.4} strokeLinejoin="round" />
            <Path d="M8 3h8" stroke={fg} strokeWidth={2.4} strokeLinecap="round" />
            <Circle cx={10.5} cy={16} r={1.4} fill={fg} />
            <Circle cx={14} cy={18} r={1} fill={fg} />
          </>
        )}
        {kind === 'language' && (
          <>
            <Path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z" stroke={fg} strokeWidth={2.4} strokeLinejoin="round" />
            <Path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" stroke={fg} strokeWidth={2.4} strokeLinejoin="round" />
          </>
        )}
        {kind === 'social' && (
          <>
            <Circle cx={12} cy={12} r={8.5} stroke={fg} strokeWidth={2.4} />
            <Path d="M3.5 12h17" stroke={fg} strokeWidth={2.4} strokeLinecap="round" />
            <Path d="M12 3.5c2.6 2.8 2.6 14.2 0 17M12 3.5c-2.6 2.8-2.6 14.2 0 17" stroke={fg} strokeWidth={2.4} />
          </>
        )}
        {kind === 'computer' && (
          <>
            <Rect x={2.5} y={4} width={19} height={13} rx={2} stroke={fg} strokeWidth={2.4} />
            <Path d="M8 21h8" stroke={fg} strokeWidth={2.4} strokeLinecap="round" />
            <Path d="m9.5 8.5-2.5 2 2.5 2M14.5 8.5l2.5 2-2.5 2" stroke={fg} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {kind === 'general' && (
          <>
            <Path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z" stroke={fg} strokeWidth={2.4} strokeLinejoin="round" />
            <Path d="M8 9h8M8 13h5" stroke={fg} strokeWidth={2.4} strokeLinecap="round" />
          </>
        )}
      </Svg>
    </View>
  );
}

// ── Decoration ────────────────────────────────────────────────────────────
/**
 * Soft shapes behind a header. Purely atmospheric — it gives the top of a
 * screen something to look at other than type.
 */
export function HeroBlobs({
  height = 190, tint = colors.accent200, tint2 = colors.accent2_200,
}: { height?: number; tint?: string; tint2?: string }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height, overflow: 'hidden' }]}>
      <Svg width="100%" height={height} viewBox="0 0 400 190" preserveAspectRatio="none">
        <Circle cx={330} cy={22} r={92} fill={tint} opacity={0.55} />
        <Circle cx={52} cy={-14} r={74} fill={tint2} opacity={0.5} />
        <Path d="M0 150 C90 118 150 176 250 148 C320 128 366 158 400 144 L400 0 L0 0 Z" fill={tint} opacity={0.22} />
      </Svg>
    </View>
  );
}

/** Radiating rays behind a celebration. */
export function Burst({ size = 220, color = colors.accent300 }: { size?: number; color?: string }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G opacity={0.45}>
          {Array.from({ length: 12 }, (_, i) => (
            <Rect
              key={i}
              x={48.6} y={i % 2 ? 6 : 2} width={2.8} height={i % 2 ? 12 : 16} rx={1.4}
              fill={color} transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

// ── Strength meter ────────────────────────────────────────────────────────
/**
 * Five pips for how solid a concept is. The written state label beside it was
 * saying the same thing twice, so the colour now carries it alone.
 */
export function StrengthDots({
  strength, color, dim = colors.neutral200, height = 9,
}: { strength: number; color: string; dim?: string; height?: number }) {
  const filled = Math.round(Math.max(0, Math.min(1, strength)) * 5);
  return (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flex: 1, height, borderRadius: 999, backgroundColor: i < filled ? color : dim }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrap: {
    backgroundColor: colors.accent2_100, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  glyphWrap: { alignItems: 'center', justifyContent: 'center' },
  ringValue: { fontFamily: fonts.heading },
  ringCaption: {
    fontFamily: fonts.bodyExtraBold, fontSize: 10, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.neutral600, marginTop: 1,
  },
});
