import { Platform } from 'react-native';
import { saveReminderIds } from './storage';
import { supabase } from './supabase';

let ExpoNotifications: any = null;

// Gracefully load expo-notifications — won't crash if native module is missing
try {
    ExpoNotifications = require('expo-notifications');
    ExpoNotifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    // Register attendance confirmation category with Yes/No actions
    ExpoNotifications.setNotificationCategoryAsync('attendance', [
        { identifier: 'CONFIRM_YES', buttonTitle: 'Yes, I\'m coming', options: { opensAppToForeground: false } },
        { identifier: 'CONFIRM_NO', buttonTitle: 'No, I can\'t make it', options: { opensAppToForeground: true, isDestructive: true } },
    ]);
} catch {
    console.warn('expo-notifications native module not available — push notifications disabled');
}

/**
 * Request permission and register the device push token, storing it in Supabase.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
    if (!ExpoNotifications || Platform.OS === 'web') return null;

    try {
        const { status: existingStatus } = await ExpoNotifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await ExpoNotifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') return null;

        const tokenData = await ExpoNotifications.getExpoPushTokenAsync({
            projectId: '65a8eca0-e2ec-4b0d-aa80-0180cdd13da7',
        });

        const token = tokenData.data;

        await supabase.from('push_tokens').upsert(
            { user_id: userId, token, platform: Platform.OS },
            { onConflict: 'user_id,token' }
        );

        return token;
    } catch (e) {
        console.warn('Push notification registration failed:', e);
        return null;
    }
}

/**
 * Send a push notification to a user by their Supabase user_id.
 */
export async function sendPushToUser(userId: string, title: string, body: string): Promise<void> {
    try {
        const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token')
            .eq('user_id', userId);

        if (!tokens || tokens.length === 0) return;

        const messages = tokens.map(({ token }) => ({
            to: token,
            title,
            body,
            sound: 'default' as const,
        }));

        await fetch('https://exp.host/--/expoapi/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify(messages),
        });
    } catch (e) {
        console.warn('Failed to send push notification:', e);
    }
}

// ── Local Notification Scheduling ──

/**
 * Schedule a local match reminder 1 hour before kick-off
 * and an attendance confirmation the day before at 9am.
 * Returns the scheduled notification IDs.
 */
export async function scheduleMatchReminders(
    slotId: string,
    startTime: string,
    matchTitle: string,
    location: string,
): Promise<void> {
    if (!ExpoNotifications || Platform.OS === 'web') return;

    try {
        const matchDate = new Date(startTime);
        const now = new Date();
        const ids: string[] = [];

        // 1-hour reminder
        const reminderDate = new Date(matchDate.getTime() - 60 * 60 * 1000);
        if (reminderDate > now) {
            const id = await ExpoNotifications.scheduleNotificationAsync({
                content: {
                    title: '⚽ Match in 1 hour!',
                    body: `${matchTitle} at ${location}`,
                    sound: 'default',
                    data: { type: 'match_reminder', slotId },
                },
                trigger: { type: 'date', date: reminderDate },
            });
            ids.push(id);
        }

        // Day-before attendance check at 9am
        const dayBefore = new Date(matchDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        dayBefore.setHours(9, 0, 0, 0);
        if (dayBefore > now) {
            const id = await ExpoNotifications.scheduleNotificationAsync({
                content: {
                    title: '📋 Match tomorrow — still coming?',
                    body: `${matchTitle} at ${location}`,
                    sound: 'default',
                    categoryIdentifier: 'attendance',
                    data: { type: 'attendance_check', slotId },
                },
                trigger: { type: 'date', date: dayBefore },
            });
            ids.push(id);
        }

        // Store IDs so we can cancel later if needed
        if (ids.length > 0) {
            await saveReminderIds(slotId, ids);
        }
    } catch (e) {
        console.warn('Failed to schedule match reminders:', e);
    }
}

/**
 * Cancel previously scheduled reminders for a slot
 */
export async function cancelMatchReminders(slotId: string): Promise<void> {
    if (!ExpoNotifications) return;
    try {
        const { getReminderIds } = require('./storage');
        const ids = await getReminderIds(slotId);
        for (const id of ids) {
            await ExpoNotifications.cancelScheduledNotificationAsync(id);
        }
    } catch (e) {
        console.warn('Failed to cancel reminders:', e);
    }
}

/**
 * Add a listener for notification responses (tap actions).
 * Returns a subscription that should be cleaned up.
 */
export function addNotificationResponseListener(
    handler: (response: any) => void
): { remove: () => void } | null {
    if (!ExpoNotifications) return null;
    return ExpoNotifications.addNotificationResponseReceivedListener(handler);
}
