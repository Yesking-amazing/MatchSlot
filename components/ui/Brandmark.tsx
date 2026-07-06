import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// The mark: a lime dot inside a pine/emerald ring. Replaces the ⚽ emoji.
export function Mark({ size = 10 }: { size?: number }) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    const box = size + 8;
    return (
        <View style={{ width: box, height: box, borderRadius: box / 2, borderWidth: 2, borderColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.accent }} />
        </View>
    );
}

// Wordmark: mark + "Matchslot" in Bricolage 800.
export function Wordmark({ size = 20, color }: { size?: number; color?: string }) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    return (
        <View style={styles.row}>
            <Mark size={Math.round(size * 0.5)} />
            <Text style={[styles.word, { color: color ?? c.primary, fontSize: size }]}>Matchslot</Text>
        </View>
    );
}

// Monogram "M" rounded-square — for app-icon-style contexts and auth hero.
export function Monogram({ size = 56 }: { size?: number }) {
    const c = Colors.light; // brand field is always pine, regardless of theme
    return (
        <View style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: Fonts.display, fontWeight: '800', color: c.primaryInk, fontSize: size * 0.5 }}>M</Text>
            <View style={{ position: 'absolute', top: size * 0.16, right: size * 0.16, width: size * 0.1, height: size * 0.1, borderRadius: size * 0.05, backgroundColor: c.accent }} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    word: { fontFamily: Fonts.display, fontWeight: '800', letterSpacing: -0.5 },
});
