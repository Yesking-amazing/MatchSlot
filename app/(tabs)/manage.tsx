import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ManageSkeleton } from '@/components/ui/SkeletonLoader';
import { Colors } from '@/constants/Colors';
import { copyLinkToClipboard } from '@/lib/shareLink';
import { useAuth } from '@/contexts/AuthContext';
import { getMyMatchIds, removeMyMatchId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots, Slot, SlotStatus } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { SafeAreaView } from 'react-native-safe-area-context';

// Results Modal Component
interface ResultsModalProps {
    visible: boolean;
    slot: Slot | null;
    onClose: () => void;
    onSave: (slotId: string, homeScore: number, awayScore: number, notes: string) => void;
}

function ResultsModal({ visible, slot, onClose, onSave }: ResultsModalProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const modalStyles = getModalStyles(colorScheme);
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');
    const [notes, setNotes] = useState('');

    React.useEffect(() => {
        if (slot) {
            setHomeScore(slot.home_score?.toString() || '');
            setAwayScore(slot.away_score?.toString() || '');
            setNotes(slot.result_notes || '');
        }
    }, [slot]);

    const handleSave = () => {
        if (!slot) return;
        const home = parseInt(homeScore) || 0;
        const away = parseInt(awayScore) || 0;
        onSave(slot.id, home, away, notes);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <Text style={modalStyles.title}>Save Match Result</Text>

                    <View style={modalStyles.scoreRow}>
                        <View style={modalStyles.scoreInput}>
                            <Text style={modalStyles.scoreLabel}>Home</Text>
                            <TextInput
                                style={modalStyles.scoreField}
                                value={homeScore}
                                onChangeText={setHomeScore}
                                keyboardType="number-pad"
                                placeholder="0"
                                maxLength={2}
                            />
                        </View>
                        <Text style={modalStyles.scoreSeparator}>-</Text>
                        <View style={modalStyles.scoreInput}>
                            <Text style={modalStyles.scoreLabel}>Away</Text>
                            <TextInput
                                style={modalStyles.scoreField}
                                value={awayScore}
                                onChangeText={setAwayScore}
                                keyboardType="number-pad"
                                placeholder="0"
                                maxLength={2}
                            />
                        </View>
                    </View>

                    <TextInput
                        style={modalStyles.notesInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Match notes (optional)"
                        multiline
                        numberOfLines={3}
                    />

                    <View style={modalStyles.buttonRow}>
                        <Pressable style={modalStyles.cancelButton} onPress={onClose}>
                            <Text style={modalStyles.cancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable style={modalStyles.saveButton} onPress={handleSave}>
                            <Text style={modalStyles.saveText}>Save Result</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const getModalStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: Colors[colorScheme].backgroundAlt,
        borderRadius: 20,
        padding: 24,
        maxWidth: 340,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors[colorScheme].text,
        textAlign: 'center',
        marginBottom: 20,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 20,
    },
    scoreInput: {
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 14,
        color: Colors[colorScheme].textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    scoreField: {
        width: 80,
        height: 60,
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        color: Colors[colorScheme].text,
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
        borderRadius: 16,
        backgroundColor: Colors[colorScheme].card,
    },
    scoreSeparator: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors[colorScheme].text,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
        borderRadius: 16,
        padding: 12,
        fontSize: 16,
        color: Colors[colorScheme].text,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
        backgroundColor: Colors[colorScheme].card,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        backgroundColor: Colors[colorScheme].secondary,
        minWidth: 100,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        color: Colors[colorScheme].textSecondary,
    },
    saveButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        backgroundColor: Colors[colorScheme].primary,
        minWidth: 100,
        shadowColor: Colors[colorScheme].primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        color: '#fff',
    },
});

// Slot status badge config
const getSlotBadgeConfig = (status: SlotStatus, colorScheme: 'light' | 'dark') => {
    switch (status) {
        case 'OPEN':
            return {
                icon: 'radio-button-on' as const,
                color: Colors[colorScheme].success,
                bg: 'rgba(34,197,94,0.12)',
                label: 'Awaiting Booking',
            };
        case 'HELD':
            return {
                icon: 'pause-circle' as const,
                color: '#FFA500',
                bg: 'rgba(255,165,0,0.12)',
                label: 'Held',
            };
        case 'PENDING_APPROVAL':
            return {
                icon: 'hourglass' as const,
                color: Colors[colorScheme].warning,
                bg: 'rgba(251,191,36,0.12)',
                label: 'Pending',
            };
        case 'BOOKED':
            return {
                icon: 'checkmark-circle' as const,
                color: Colors[colorScheme].primary,
                bg: colorScheme === 'dark' ? 'rgba(74,222,128,0.15)' : 'rgba(27,139,78,0.12)',
                label: 'Booked',
            };
        case 'REJECTED':
            return {
                icon: 'close-circle' as const,
                color: Colors[colorScheme].error,
                bg: 'rgba(239,68,68,0.12)',
                label: 'Rejected',
            };
        default:
            return {
                icon: 'ellipse' as const,
                color: Colors[colorScheme].textSecondary,
                bg: 'rgba(168,162,158,0.08)',
                label: status,
            };
    }
};

export default function ManageScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);
    const { user } = useAuth();
    const [offers, setOffers] = useState<MatchOfferWithSlots[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Results modal state
    const [resultsModalVisible, setResultsModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

    const loadOffers = async () => {
        try {
            if (!user) { setLoading(false); setRefreshing(false); return; }
            // Fetch all match offers with their slots
            const myMatchIds = await getMyMatchIds(user.id);

            if (myMatchIds.length === 0) {
                setOffers([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            const { data: offersData, error: offersError } = await supabase
                .from('match_offers')
                .select('*')
                .in('id', myMatchIds)
                .order('created_at', { ascending: false });

            if (offersError) throw offersError;

            if (offersData) {
                // Fetch slots for each offer
                const offersWithSlots = await Promise.all(
                    offersData.map(async (offer) => {
                        const { data: slotsData, error: slotsError } = await supabase
                            .from('slots')
                            .select('*')
                            .eq('match_offer_id', offer.id)
                            .order('start_time', { ascending: true });

                        if (slotsError) throw slotsError;

                        return {
                            ...offer,
                            slots: slotsData || [],
                        };
                    })
                );

                setOffers(offersWithSlots);
            }
        } catch (e: any) {
            console.error('Load offers error:', e);
            console.error('Error details:', JSON.stringify(e, null, 2));
            Alert.alert(
                'Error Loading Matches',
                e.message || 'Failed to connect to database. Make sure your database is set up.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadOffers();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadOffers();
    };

    const handleShareLink = (shareToken: string) => {
        copyLinkToClipboard(shareToken);
    };

    const handleDeleteOffer = async (offerId: string) => {
        Alert.alert(
            'Delete Offer',
            'Are you sure you want to delete this offer? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('match_offers')
                                .delete()
                                .eq('id', offerId);

                            if (error) throw error;

                            await removeMyMatchId(user!.id, offerId);
                            Alert.alert('Success', 'Offer deleted successfully');
                            loadOffers();
                        } catch (e: any) {
                            Alert.alert('Error', 'Failed to delete offer: ' + e.message);
                        }
                    },
                },
            ]
        );
    };

    const handleSaveResults = async (slotId: string, homeScore: number, awayScore: number, notes: string) => {
        try {
            const { error } = await supabase
                .from('slots')
                .update({
                    home_score: homeScore,
                    away_score: awayScore,
                    result_notes: notes,
                    result_saved_at: new Date().toISOString(),
                })
                .eq('id', slotId);

            if (error) throw error;

            Alert.alert('Success', 'Match result saved!');
            setResultsModalVisible(false);
            setSelectedSlot(null);
            loadOffers();
        } catch (e: any) {
            Alert.alert('Error', 'Failed to save result: ' + e.message);
        }
    };

    const openResultsModal = (slot: Slot) => {
        setSelectedSlot(slot);
        setResultsModalVisible(true);
    };

    const isMatchPast = (slot: Slot) => {
        return new Date(slot.end_time) < new Date();
    };

    const canSaveResults = (slot: Slot) => {
        return slot.status === 'BOOKED' && isMatchPast(slot);
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ManageSkeleton />
            </SafeAreaView>
        );
    }

    if (offers.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrap}>
                        <Ionicons name="football-outline" size={44} color={Colors[colorScheme].primary} />
                    </View>
                    <Text style={styles.emptyTitle}>No Match Offers Yet</Text>
                    <Text style={styles.emptySubtitle}>Create your first match offer and share it with other coaches to start scheduling games</Text>
                    <Button
                        title="Create Match Offer"
                        onPress={() => router.push('/match/create')}
                        style={{ marginTop: 12 }}
                    />
                </View>

                {/* FAB */}
                <AnimatedPressable
                    style={styles.fab}
                    onPress={() => router.push('/match/create')}
                    scaleTo={0.9}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </AnimatedPressable>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ResultsModal
                visible={resultsModalVisible}
                slot={selectedSlot}
                onClose={() => {
                    setResultsModalVisible(false);
                    setSelectedSlot(null);
                }}
                onSave={handleSaveResults}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors[colorScheme].primary}
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>My Match Offers</Text>
                    <Text style={styles.subtitle}>
                        {offers.length} {offers.length === 1 ? 'offer' : 'offers'}
                    </Text>
                </View>

                {offers.map((offer) => (
                    <View key={offer.id} style={styles.scoreboardCard}>
                        {/* Scoreboard Header — dark strip */}
                        <View style={styles.scoreboardHeader}>
                            <View style={styles.scoreboardTeamSide}>
                                <Text style={styles.scoreboardTeamLabel}>HOST</Text>
                                <Text style={styles.scoreboardTeamName} numberOfLines={1}>
                                    {offer.host_club || 'Your Team'}
                                </Text>
                            </View>
                            <View style={styles.scoreboardCenter}>
                                <Text style={styles.scoreboardFormat}>{offer.format}</Text>
                                <Text style={styles.scoreboardAge}>{offer.age_group}</Text>
                            </View>
                            <View style={[styles.scoreboardTeamSide, { alignItems: 'flex-end' }]}>
                                <Text style={styles.scoreboardTeamLabel}>SLOTS</Text>
                                <Text style={styles.scoreboardSlotCount}>
                                    {offer.slots.filter(s => s.status === 'BOOKED').length}/{offer.slots.length}
                                </Text>
                            </View>
                        </View>

                        {/* Status LED strip */}
                        <View style={[styles.scoreboardLED, {
                            backgroundColor: offer.status === 'OPEN' ? 'rgba(34,197,94,0.12)' :
                                offer.status === 'PENDING_APPROVAL' ? 'rgba(251,191,36,0.12)' : 'rgba(168,162,158,0.08)',
                        }]}>
                            <View style={[styles.ledDot, {
                                backgroundColor: offer.status === 'OPEN' ? Colors[colorScheme].success :
                                    offer.status === 'PENDING_APPROVAL' ? Colors[colorScheme].warning : Colors[colorScheme].textSecondary,
                            }]} />
                            <Text style={[styles.ledText, {
                                color: offer.status === 'OPEN' ? Colors[colorScheme].success :
                                    offer.status === 'PENDING_APPROVAL' ? Colors[colorScheme].warning : Colors[colorScheme].textSecondary,
                            }]}>
                                {offer.status === 'PENDING_APPROVAL' ? 'AWAITING APPROVAL' : offer.status}
                            </Text>
                            <View style={styles.ledRight}>
                                <Ionicons name="location-outline" size={12} color={Colors[colorScheme].textSecondary} />
                                <Text style={styles.ledLocation} numberOfLines={1}>{offer.location}</Text>
                            </View>
                        </View>

                        {/* Slots body */}
                        <View style={styles.scoreboardBody}>
                            <Text style={styles.scoreboardSlotsTitle}>
                                {offer.duration} min  •  {offer.slots.length} {offer.slots.length === 1 ? 'slot' : 'slots'}
                            </Text>
                            {offer.slots.map((slot) => {
                                const badge = getSlotBadgeConfig(slot.status, colorScheme);
                                return (
                                    <AnimatedPressable
                                        key={slot.id}
                                        onPress={() => router.push(`/match/detail/${slot.id}` as any)}
                                        scaleTo={0.98}
                                    >
                                        <View style={styles.slotRow}>
                                            <View style={styles.slotInfo}>
                                                <Ionicons name="time-outline" size={16} color={Colors[colorScheme].textSecondary} />
                                                <Text style={styles.slotTime}>
                                                    {formatDateTime(slot.start_time)}
                                                </Text>
                                            </View>
                                            <View style={styles.slotStatusRow}>
                                                <View style={[styles.slotStatusPill, { backgroundColor: badge.bg }]}>
                                                    <Ionicons name={badge.icon} size={12} color={badge.color} />
                                                    <Text style={[styles.slotStatusText, { color: badge.color }]}>
                                                        {badge.label}
                                                    </Text>
                                                </View>
                                                {slot.guest_club && (
                                                    <Text style={styles.guestClub}> vs {slot.guest_club}</Text>
                                                )}
                                            </View>

                                            {slot.result_saved_at ? (
                                                <View style={styles.resultBadge}>
                                                    <Text style={styles.resultText}>
                                                        {slot.home_score} - {slot.away_score}
                                                    </Text>
                                                </View>
                                            ) : canSaveResults(slot) ? (
                                                <View style={styles.saveResultButton}>
                                                    <Ionicons name="create-outline" size={14} color={Colors[colorScheme].primary} />
                                                    <Text style={styles.saveResultText}>Result</Text>
                                                </View>
                                            ) : (
                                                <Ionicons name="chevron-forward" size={16} color={Colors[colorScheme].textTertiary} />
                                            )}
                                        </View>
                                    </AnimatedPressable>
                                );
                            })}
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            {offer.status === 'PENDING_APPROVAL' ? (
                                <>
                                    <View style={[styles.actionButton, styles.pendingButton]}>
                                        <Ionicons name="hourglass-outline" size={20} color={Colors[colorScheme].warning} />
                                        <Text style={[styles.actionButtonText, { color: Colors[colorScheme].warning }]}>
                                            Waiting for Approver
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => handleDeleteOffer(offer.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors[colorScheme].error} />
                                    </TouchableOpacity>
                                </>
                            ) : offer.status === 'OPEN' ? (
                                <>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleShareLink(offer.share_token)}
                                    >
                                        <Ionicons name="share-outline" size={20} color={Colors[colorScheme].primary} />
                                        <Text style={styles.actionButtonText}>Share Link</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => handleDeleteOffer(offer.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors[colorScheme].error} />
                                        <Text style={[styles.actionButtonText, styles.closeButtonText]}>
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={[styles.actionButton, { borderColor: Colors[colorScheme].textSecondary }]}>
                                        <Ionicons name="checkmark-done" size={20} color={Colors[colorScheme].textSecondary} />
                                        <Text style={[styles.actionButtonText, { color: Colors[colorScheme].textSecondary }]}>
                                            {offer.status === 'CLOSED' ? 'Match Booked' : 'Cancelled'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => handleDeleteOffer(offer.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors[colorScheme].error} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Floating Action Button */}
            <AnimatedPressable
                style={styles.fab}
                onPress={() => router.push('/match/create')}
                scaleTo={0.9}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </AnimatedPressable>
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
        paddingBottom: 100,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors[colorScheme].text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: Colors[colorScheme].textSecondary,
    },

    // Enhanced empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors[colorScheme].secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors[colorScheme].text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors[colorScheme].textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },

    // Scoreboard Card
    scoreboardCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: Colors[colorScheme].card,
        shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(27,139,78,0.12)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 4,
    },
    scoreboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colorScheme === 'dark' ? '#0A1F12' : '#1A2E1A',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    scoreboardTeamSide: {
        flex: 1,
    },
    scoreboardTeamLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    scoreboardTeamName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scoreboardCenter: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    scoreboardFormat: {
        fontSize: 20,
        fontWeight: '800',
        color: '#4ADE80',
        letterSpacing: 1,
    },
    scoreboardAge: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        marginTop: 1,
    },
    scoreboardSlotCount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#4ADE80',
    },
    scoreboardLED: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    ledDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    ledText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    ledRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        justifyContent: 'flex-end',
    },
    ledLocation: {
        fontSize: 11,
        color: Colors[colorScheme].textSecondary,
        maxWidth: 140,
    },
    scoreboardBody: {
        padding: 16,
    },
    scoreboardSlotsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors[colorScheme].textSecondary,
        marginBottom: 10,
    },
    slotRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        flexWrap: 'wrap',
        gap: 8,
    },
    slotInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 120,
    },
    slotTime: {
        fontSize: 14,
        color: Colors[colorScheme].text,
    },
    slotStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    slotStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    slotStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    guestClub: {
        fontSize: 13,
        color: Colors[colorScheme].textSecondary,
    },
    resultBadge: {
        backgroundColor: Colors[colorScheme].primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    resultText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    saveResultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors[colorScheme].primary,
    },
    saveResultText: {
        color: Colors[colorScheme].primary,
        fontSize: 12,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: Colors[colorScheme].secondary,
        borderWidth: 1,
        borderColor: Colors[colorScheme].primary,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors[colorScheme].primary,
    },
    closeButton: {
        borderColor: Colors[colorScheme].error,
        flex: 0,
        paddingHorizontal: 12,
    },
    pendingButton: {
        borderColor: Colors[colorScheme].warning,
        backgroundColor: 'rgba(251,191,36,0.08)',
    },
    closeButtonText: {
        color: Colors[colorScheme].error,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors[colorScheme].primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors[colorScheme].primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
});
