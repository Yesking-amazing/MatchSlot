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
            <View style={[styles.container, style]}>
                {icon && (
                    <Ionicons name={icon} size={24} color={Colors.light.textSecondary} style={styles.icon} />
                )}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={Colors.light.textSecondary}
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
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.text,
        marginBottom: 8,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.card, // White bg usually
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 16,
        paddingHorizontal: 16,
        minHeight: 64, // Matches the chunky look
        paddingVertical: 12,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.light.text,
        minHeight: 40,
    },
});
