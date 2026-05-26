import { Colors } from '@/constants/Colors';
import React from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const t = Colors[colorScheme];
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: t.text }]}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: t.primary }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
  },
});
