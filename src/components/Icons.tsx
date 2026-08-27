import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

const base = (size = 24) => ({ width: size, height: size, viewBox: '0 0 24 24' });

export function UploadIcon({ size = 24, color = '#8c491a', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M12 17V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m6 11 6-6 6 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 19h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CameraIcon({ size = 24, color = '#8c491a', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2a1 1 0 0 0 .83-.45l.94-1.4A1 1 0 0 1 9.3 4.7h5.4a1 1 0 0 1 .83.45l.94 1.4a1 1 0 0 0 .83.45h2.2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-9Z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx={12} cy={13} r={3.4} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function CheckIcon({ size = 20, color = '#56633f', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M20 6 9 17l-5-5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LeafIcon({ size = 17, color = '#8c491a', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M12 3c1.5 3 4.5 4.5 4.5 8a4.5 4.5 0 0 1-9 0C7.5 7.5 10.5 6 12 3z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HomeIcon({ size = 24, color = 'currentColor', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M3 10.5 12 3l9 7.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 10v10h14V10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChatIcon({ size = 24, color = 'currentColor', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BarChartIcon({ size = 24, color = 'currentColor', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M4 19V9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 19V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 19v-7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 19H2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FriendsIcon({ size = 24, color = 'currentColor', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx={9} cy={8} r={3.2} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 7.5a3 3 0 0 1 0 5.6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StarIcon({ size = 36, color = '#fff', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9L3.5 9.2l5.9-.8z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DropIcon({ size = 30, color = '#56633f', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M12 21c-4-4-7-7-7-11a7 7 0 0 1 14 0c0 4-3 7-7 11z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ClockIcon({ size = 30, color = '#8c491a', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 8v4l3 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SendIcon({ size = 22, color = '#fff', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M12 19V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m5 12 7-7 7 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MicIcon({ size = 24, color = '#645c50', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 11a7 7 0 0 0 14 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function VideoIcon({ size = 24, color = '#645c50', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M15 10.5 21 7v10l-6-3.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={3} y={6} width={12} height={12} rx={3} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function HangUpIcon({ size = 24, color = '#fff', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M3 6c6 10 9 13 15 15l3-4-5-2-2 2c-2-1.5-4-3.5-5-5l2-2-2-5z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 4l16 16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = '#fff', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 5v14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GearIcon({ size = 22, color = '#645c50', strokeWidth = 2.75 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.4-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4z"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}
