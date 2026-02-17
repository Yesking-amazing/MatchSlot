import { Colors } from '@/constants/Colors';
import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text } from 'react-native';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    style?: any;
}

export function Button({ title, variant = 'primary', loading, style, disabled, ...props }: ButtonProps) {
    const customBgColor = style?.backgroundColor;

    const getBackgroundColor = (pressed: boolean) => {
        if (customBgColor) return customBgColor;
        if (disabled) return 'rgba(255,255,255,0.08)';
        if (variant === 'primary') return pressed ? Colors.light.primaryDark : Colors.light.primary;
        if (variant === 'secondary') return pressed ? 'rgba(16,185,129,0.18)' : Colors.light.secondary;
        return 'transparent';
    };

    const getTextColor = () => {
        if (disabled) return 'rgba(255,255,255,0.3)';
        if (variant === 'primary') return '#fff';
        if (variant === 'secondary') return Colors.light.primary;
        return Colors.light.text;
    };

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: getBackgroundColor(pressed) },
                variant === 'primary' && styles.primaryShadow,
                variant === 'outline' && styles.outline,
                style,
            ]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 24,
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    primaryShadow: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    outline: {
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
});
