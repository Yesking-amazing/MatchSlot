import { Colors } from '@/constants/Colors';
import React from 'react';
import { View, useColorScheme } from 'react-native';

type Status = 'OPEN' | 'HELD' | 'PENDING_APPROVAL' | 'BOOKED' | 'REJECTED' | 'CLOSED' | 'CANCELLED';

export function statusColor(colorScheme: 'light' | 'dark', status: string): string {
  const t = Colors[colorScheme];
  switch (status) {
    case 'OPEN': return t.success;
    case 'HELD': return t.warning;
    case 'PENDING_APPROVAL': return t.warning;
    case 'BOOKED': return t.info;
    case 'REJECTED': return t.error;
    case 'CLOSED': return t.textSecondary;
    case 'CANCELLED': return t.textTertiary;
    default: return t.textSecondary;
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Open',
    HELD: 'Held',
    PENDING_APPROVAL: 'Pending approval',
    BOOKED: 'Booked',
    REJECTED: 'Rejected',
    CLOSED: 'Closed',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status;
}

interface StatusDotProps {
  status: Status;
  size?: number;
}

export function StatusDot({ status, size = 8 }: StatusDotProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const color = statusColor(colorScheme, status);
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
    }} />
  );
}
