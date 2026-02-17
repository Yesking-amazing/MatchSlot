import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export function Card({ style, children, ...props }: ViewProps) {
    return (
        <View style={[styles.card, style]} {...props}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.light.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.light.cardBorder,
        // Soft dark shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
});
