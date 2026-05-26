import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    loading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    style?: any;
}

export function Button({ title, variant = 'primary', loading, icon, style, disabled, ...props }: ButtonProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const t = Colors[colorScheme];

    const getTextColor = () => {
        if (disabled) return t.textTertiary;
        if (variant === 'primary') return colorScheme === 'dark' ? '#06140C' : '#FFFFFF';
        if (variant === 'secondary') return t.primary;
        if (variant === 'ghost') return t.primary;
        if (variant === 'danger') return t.error;
        return t.text;
    };

    const getBackgroundColor = (pressed: boolean) => {
        if (disabled) return t.border;
        if (variant === 'primary') return pressed ? t.primaryDark : t.primary;
        if (variant === 'secondary') return pressed ? t.cardBorder : t.secondary;
        if (variant === 'ghost') return t.secondary;
        if (variant === 'danger') return 'transparent';
        return 'transparent';
    };

    const textColor = getTextColor();

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                { backgroundColor: getBackgroundColor(pressed) },
                variant === 'primary' && !disabled && {
                    shadowColor: t.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 18,
                    elevation: 6,
                },
                variant === 'outline' && {
                    borderWidth: 1,
                    borderColor: t.cardBorder,
                },
                variant === 'danger' && {
                    borderWidth: 1,
                    borderColor: t.error + '55',
                },
                style,
            ]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <View style={styles.content}>
                    {icon && <Ionicons name={icon} size={18} color={textColor} />}
                    <Text style={[styles.text, { color: textColor }]}>{title}</Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 20,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
