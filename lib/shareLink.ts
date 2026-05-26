import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Alert, Platform, Share } from 'react-native';
import i18n from '@/lib/i18n';

const BASE_URL = 'https://matchslot.netlify.app';

export function generateShareableLink(shareToken: string): string {
    return `${BASE_URL}/offer/${shareToken}`;
}

export function generateApprovalLink(approvalToken: string): string {
    return `${BASE_URL}/approve/${approvalToken}`;
}

export async function copyLinkToClipboard(shareToken: string): Promise<void> {
    const link = generateShareableLink(shareToken);
    await Clipboard.setStringAsync(link);
    Alert.alert(i18n.t('share.linkCopied'), i18n.t('share.linkCopiedDesc'));
}

/**
 * Native share sheet (iOS/Android) — covers WhatsApp, iMessage, email, etc.
 * Falls back to clipboard on web.
 */
export async function shareMatchLink(shareToken: string, matchDetails: string): Promise<void> {
    const link = generateShareableLink(shareToken);
    const message = `${matchDetails}\n\nBook a slot here: ${link}`;

    if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(link);
        Alert.alert(i18n.t('share.linkCopied'), i18n.t('share.linkCopiedDesc'));
        return;
    }

    try {
        await Share.share({ message, url: link });
    } catch {
        await copyLinkToClipboard(shareToken);
    }
}

/**
 * Direct WhatsApp share — only call after checking canShareWhatsApp()
 */
export async function shareViaWhatsApp(shareToken: string, matchDetails: string): Promise<void> {
    const link = generateShareableLink(shareToken);
    const message = encodeURIComponent(`${matchDetails}\n\nBook a slot here: ${link}`);
    await Linking.openURL(`whatsapp://send?text=${message}`);
}

/**
 * Returns true if WhatsApp is installed on this device
 */
export async function canShareWhatsApp(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
        return await Linking.canOpenURL('whatsapp://send');
    } catch {
        return false;
    }
}

// Keep for backwards compat
export async function shareLink(shareToken: string, matchDetails: string): Promise<void> {
    return shareMatchLink(shareToken, matchDetails);
}
