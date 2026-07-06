import { Colors } from '@/constants/Colors';
import React, { useEffect } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonBoxProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: any;
}

function SkeletonBox({ width, height, borderRadius = 10, style }: SkeletonBoxProps) {
    const scheme = useColorScheme() ?? 'light';
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: scheme === 'dark' ? '#101A14' : '#FBF9F2',
                },
                animatedStyle,
                style,
            ]}
        />
    );
}

export function HomeSkeleton() {
    const scheme = useColorScheme() ?? 'light';
    return (
        <View style={[styles.container, { backgroundColor: Colors[scheme].background }]}>
            {/* Top bar */}
            <View style={styles.topbar}>
                <SkeletonBox width={130} height={20} />
                <SkeletonBox width={34} height={34} borderRadius={17} />
            </View>
            {/* Greeting */}
            <SkeletonBox width={110} height={14} style={{ marginTop: 18, marginBottom: 8 }} />
            <SkeletonBox width={200} height={30} borderRadius={8} />
            {/* Stat strip */}
            <View style={styles.statStrip}>
                {[0, 1, 2].map((i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                        <SkeletonBox width={40} height={24} borderRadius={6} />
                        <SkeletonBox width={54} height={10} borderRadius={4} />
                    </View>
                ))}
            </View>
            {/* Quick actions */}
            <View style={styles.actionsRow}>
                <SkeletonBox width="48%" height={70} borderRadius={16} />
                <SkeletonBox width="48%" height={70} borderRadius={16} />
            </View>
            {/* Agenda */}
            <SkeletonBox width={90} height={11} style={{ marginTop: 26, marginBottom: 14 }} />
            {[0, 1, 2].map((i) => (
                <View key={i} style={styles.agendaRow}>
                    <SkeletonBox width={44} height={30} borderRadius={6} />
                    <View style={{ flex: 1, gap: 6 }}>
                        <SkeletonBox width="70%" height={14} />
                        <SkeletonBox width="45%" height={12} />
                    </View>
                </View>
            ))}
        </View>
    );
}

export function ManageSkeleton() {
    const scheme = useColorScheme() ?? 'light';
    return (
        <View style={[styles.container, { backgroundColor: Colors[scheme].background }]}>
            <View style={styles.topbar}>
                <SkeletonBox width={120} height={26} borderRadius={8} />
                <SkeletonBox width={120} height={32} borderRadius={10} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 18, marginBottom: 8 }}>
                {[0, 1, 2, 3].map((i) => <SkeletonBox key={i} width={64} height={30} borderRadius={999} />)}
            </View>
            {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.offerCard, { backgroundColor: Colors[scheme].card, borderColor: Colors[scheme].border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <SkeletonBox width={30} height={30} borderRadius={9} />
                        <View style={{ flex: 1, gap: 6 }}>
                            <SkeletonBox width="55%" height={14} />
                            <SkeletonBox width="40%" height={11} />
                        </View>
                        <SkeletonBox width={72} height={24} borderRadius={999} />
                    </View>
                    <SkeletonBox width="100%" height={12} style={{ marginTop: 14 }} />
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 22, paddingTop: 8 },
    topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statStrip: { flexDirection: 'row', marginTop: 22, paddingVertical: 16, gap: 8 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    agendaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
    offerCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
});
