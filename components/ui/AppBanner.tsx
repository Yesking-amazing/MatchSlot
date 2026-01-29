import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AppBannerProps {
    deepLink?: string; // e.g., "matchslot://offer/token123"
}

/**
 * Smart App Banner - Shows "Open in App" or "Get the App" on web
 * Only renders on web platform
 */
export function AppBanner({ deepLink }: AppBannerProps) {
    const [dismissed, setDismissed] = useState(false);

    // Only show on web
    if (Platform.OS !== 'web' || dismissed) {
        return null;
    }

    const handleOpenInApp = async () => {
        if (deepLink) {
            // Try to open the app via deep link
            try {
                await Linking.openURL(deepLink);
            } catch (e) {
                // App not installed - could redirect to App Store
                console.log('Could not open app:', e);
            }
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
                    <Text style={styles.appTagline}>Book matches faster in the app</Text>
                </View>
            </View>
            <View style={styles.actions}>
                {deepLink && (
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

const styles = StyleSheet.create({
    banner: {
        backgroundColor: '#1a1a2e',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
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
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    appTagline: {
        color: '#aaa',
        fontSize: 12,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    openButton: {
        backgroundColor: Colors.light.primary,
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
        borderColor: '#666',
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
        color: '#888',
        fontSize: 16,
    },
});
