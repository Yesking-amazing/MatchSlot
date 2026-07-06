import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    // 'sunk' uses the secondary surface; 'flat' has no border hairline shadow
    tone?: 'default' | 'sunk';
    radius?: number;
    padding?: number;
}

export function Card({ style, children, tone = 'default', radius = 16, padding = 16, ...props }: CardProps) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    return (
        <View
            style={[
                {
                    backgroundColor: tone === 'sunk' ? c.surfaceSunk : c.card,
                    borderRadius: radius,
                    padding,
                    borderWidth: 1,
                    borderColor: c.border,
                    marginBottom: 14,
                },
                scheme === 'light' && styles.hairline,
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    hairline: {
        shadowColor: '#EFEADD',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
});
