import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { AlertCircle } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    optional?: boolean;
    error?: string;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
}

export function Input({ label, optional, error, icon, rightElement, style, multiline, onFocus, onBlur, ...props }: InputProps) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    const inputRef = useRef<TextInput>(null);
    const [focused, setFocused] = useState(false);

    const borderColor = error ? c.errorBorder : focused ? c.primary : c.divider;

    return (
        <View style={styles.wrapper}>
            {label && (
                <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
                    {optional && <Text style={[styles.optional, { color: c.textTertiary }]}>  (optional)</Text>}
                </View>
            )}
            <Pressable
                onPress={() => inputRef.current?.focus()}
                style={[
                    styles.container,
                    {
                        backgroundColor: c.card,
                        borderColor,
                        borderWidth: focused && !error ? 2 : 1,
                        paddingHorizontal: focused && !error ? 15 : 16,
                        alignItems: multiline ? 'flex-start' : 'center',
                        minHeight: multiline ? 88 : 48,
                    },
                    style as any,
                ]}
            >
                {icon && <View style={styles.icon}>{icon}</View>}
                <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: c.text, textAlignVertical: multiline ? 'top' : 'center' }]}
                    placeholderTextColor={c.textTertiary}
                    multiline={multiline}
                    onFocus={(e) => { setFocused(true); onFocus?.(e); }}
                    onBlur={(e) => { setFocused(false); onBlur?.(e); }}
                    {...props}
                />
                {rightElement}
            </Pressable>
            {error && (
                <View style={styles.errorRow}>
                    <AlertCircle size={13} color={c.error} strokeWidth={2} />
                    <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { marginBottom: 16 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    label: { fontFamily: Fonts.body, fontSize: 12, fontWeight: '600' },
    optional: { fontFamily: Fonts.body, fontSize: 12, fontWeight: '500' },
    container: {
        flexDirection: 'row',
        borderRadius: 12,
        paddingVertical: 12,
    },
    icon: { marginRight: 10, marginTop: 1 },
    input: { flex: 1, fontFamily: Fonts.body, fontSize: 14, fontWeight: '500', minHeight: 22, padding: 0 },
    errorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 5 },
    errorText: { fontFamily: Fonts.body, fontSize: 11.5, fontWeight: '500' },
});
