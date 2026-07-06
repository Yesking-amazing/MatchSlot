import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface RowProps {
    label: string;
    value?: string;
    onPress?: () => void;
    first?: boolean;
    icon?: React.ReactNode;
}

// A single tappable row: label left, value + chevron right.
// Wrap a group in <PickerGroup> to get the bordered card + dividers.
export function PickerRow({ label, value, onPress, first, icon }: RowProps) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.row,
                !first && { borderTopWidth: 1, borderTopColor: c.divider },
                pressed && { backgroundColor: c.primaryTint },
            ]}
        >
            <View style={styles.left}>
                {icon}
                <Text style={[styles.label, { color: c.textMuted, marginLeft: icon ? 10 : 0 }]}>{label}</Text>
            </View>
            <View style={styles.right}>
                {value != null && <Text style={[styles.value, { color: c.text }]} numberOfLines={1}>{value}</Text>}
                <ChevronRight size={16} color={c.textFaint} strokeWidth={2} />
            </View>
        </Pressable>
    );
}

export function PickerGroup({ children, style }: { children: React.ReactNode; style?: any }) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    return (
        <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    group: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, minHeight: 52,
    },
    left: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
    right: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, marginLeft: 12 },
    label: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '500' },
    value: { fontFamily: Fonts.body, fontSize: 13.5, fontWeight: '700', flexShrink: 1 },
});
