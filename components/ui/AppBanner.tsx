import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface AppBannerProps {
    deepLink?: string; // e.g., "matchslot://offer/token123"
}

/**
 * Smart App Banner - Shows "Open in App" or "Get the App" on web
 * Only renders on web platform
 */
export function AppBanner({ deepLink }: AppBannerProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);
    const [dismissed, setDismissed] = useState(false);
    const [openFailed, setOpenFailed] = useState(false);

    // Only show on web
    if (Platform.OS !== 'web' || dismissed) {
        return null;
    }

    const handleOpenInApp = () => {
        if (!deepLink) return;

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            // Use window.location.href for custom URL schemes — more reliable
            // than Linking.openURL which uses window.open and gets blocked
            const start = Date.now();
            window.location.href = deepLink;

            // If we're still here after 1.5s, the app probably isn't installed
            setTimeout(() => {
                if (document.hasFocus() && Date.now() - start >= 1400) {
                    setOpenFailed(true);
                }
            }, 1500);
        } else {
            Linking.openURL(deepLink).catch(() => setOpenFailed(true));
        }
    };

    const handleGetApp = () => {
        // Replace with your actual App Store URL when published
        const appStoreUrl = 'https://apps.apple.com/app/matchslot/id000000000';
        Linking.openURL(appStoreUrl);
    };

    return (
        <View style={styles.banner}>
            <View style={styles.appInfo}>
                <Text style={styles.appIcon}>⚽</Text>
                <View>
                    <Text style={styles.appName}>MatchSlot</Text>
                    <Text style={styles.appTagline}>
                        {openFailed ? 'App not found — get it below' : 'Book matches faster in the app'}
                    </Text>
                </View>
            </View>
            <View style={styles.actions}>
                {deepLink && !openFailed && (
                    <TouchableOpacity style={styles.openButton} onPress={handleOpenInApp}>
                        <Text style={styles.openButtonText}>Open in App</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.getButton} onPress={handleGetApp}>
                    <Text style={styles.getButtonText}>Get App</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dismissButton} onPress={() => setDismissed(true)}>
                    <Text style={styles.dismissText}>✕</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    banner: {
        backgroundColor: '#1C1917',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#44403C',
    },
    appInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    appIcon: {
        fontSize: 32,
    },
    appName: {
        color: '#FAFAF9',
        fontSize: 16,
        fontWeight: '600',
    },
    appTagline: {
        color: '#A8A29E',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    openButton: {
        backgroundColor: Colors[colorScheme].primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    openButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    getButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#78716C',
    },
    getButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    dismissButton: {
        padding: 8,
    },
    dismissText: {
        color: '#78716C',
        fontSize: 16,
    },
});
