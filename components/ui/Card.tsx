import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View, ViewProps, useColorScheme } from 'react-native';

export function Card({ style, children, ...props }: ViewProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);
    return (
        <View style={[styles.card, style]} {...props}>
            {children}
        </View>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    card: {
        backgroundColor: Colors[colorScheme].card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(27,139,78,0.08)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: colorScheme === 'dark' ? 0.2 : 1,
        shadowRadius: 16,
        elevation: 4,
    },
});
