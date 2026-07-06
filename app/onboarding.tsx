import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { markOnboardingComplete } from '@/lib/storage';
import { Stack, router } from 'expo-router';
import { ArrowRight, CalendarPlus, Check, Send, Trophy } from 'lucide-react-native';
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
    Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
    titleKey: string;
    descKey: string;
}

const PAGES: OnboardingPage[] = [
    {
        Icon: CalendarPlus,
        titleKey: 'onboarding.createTitle',
        descKey: 'onboarding.createDesc',
    },
    {
        Icon: Send,
        titleKey: 'onboarding.shareTitle',
        descKey: 'onboarding.shareDesc',
    },
    {
        Icon: Trophy,
        titleKey: 'onboarding.trackTitle',
        descKey: 'onboarding.trackDesc',
    },
];

export default function OnboardingScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
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
            <View style={[styles.container, { backgroundColor: c.background }]}>
                <View style={styles.skipRow}>
                    {!isLast && (
                        <Pressable onPress={handleFinish} hitSlop={12}>
                            <Text style={[styles.skipText, { color: c.textMuted }]}>
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
                    renderItem={({ item }) => {
                        const Icon = item.Icon;
                        return (
                            <View style={[styles.page, { width }]}>
                                <View style={[styles.iconSquare, { backgroundColor: c.primaryTint }]}>
                                    <Icon size={44} color={c.primary} strokeWidth={2} />
                                </View>
                                <Text style={[styles.title, { color: c.text }]}>
                                    {t(item.titleKey)}
                                </Text>
                                <Text style={[styles.desc, { color: c.textMuted }]}>
                                    {t(item.descKey)}
                                </Text>
                            </View>
                        );
                    }}
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
                                        backgroundColor: i === currentIndex ? c.primary : c.divider,
                                        width: i === currentIndex ? 24 : 8,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* Button */}
                    <Button
                        title={isLast ? t('onboarding.getStarted') : t('onboarding.next')}
                        onPress={handleNext}
                        icon={
                            isLast ? (
                                <Check size={17} color={c.primaryInk} strokeWidth={2.5} />
                            ) : (
                                <ArrowRight size={17} color={c.primaryInk} strokeWidth={2.5} />
                            )
                        }
                    />
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
        fontFamily: Fonts.body,
        fontSize: 14,
        fontWeight: '600',
    },
    page: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconSquare: {
        width: 96,
        height: 96,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 36,
    },
    title: {
        fontFamily: Fonts.display,
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 14,
        letterSpacing: -0.8,
    },
    desc: {
        fontFamily: Fonts.body,
        fontSize: 15,
        lineHeight: 23,
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
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
});
