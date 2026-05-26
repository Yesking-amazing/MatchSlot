import { Linking, Platform } from 'react-native';

/**
 * Opens a location in the platform's default maps app
 * iOS → Apple Maps, Android → system chooser (Google Maps, Waze, etc.), Web → Google Maps
 */
export function openInMaps(location: string): void {
    const encoded = encodeURIComponent(location);
    if (Platform.OS === 'ios') {
        Linking.openURL(`maps://?q=${encoded}`);
    } else if (Platform.OS === 'android') {
        Linking.openURL(`geo:0,0?q=${encoded}`);
    } else {
        Linking.openURL(`https://maps.google.com/?q=${encoded}`);
    }
}
