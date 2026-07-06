import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { Check, Circle, Clock, Lock, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Semantic status kinds — every chip is hue + glyph + label so it survives
// dark mode and color-blindness (never color alone).
export type StatusKind = 'open' | 'pending' | 'confirmed' | 'booked' | 'closed' | 'cancelled';

// Map raw DB statuses to a semantic kind.
export function offerStatusKind(status: string): StatusKind {
    switch (status) {
        case 'OPEN': return 'open';
        case 'PENDING_APPROVAL': return 'pending';
        case 'CLOSED': return 'closed';
        case 'CANCELLED': return 'cancelled';
        default: return 'open';
    }
}

export function slotStatusKind(status: string): StatusKind {
    switch (status) {
        case 'OPEN': return 'open';
        case 'HELD':
        case 'PENDING_APPROVAL': return 'pending';
        case 'BOOKED': return 'confirmed';
        case 'REJECTED': return 'cancelled';
        default: return 'open';
    }
}

function meta(kind: StatusKind, scheme: 'light' | 'dark') {
    switch (kind) {
        case 'open':
            return { Icon: Circle, fill: 'rgba(53,217,138,0.14)', text: scheme === 'dark' ? '#35D98A' : '#15603D' };
        case 'pending':
            return { Icon: Clock, fill: 'rgba(232,168,58,0.16)', text: scheme === 'dark' ? '#E8A83A' : '#B6801F' };
        case 'confirmed':
            return { Icon: Check, fill: 'rgba(53,217,138,0.14)', text: scheme === 'dark' ? '#35D98A' : '#15603D' };
        case 'booked':
            return { Icon: Lock, fill: scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', text: scheme === 'dark' ? '#8FA091' : '#8A927F' };
        case 'closed':
            return { Icon: Lock, fill: scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', text: scheme === 'dark' ? '#8FA091' : '#8A927F' };
        case 'cancelled':
            return { Icon: X, fill: scheme === 'dark' ? 'rgba(224,110,110,0.14)' : 'rgba(192,85,79,0.10)', text: scheme === 'dark' ? '#E06E6E' : '#C0554F' };
    }
}

interface Props {
    kind: StatusKind;
    label: string;
    style?: any;
}

export function StatusChip({ kind, label, style }: Props) {
    const scheme = useColorScheme() ?? 'light';
    const m = meta(kind, scheme);
    const color = m.text as string;
    return (
        <View style={[styles.chip, { backgroundColor: m.fill }, style]}>
            <m.Icon size={11} color={color} strokeWidth={2.5} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 24,
        paddingHorizontal: 9,
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    label: { fontFamily: Fonts.body, fontSize: 12, fontWeight: '600' },
});
