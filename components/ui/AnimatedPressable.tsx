import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    scaleTo?: number;     // How much it should shrink/grow on press (e.g., 0.95)
    opacityTo?: number;   // Opacity level on press
}

export function AnimatedPressable({
    children,
    style,
    scaleTo = 0.96,
    opacityTo = 0.85,
    onPressIn,
    onPressOut,
    ...props
}: AnimatedPressableProps) {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    const handlePressIn = (e: any) => {
        scale.value = withSpring(scaleTo, {
            mass: 0.6,
            damping: 18,
            stiffness: 250,
        });
        opacity.value = withTiming(opacityTo, { duration: 150 });
        if (onPressIn) onPressIn(e);
    };

    const handlePressOut = (e: any) => {
        scale.value = withSpring(1, {
            mass: 0.6,
            damping: 14,
            stiffness: 200,
        });
        opacity.value = withTiming(1, { duration: 150 });
        if (onPressOut) onPressOut(e);
    };

    return (
        <AnimatedPressableComponent
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[animatedStyle, style]}
            {...props}
        >
            {children}
        </AnimatedPressableComponent>
    );
}
