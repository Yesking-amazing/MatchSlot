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
    // Extract backgroundColor from style if present
    const customBgColor = style?.backgroundColor;
    
    const getBackgroundColor = (pressed: boolean) => {
        if (customBgColor) return customBgColor;
        if (disabled) return '#A0A0A0';
        if (variant === 'primary') return pressed ? '#4B63B6' : Colors.light.primary; // Darker on press
        if (variant === 'secondary') return pressed ? '#d0dafc' : Colors.light.secondary;
        return 'transparent';
    };

    const getTextColor = () => {
        if (variant === 'primary') return '#fff';
        if (variant === 'secondary') return Colors.light.primary;
        return Colors.light.text;
    };

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: getBackgroundColor(pressed) },
                variant === 'outline' && styles.outline,
                style
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
        height: 56, // Tall touch target
        borderRadius: 28, // Fully rounded
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 24,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
    outline: {
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
});
