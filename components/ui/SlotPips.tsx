import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// Non-chip slot-progress encoding: a row of pips, filled = booked.
interface Props {
    total: number;
    filled: number;
    color?: string;
    muted?: boolean;
}

export function SlotPips({ total, filled, color, muted }: Props) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    const fillColor = muted ? c.textFaint : (color ?? c.primary);
    const n = Math.max(total, 0);
    return (
        <View style={styles.row}>
            {Array.from({ length: n }).map((_, i) => (
                <View
                    key={i}
                    style={[styles.pip, { backgroundColor: i < filled ? fillColor : c.divider }]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    pip: { width: 22, height: 5, borderRadius: 3 },
});
