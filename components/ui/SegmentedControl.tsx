import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    options: string[];
    value: string;
    onChange: (v: string) => void;
    style?: any;
}

export function SegmentedControl({ options, value, onChange, style }: Props) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    const trackBg = scheme === 'dark' ? '#101A14' : '#EAE5D6';
    const thumbBg = scheme === 'dark' ? '#22352A' : '#FFFFFF';

    return (
        <View style={[styles.track, { backgroundColor: trackBg }, style]}>
            {options.map((opt) => {
                const active = opt === value;
                return (
                    <Pressable
                        key={opt}
                        onPress={() => onChange(opt)}
                        style={[
                            styles.segment,
                            active && {
                                backgroundColor: thumbBg,
                                ...(scheme === 'light' && {
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.06,
                                    shadowRadius: 1.5,
                                }),
                            },
                        ]}
                    >
                        <Text style={[styles.label, { color: active ? c.text : c.textMuted, fontWeight: active ? '700' : '600' }]}>
                            {opt}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    track: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 2 },
    segment: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    label: { fontFamily: Fonts.body, fontSize: 13 },
});
