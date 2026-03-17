import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    rightElement?: React.ReactNode;
}

export function Input({ label, icon, rightElement, style, ...props }: InputProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const inputRef = useRef<TextInput>(null);

    return (
        <View style={styles.wrapper}>
            {label && (
                <Text style={[styles.label, { color: Colors[colorScheme].textSecondary }]}>
                    {label}
                </Text>
            )}
            <Pressable
                onPress={() => inputRef.current?.focus()}
                style={[
                    styles.container,
                    {
                        backgroundColor: Colors[colorScheme].card,
                        borderColor: Colors[colorScheme].border
                    },
                    style as any
                ]}
            >
                {icon && (
                    <Ionicons
                        name={icon}
                        size={22}
                        color={Colors[colorScheme].textSecondary}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: Colors[colorScheme].text }]}
                    placeholderTextColor={Colors[colorScheme].textTertiary}
                    {...props}
                />
                {rightElement}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        minHeight: 52,
        paddingVertical: 10,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        minHeight: 36,
    },
});
