import { Colors } from '@/constants/Colors';
import React from 'react';
import { useColorScheme } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

interface FormationChipProps {
  format: string;
  size?: 'sm' | 'md';
}

const formations: Record<number, number[][]> = {
  5: [[1], [2], [2]],
  7: [[1], [2], [3], [1]],
  9: [[1], [3], [3], [2]],
  11: [[1], [4], [4], [2]],
};

export function FormationChip({ format, size = 'sm' }: FormationChipProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const t = Colors[colorScheme];
  const n = parseInt(format, 10) || 5;
  const w = size === 'sm' ? 48 : 72;
  const h = size === 'sm' ? 28 : 42;
  const form = formations[n] || [[1], [2], [2]];
  const pad = 4;
  const usableW = w - pad * 2;
  const usableH = h - pad * 2;
  const cols = form.length;
  const dotR = size === 'sm' ? 1.4 : 2;

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Rect
        x={0.5} y={0.5} width={w - 1} height={h - 1}
        rx={size === 'sm' ? 5 : 7}
        fill={t.secondary}
        stroke="transparent" strokeWidth={0.5}
      />
      <Line
        x1={w / 2} y1={pad} x2={w / 2} y2={h - pad}
        stroke={t.pitchLine} strokeWidth={0.5}
      />
      <Circle
        cx={w / 2} cy={h / 2} r={size === 'sm' ? 2.5 : 4}
        fill="none" stroke={t.pitchLine} strokeWidth={0.5}
      />
      {form.map((rowCount, c) => {
        const x = pad + (usableW / 2 / cols) * (c + 0.5);
        const dots = rowCount[0];
        return Array.from({ length: dots }).map((_, i) => {
          const y = pad + (usableH / (dots + 1)) * (i + 1);
          return (
            <Circle key={`a${c}${i}`} cx={x} cy={y} r={dotR} fill={t.primary} />
          );
        });
      })}
      {form.map((rowCount, c) => {
        const x = w - pad - (usableW / 2 / cols) * (c + 0.5);
        const dots = rowCount[0];
        return Array.from({ length: dots }).map((_, i) => {
          const y = pad + (usableH / (dots + 1)) * (i + 1);
          return (
            <Circle key={`b${c}${i}`} cx={x} cy={y} r={dotR} fill={t.primary + '55'} />
          );
        });
      })}
    </Svg>
  );
}
