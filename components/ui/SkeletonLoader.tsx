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

function SkeletonBox({ width, height, borderRadius = 12, style }: SkeletonBoxProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor: colorScheme === 'dark' ? '#44403C' : '#E7E5E4',
                },
                animatedStyle,
                style,
            ]}
        />
    );
}

export function HomeSkeleton() {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);

    return (
        <View style={styles.container}>
            {/* Hero band skeleton */}
            <View style={styles.heroBand}>
                <SkeletonBox width={200} height={28} borderRadius={8} style={{ marginBottom: 8 }} />
                <SkeletonBox width={160} height={16} borderRadius={6} style={{ marginBottom: 24 }} />

                {/* Stat cards */}
                <View style={styles.statsRow}>
                    {[0, 1, 2].map((i) => (
                        <View key={i} style={styles.statCard}>
                            <SkeletonBox width={36} height={36} borderRadius={18} />
                            <SkeletonBox width={44} height={28} borderRadius={8} style={{ marginTop: 8 }} />
                            <SkeletonBox width={56} height={10} borderRadius={4} style={{ marginTop: 6 }} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Body skeleton */}
            <View style={styles.body}>
                {/* Quick actions */}
                <SkeletonBox width={120} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
                <View style={styles.actionsRow}>
                    {[0, 1].map((i) => (
                        <View key={i} style={styles.actionCard}>
                            <SkeletonBox width={54} height={54} borderRadius={16} />
                            <SkeletonBox width={80} height={14} borderRadius={6} style={{ marginTop: 8 }} />
                            <SkeletonBox width={64} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                        </View>
                    ))}
                </View>

                {/* List cards */}
                <SkeletonBox width={150} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
                {[0, 1, 2].map((i) => (
                    <View key={i} style={styles.listCard}>
                        <SkeletonBox width={72} height={36} borderRadius={12} />
                        <View style={{ flex: 1, gap: 6, marginLeft: 12 }}>
                            <SkeletonBox width="80%" height={14} borderRadius={6} />
                            <SkeletonBox width="60%" height={12} borderRadius={6} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

export function ManageSkeleton() {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getManageStyles(colorScheme);

    return (
        <View style={styles.container}>
            <SkeletonBox width={180} height={28} borderRadius={8} style={{ marginBottom: 6 }} />
            <SkeletonBox width={60} height={16} borderRadius={6} style={{ marginBottom: 24 }} />

            {[0, 1, 2].map((i) => (
                <View key={i} style={styles.offerCard}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ gap: 6 }}>
                            <SkeletonBox width={140} height={18} borderRadius={6} />
                            <SkeletonBox width={100} height={14} borderRadius={6} />
                        </View>
                        <SkeletonBox width={80} height={26} borderRadius={12} />
                    </View>
                    {/* Details */}
                    <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors[colorScheme].border }}>
                        <SkeletonBox width={100} height={14} borderRadius={6} />
                        <SkeletonBox width={60} height={14} borderRadius={6} />
                    </View>
                    {/* Slots */}
                    <SkeletonBox width={80} height={14} borderRadius={6} style={{ marginBottom: 8 }} />
                    {[0, 1].map((j) => (
                        <View key={j} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                            <SkeletonBox width={130} height={14} borderRadius={6} />
                            <SkeletonBox width={80} height={22} borderRadius={10} />
                        </View>
                    ))}
                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                        <SkeletonBox width="70%" height={44} borderRadius={16} />
                        <SkeletonBox width={44} height={44} borderRadius={16} />
                    </View>
                </View>
            ))}
        </View>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors[colorScheme].background,
    },
    heroBand: {
        backgroundColor: colorScheme === 'dark' ? 'rgba(27,139,78,0.12)' : 'rgba(27,139,78,0.07)',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 24,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        borderRadius: 18,
        padding: 14,
        alignItems: 'center',
        backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? 'rgba(27,139,78,0.2)' : 'rgba(27,139,78,0.1)',
    },
    body: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    actionCard: {
        flex: 1,
        backgroundColor: Colors[colorScheme].card,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    listCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors[colorScheme].card,
        borderRadius: 20,
        padding: 14,
        marginBottom: 10,
    },
});

const getManageStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors[colorScheme].background,
        padding: 20,
    },
    offerCard: {
        backgroundColor: Colors[colorScheme].card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
});
