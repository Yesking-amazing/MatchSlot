import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getClubName, saveClubName } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);
    const { user } = useAuth();
    const [clubName, setClubName] = useState('');
    const [savedClubName, setSavedClubName] = useState('');
    const [editingClub, setEditingClub] = useState(false);

    const userEmail = user?.email ?? null;

    useEffect(() => {
        if (user) {
            getClubName(user.id).then(saved => {
                if (saved) {
                    setClubName(saved);
                    setSavedClubName(saved);
                }
            });
        }
    }, [user]);

    const handleSaveClubName = async () => {
        if (!user) return;
        const trimmed = clubName.trim();
        await saveClubName(user.id, trimmed);
        setSavedClubName(trimmed);
        setEditingClub(false);
    };

    const handleLogout = async () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) Alert.alert('Error', error.message);
                    else router.replace('/(auth)/login');
                },
            },
        ]);
    };

    const handleFeedback = () => Linking.openURL('mailto:support@matchslot.app?subject=MatchSlot%20Feedback');
    const handlePrivacy = () => Linking.openURL('https://matchslot.app/privacy');

    const SettingsRow = ({ icon, label, rightElement, onPress, destructive = false }: any) => (
        <TouchableOpacity style={styles.settingsRow} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
            <View style={styles.settingsRowLeft}>
                <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
                    <Ionicons
                        name={icon}
                        size={20}
                        color={destructive ? Colors[colorScheme].error : Colors[colorScheme].primary}
                    />
                </View>
                <Text style={[styles.settingsLabel, destructive && styles.settingsLabelDestructive]}>{label}</Text>
            </View>
            {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme].textTertiary} />)}
        </TouchableOpacity>
    );

    const initial = userEmail ? userEmail.charAt(0).toUpperCase() : 'C';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                </View>

                {/* Hero Card */}
                <View style={styles.heroCard}>
                    <View style={styles.heroInner}>
                        <View style={styles.avatarRing}>
                            <View style={styles.avatarInner}>
                                <Text style={styles.avatarInitials}>{initial}</Text>
                            </View>
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>Coach</Text>
                            <Text style={styles.profileEmail} numberOfLines={1}>{userEmail || 'Loading...'}</Text>
                        </View>
                    </View>
                </View>

                {/* Club Name Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Club Info</Text>
                    <Card style={styles.settingsCard}>
                        {editingClub ? (
                            <View style={styles.editClubRow}>
                                <View style={styles.editClubInput}>
                                    <Input
                                        placeholder="Enter your club name"
                                        value={clubName}
                                        onChangeText={setClubName}
                                        autoFocus
                                    />
                                </View>
                                <View style={styles.editClubButtons}>
                                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveClubName}>
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => {
                                            setClubName(savedClubName);
                                            setEditingClub(false);
                                        }}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <SettingsRow
                                icon="shield-outline"
                                label={savedClubName || 'Add Club Name'}
                                onPress={() => setEditingClub(true)}
                                rightElement={
                                    <Ionicons name="create-outline" size={20} color={Colors[colorScheme].textTertiary} />
                                }
                            />
                        )}
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Support & Feedback</Text>
                    <Card style={styles.settingsCard}>
                        <SettingsRow icon="chatbubble-outline" label="Send Feedback" onPress={handleFeedback} />
                        <View style={styles.divider} />
                        <SettingsRow icon="shield-checkmark-outline" label="Privacy Policy" onPress={handlePrivacy} />
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Account</Text>
                    <Card style={styles.settingsCard}>
                        <SettingsRow icon="log-out-outline" label="Log Out" onPress={handleLogout} destructive />
                    </Card>
                </View>

                <Text style={styles.versionText}>MatchSlot v1.9.1</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors[colorScheme].background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: Colors[colorScheme].text,
        letterSpacing: -0.5,
    },

    // Hero card
    heroCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 28,
        shadowColor: '#1B8B4E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.15,
        shadowRadius: 20,
        elevation: 6,
    },
    heroInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
        backgroundColor: colorScheme === 'dark' ? '#0A1F12' : '#E8F5E9',
    },
    avatarRing: {
        width: 66,
        height: 66,
        borderRadius: 22,
        backgroundColor: '#1B8B4E',
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInner: {
        width: 62,
        height: 62,
        borderRadius: 20,
        backgroundColor: colorScheme === 'dark' ? '#122A1A' : '#C8E6C9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1B8B4E',
    },
    profileInfo: {
        flex: 1,
        gap: 3,
    },
    profileName: {
        fontSize: 19,
        fontWeight: '700',
        color: colorScheme === 'dark' ? '#fff' : Colors[colorScheme].text,
    },
    profileEmail: {
        fontSize: 13,
        color: colorScheme === 'dark' ? 'rgba(255,255,255,0.6)' : Colors[colorScheme].textSecondary,
    },

    // Sections
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors[colorScheme].textTertiary,
        letterSpacing: 0.8,
        marginBottom: 10,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    settingsCard: {
        padding: 0,
        overflow: 'hidden',
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingsRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors[colorScheme].secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerDestructive: {
        backgroundColor: 'rgba(239,68,68,0.1)',
    },
    settingsLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors[colorScheme].text,
    },
    settingsLabelDestructive: {
        color: Colors[colorScheme].error,
    },
    divider: {
        height: 1,
        backgroundColor: Colors[colorScheme].border,
        marginLeft: 64,
    },

    // Club name editing
    editClubRow: {
        padding: 16,
        gap: 12,
    },
    editClubInput: {
        marginBottom: -16, // offset Input wrapper's marginBottom
    },
    editClubButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    saveButton: {
        flex: 1,
        backgroundColor: Colors[colorScheme].primary,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: Colors[colorScheme].background,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
    },
    cancelButtonText: {
        color: Colors[colorScheme].text,
        fontSize: 15,
        fontWeight: '600',
    },

    versionText: {
        textAlign: 'center',
        fontSize: 13,
        color: Colors[colorScheme].textTertiary,
        marginTop: 8,
    },
});
