import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    rightElement?: React.ReactNode;
}

export function Input({ label, icon, rightElement, style, ...props }: InputProps) {
    return (
        <View style={styles.wrapper}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.container, style as any]}>
                {icon && (
                    <Ionicons name={icon} size={22} color={Colors.light.textSecondary} style={styles.icon} />
                )}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.light.textTertiary}
                    {...props}
                />
                {rightElement}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        minHeight: 56,
        paddingVertical: 10,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.light.text,
        minHeight: 36,
    },
});
