import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { FormationChip } from './FormationChip';

interface FormatBlockProps {
  format: string;
}

export function FormatBlock({ format }: FormatBlockProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const t = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: t.primaryLight }]}>
      <FormationChip format={format} size="sm" />
      <Text style={[styles.label, { color: t.primaryDark }]}>{format}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 3,
  },
});
