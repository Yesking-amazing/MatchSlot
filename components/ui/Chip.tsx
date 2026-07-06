import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
    label: string;
    active?: boolean;
    onPress?: () => void;
    style?: any;
}

// Filter / selection chip (radius 999). Inactive = surface + border, active = primary fill.
export function Chip({ label, active, onPress, style }: Props) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.chip,
                {
                    backgroundColor: active ? c.primary : c.card,
                    borderColor: active ? c.primary : c.border,
                },
                style,
            ]}
        >
            <Text style={[styles.label, { color: active ? c.primaryInk : c.textSecondary }]}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    chip: {
        height: 32,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '600' },
});
