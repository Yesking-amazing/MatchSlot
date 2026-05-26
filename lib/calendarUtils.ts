import { Alert, Platform } from 'react-native';

let ExpoCalendar: any = null;

try {
    ExpoCalendar = require('expo-calendar');
} catch {
    console.warn('expo-calendar not available');
}

/**
 * Add a booked match to the user's default calendar
 */
export async function addMatchToCalendar(
    startTime: string,
    endTime: string,
    title: string,
    location: string,
    notes?: string,
): Promise<boolean> {
    if (!ExpoCalendar || Platform.OS === 'web') {
        Alert.alert('Not Available', 'Calendar export is not available on this device.');
        return false;
    }

    try {
        // Request permission
        const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow calendar access in your device settings to add matches.');
            return false;
        }

        // Find a writable calendar
        const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
        const defaultCal = calendars.find(
            (c: any) => c.allowsModifications && (c.isPrimary || c.source?.name === 'iCloud' || c.source?.name === 'Default')
        ) || calendars.find((c: any) => c.allowsModifications);

        if (!defaultCal) {
            Alert.alert('No Calendar', 'Could not find a writable calendar on your device.');
            return false;
        }

        await ExpoCalendar.createEventAsync(defaultCal.id, {
            title,
            startDate: new Date(startTime),
            endDate: new Date(endTime),
            location,
            notes: notes || undefined,
            alarms: [{ relativeOffset: -60 }], // 1 hour before
        });

        return true;
    } catch (e: any) {
        console.error('Calendar export error:', e);
        Alert.alert('Error', 'Failed to add event to calendar.');
        return false;
    }
}
