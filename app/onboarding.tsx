import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { markOnboardingComplete } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewToken,
} from 'react-native';

const { width } = Dimensions.get('window');

interface OnboardingPage {
    icon: keyof typeof Ionicons.glyphMap;
    titleKey: string;
    descKey: string;
    color: string;
}

const PAGES: OnboardingPage[] = [
    {
        icon: 'add-circle',
        titleKey: 'onboarding.createTitle',
        descKey: 'onboarding.createDesc',
        color: '#4ADE80',
    },
    {
        icon: 'share-social',
        titleKey: 'onboarding.shareTitle',
        descKey: 'onboarding.shareDesc',
        color: '#60A5FA',
    },
    {
        icon: 'trophy',
        titleKey: 'onboarding.trackTitle',
        descKey: 'onboarding.trackDesc',
        color: '#FBBF24',
    },
];

export default function OnboardingScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';
    const { user } = useAuth();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleFinish = async () => {
        if (user) {
            await markOnboardingComplete(user.id);
        }
        router.replace('/(tabs)');
    };

    const handleNext = () => {
        if (currentIndex < PAGES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleFinish();
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const isLast = currentIndex === PAGES.length - 1;

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
                <View style={styles.skipRow}>
                    {!isLast && (
                        <Pressable onPress={handleFinish} hitSlop={12}>
                            <Text style={[styles.skipText, { color: Colors[colorScheme].textSecondary }]}>
                                {t('onboarding.skip')}
                            </Text>
                        </Pressable>
                    )}
                </View>

                <FlatList
                    ref={flatListRef}
                    data={PAGES}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                    renderItem={({ item }) => (
                        <View style={[styles.page, { width }]}>
                            <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                                <Ionicons name={item.icon} size={64} color={item.color} />
                            </View>
                            <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
                                {t(item.titleKey)}
                            </Text>
                            <Text style={[styles.desc, { color: Colors[colorScheme].textSecondary }]}>
                                {t(item.descKey)}
                            </Text>
                        </View>
                    )}
                />

                <View style={styles.footer}>
                    {/* Dots */}
                    <View style={styles.dots}>
                        {PAGES.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: i === currentIndex
                                            ? Colors[colorScheme].primary
                                            : Colors[colorScheme].border,
                                        width: i === currentIndex ? 24 : 8,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* Button */}
                    <Pressable
                        style={[styles.button, { backgroundColor: Colors[colorScheme].primary }]}
                        onPress={handleNext}
                    >
                        <Text style={styles.buttonText}>
                            {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
                        </Text>
                        <Ionicons
                            name={isLast ? 'checkmark' : 'arrow-forward'}
                            size={20}
                            color="#fff"
                        />
                    </Pressable>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    skipRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingTop: 60,
        height: 90,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
    },
    page: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    desc: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 50,
        gap: 24,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
