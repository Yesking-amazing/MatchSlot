import AsyncStorage from '@react-native-async-storage/async-storage';

const MY_MATCH_IDS_KEY = 'match_slot_my_match_ids';

/**
 * Get the list of match IDs created by this user (stored locally)
 */
export async function getMyMatchIds(): Promise<string[]> {
    try {
        const jsonValue = await AsyncStorage.getItem(MY_MATCH_IDS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to load my match IDs', e);
        return [];
    }
}

/**
 * Save a new match ID to the local list
 */
export async function saveMyMatchId(id: string): Promise<void> {
    try {
        const currentIds = await getMyMatchIds();
        if (!currentIds.includes(id)) {
            const newIds = [...currentIds, id];
            await AsyncStorage.setItem(MY_MATCH_IDS_KEY, JSON.stringify(newIds));
        }
    } catch (e) {
        console.error('Failed to save my match ID', e);
    }
}

/**
 * Remove a match ID from the local list
 */
export async function removeMyMatchId(id: string): Promise<void> {
    try {
        const currentIds = await getMyMatchIds();
        const newIds = currentIds.filter(matchId => matchId !== id);
        await AsyncStorage.setItem(MY_MATCH_IDS_KEY, JSON.stringify(newIds));
    } catch (e) {
        console.error('Failed to remove my match ID', e);
    }
}
