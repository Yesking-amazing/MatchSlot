import { useColorScheme } from '@/components/useColorScheme';
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
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);

    const getTextColor = () => {
        if (disabled) return Colors[colorScheme].textTertiary;
        if (variant === 'primary') return '#fff';
        if (variant === 'secondary') return Colors[colorScheme].primary;
        return Colors[colorScheme].text;
    };

    const getBackgroundColor = (pressed: boolean) => {
        if (disabled) return Colors[colorScheme].border;
        if (variant === 'primary') return pressed ? '#157A42' : '#1B8B4E';
        if (variant === 'secondary') return pressed ? Colors[colorScheme].cardBorder : Colors[colorScheme].secondary;
        return 'transparent';
    };

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: getBackgroundColor(pressed) },
                variant === 'primary' && !disabled && {
                    shadowColor: '#1B8B4E',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                    elevation: 6,
                },
                variant === 'outline' && {
                    borderWidth: 1,
                    borderColor: Colors[colorScheme].border,
                },
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

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    container: {
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 28,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
