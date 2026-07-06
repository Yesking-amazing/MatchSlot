import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Auto-generated monogram crest from a club/team name.
// shape: 'circle' for fixtures (ring), 'square' (rounded) for list rows.
interface Props {
    name?: string | null;
    size?: number;
    shape?: 'circle' | 'square';
    ringColor?: string;   // override ring/border color (e.g. status color)
    muted?: boolean;      // neutral/past styling
    style?: any;
}

function initials(name?: string | null): string {
    if (!name || !name.trim()) return '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Crest({ name, size = 50, shape = 'circle', ringColor, muted, style }: Props) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    const label = initials(name);
    const unknown = !label;

    const ring = muted ? c.divider : (ringColor ?? c.primary);
    const radius = shape === 'circle' ? size / 2 : 9;
    const fontSize = Math.round(size * (shape === 'circle' ? 0.36 : 0.4));

    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: radius,
                    borderWidth: 2,
                    borderColor: unknown ? c.divider : ring,
                    borderStyle: unknown ? 'dashed' : 'solid',
                    backgroundColor: muted ? c.surfaceSunk : c.primaryTint,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                style,
            ]}
        >
            <Text style={[styles.text, { color: unknown ? c.textFaint : (muted ? c.textMuted : ring), fontSize }]}>
                {unknown ? '?' : label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    text: { fontFamily: Fonts.display, fontWeight: '800', letterSpacing: -0.5 },
});
