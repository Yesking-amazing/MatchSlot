import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

// Using web links so anyone can access without the app
const USE_UNIVERSAL_LINKS = true;

/**
 * Generate the shareable link URL for a match offer
 * US-HC-02: Generate shareable link
 */
export function generateShareableLink(shareToken: string): string {
  if (USE_UNIVERSAL_LINKS) {
    // Your deployed web URL
    const baseUrl = 'https://sage-kitsune-885b75.netlify.app';
    return `${baseUrl}/offer/${shareToken}`;
  } else {
    // For TestFlight and early production - works immediately!
    // Format: matchslot://offer/token
    return `matchslot://offer/${shareToken}`;
  }
}

/**
 * Copy link to clipboard and show confirmation
 */
export async function copyLinkToClipboard(shareToken: string): Promise<void> {
  const link = generateShareableLink(shareToken);
  await Clipboard.setStringAsync(link);
  Alert.alert('Link Copied!', 'Share this link with other coaches to let them book a slot.');
}

/**
 * Generate approval link for approvers
 */
export function generateApprovalLink(approvalToken: string): string {
  if (USE_UNIVERSAL_LINKS) {
    const baseUrl = 'https://sage-kitsune-885b75.netlify.app';
    return `${baseUrl}/approve/${approvalToken}`;
  } else {
    return `matchslot://approve/${approvalToken}`;
  }
}

/**
 * Share link using native share dialog (if available)
 */
export async function shareLink(shareToken: string, matchDetails: string): Promise<void> {
  const link = generateShareableLink(shareToken);

  // For web/expo, we'll just copy to clipboard
  // In production with native modules, you could use react-native-share
  await copyLinkToClipboard(shareToken);
}
