import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    icon: React.ReactNode;    // a lucide icon element
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    style?: any;
}

// Replaces every old "chalk board" empty state.
export function EmptyState({ icon, title, subtitle, action, style }: Props) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    return (
        <View style={[styles.wrap, style]}>
            <View style={[styles.iconSquare, { backgroundColor: c.primaryTint }]}>
                {icon}
            </View>
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text>}
            {action && <View style={styles.action}>{action}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
    iconSquare: {
        width: 52, height: 52, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    title: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '700', textAlign: 'center' },
    subtitle: { fontFamily: Fonts.body, fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 4, lineHeight: 17 },
    action: { marginTop: 16 },
});
