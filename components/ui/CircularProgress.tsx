import { Colors } from '@/constants/Colors';
import React, { useEffect } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
    value: number;       // The actual value (e.g., booked slots)
    maxValue: number;    // The total possible value (e.g., total slots)
    radius?: number;     // Size of the ring
    strokeWidth?: number;// Thickness of the ring
    duration?: number;   // Animation duration
    delay?: number;      // Animation delay
    colorScheme?: 'light' | 'dark'; // Override system color scheme
}

export function CircularProgress({
    value,
    maxValue,
    radius = 35,
    strokeWidth = 6,
    duration = 1000,
    delay = 500,
    colorScheme: forcedColorScheme,
}: CircularProgressProps) {
    const systemColorScheme = useColorScheme() ?? 'light';
    const colorScheme = forcedColorScheme || systemColorScheme;
    const theme = Colors[colorScheme];

    // Calculations
    const circumference = 2 * Math.PI * radius;
    // Handle edge case where maxValue is 0
    const targetPercentage = maxValue > 0 ? value / maxValue : 0;
    // Reanimated values
    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        // Animate the progress ring
        animatedProgress.value = withDelay(
            delay,
            withTiming(targetPercentage, {
                duration,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Standard smooth ease
            })
        );
    }, [value, maxValue]);

    // Animated props for the SVG Circle
    const animatedCircleProps = useAnimatedProps(() => {
        const strokeDashoffset = circumference - circumference * animatedProgress.value;
        return {
            strokeDashoffset,
        };
    });

    return (
        <View style={[styles.container, { width: radius * 2 + strokeWidth, height: radius * 2 + strokeWidth }]}>
            <Svg style={StyleSheet.absoluteFill}>
                <Defs>
                    <LinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <Stop offset="0%" stopColor={theme.primary} />
                        <Stop offset="100%" stopColor={theme.accent} />
                    </LinearGradient>
                </Defs>

                {/* Background Track Circle */}
                <Circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke={theme.border}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Animated Progress Circle */}
                <AnimatedCircle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    stroke="url(#gradient)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    animatedProps={animatedCircleProps}
                    strokeLinecap="round"
                    // Rotate -90 degrees so the stroke starts at the top (12 o'clock)
                    transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
                />
            </Svg>

            {/* Center Content */}
            <View style={StyleSheet.absoluteFill}>
                <View style={styles.centerContainer}>
                    <Text style={[styles.valueText, { color: theme.text }]}>{value}</Text>
                    <Text style={[styles.totalText, { color: theme.textSecondary }]}>/ {maxValue}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueText: {
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 24,
    },
    totalText: {
        fontSize: 10,
        fontWeight: '600',
    },
});
