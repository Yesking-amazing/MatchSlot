import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View, ViewProps, useColorScheme } from 'react-native';

export function Card({ style, children, ...props }: ViewProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const t = Colors[colorScheme];
    return (
        <View
            style={[
                {
                    backgroundColor: t.card,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: t.divider,
                    shadowColor: colorScheme === 'dark' ? '#000' : t.shadow,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: colorScheme === 'dark' ? 0.3 : 1,
                    shadowRadius: 22,
                    elevation: 4,
                },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}
