import AsyncStorage from '@react-native-async-storage/async-storage';

function matchIdsKey(userId: string) {
    return `match_slot_my_match_ids_${userId}`;
}

function clubNameKey(userId: string) {
    return `match_slot_club_name_${userId}`;
}

/**
 * Get the list of match IDs created by this user (stored locally)
 */
export async function getMyMatchIds(userId: string): Promise<string[]> {
    try {
        const jsonValue = await AsyncStorage.getItem(matchIdsKey(userId));
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to load my match IDs', e);
        return [];
    }
}

/**
 * Save a new match ID to the local list
 */
export async function saveMyMatchId(userId: string, id: string): Promise<void> {
    try {
        const currentIds = await getMyMatchIds(userId);
        if (!currentIds.includes(id)) {
            const newIds = [...currentIds, id];
            await AsyncStorage.setItem(matchIdsKey(userId), JSON.stringify(newIds));
        }
    } catch (e) {
        console.error('Failed to save my match ID', e);
    }
}

/**
 * Remove a match ID from the local list
 */
export async function removeMyMatchId(userId: string, id: string): Promise<void> {
    try {
        const currentIds = await getMyMatchIds(userId);
        const newIds = currentIds.filter(matchId => matchId !== id);
        await AsyncStorage.setItem(matchIdsKey(userId), JSON.stringify(newIds));
    } catch (e) {
        console.error('Failed to remove my match ID', e);
    }
}

/**
 * Get the saved club name
 */
export async function getClubName(userId: string): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(clubNameKey(userId));
    } catch (e) {
        console.error('Failed to load club name', e);
        return null;
    }
}

/**
 * Save the club name
 */
export async function saveClubName(userId: string, name: string): Promise<void> {
    try {
        await AsyncStorage.setItem(clubNameKey(userId), name);
    } catch (e) {
        console.error('Failed to save club name', e);
    }
}
