import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { StatusDot, statusColor, statusLabel } from './StatusDot';

interface StatusPillProps {
  status: string;
}

export function StatusPill({ status }: StatusPillProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const color = statusColor(colorScheme, status);
  return (
    <View style={[styles.pill, { backgroundColor: color + '1A' }]}>
      <StatusDot status={status as any} size={6} />
      <Text style={[styles.label, { color }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
