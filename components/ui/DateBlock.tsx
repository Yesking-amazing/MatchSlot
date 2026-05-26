import { Colors } from '@/constants/Colors';
import { getDayAbbr, getMonthAbbr } from '@/lib/dateUtils';
import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

interface DateBlockProps {
  iso: string;
  size?: 'sm' | 'lg';
}

export function DateBlock({ iso, size = 'sm' }: DateBlockProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const t = Colors[colorScheme];
  const d = new Date(iso);
  const w = size === 'sm' ? 48 : 58;
  const h = size === 'sm' ? 54 : 64;

  return (
    <View style={[styles.container, {
      width: w,
      height: h,
      backgroundColor: t.primaryLight,
    }]}>
      <Text style={[styles.month, { color: t.primaryDark }]}>
        {getMonthAbbr(d)}
      </Text>
      <Text style={[styles.day, { color: t.primaryDark }]}>
        {d.getDate()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  day: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
});
