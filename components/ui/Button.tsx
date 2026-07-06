import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'deny';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: Variant;
    // 'outline' kept as a back-compat alias for 'secondary'
    loading?: boolean;
    icon?: React.ReactNode;
    style?: any;
}

export function Button({ title, variant = 'primary', loading, icon, style, disabled, ...props }: ButtonProps) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    const [pressed, setPressed] = useState(false);

    // Back-compat: old screens may still pass 'outline'
    const v: Variant = (variant as any) === 'outline' ? 'secondary' : variant;

    const textColor = () => {
        if (disabled) return c.textTertiary;
        if (v === 'primary') return c.primaryInk;
        if (v === 'deny') return c.error;
        return c.primary;
    };

    const bgColor = () => {
        if (v === 'primary') {
            if (disabled) return scheme === 'dark' ? 'rgba(255,255,255,0.08)' : c.divider;
            return pressed ? c.primaryDark : c.primary;
        }
        if (pressed) return v === 'deny' ? 'rgba(192,85,79,0.08)' : c.primaryTint;
        return 'transparent';
    };

    const borderColor = () => {
        if (v === 'secondary') return c.primary;
        if (v === 'deny') return c.errorBorder;
        return 'transparent';
    };

    return (
        <Pressable
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            disabled={disabled || loading}
            style={[
                styles.base,
                {
                    backgroundColor: bgColor(),
                    borderColor: borderColor(),
                    borderWidth: v === 'secondary' || v === 'deny' ? 1 : 0,
                },
                style,
            ]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={textColor()} />
            ) : (
                <View style={styles.row}>
                    {icon}
                    <Text style={[styles.text, { color: textColor(), marginLeft: icon ? 8 : 0 }]}>{title}</Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 22,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    text: {
        fontFamily: Fonts.body,
        fontSize: 15,
        fontWeight: '700',
    },
});
