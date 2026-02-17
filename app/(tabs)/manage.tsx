import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { copyLinkToClipboard } from '@/lib/shareLink';
import { getMyMatchIds, removeMyMatchId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots, Slot, SlotStatus } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Results Modal Component
interface ResultsModalProps {
    visible: boolean;
    slot: Slot | null;
    onClose: () => void;
    onSave: (slotId: string, homeScore: number, awayScore: number, notes: string) => void;
}

function ResultsModal({ visible, slot, onClose, onSave }: ResultsModalProps) {
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

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: Colors.light.backgroundAlt,
        borderRadius: 16,
        padding: 24,
        maxWidth: 340,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.light.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
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
        color: Colors.light.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    scoreField: {
        width: 80,
        height: 60,
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        color: Colors.light.text,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        backgroundColor: Colors.light.card,
    },
    scoreSeparator: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.light.text,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: Colors.light.text,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
        backgroundColor: Colors.light.card,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.08)',
        minWidth: 100,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        color: Colors.light.textSecondary,
    },
    saveButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        backgroundColor: Colors.light.primary,
        minWidth: 100,
        shadowColor: Colors.light.primary,
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

export default function ManageScreen() {
    const [offers, setOffers] = useState<MatchOfferWithSlots[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Results modal state
    const [resultsModalVisible, setResultsModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

    const loadOffers = async () => {
        try {
            // Fetch all match offers with their slots
            const myMatchIds = await getMyMatchIds();

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

                            await removeMyMatchId(offerId);
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

    const getStatusColor = (status: SlotStatus) => {
        switch (status) {
            case 'OPEN':
                return Colors.light.success;
            case 'HELD':
                return '#FFA500';
            case 'PENDING_APPROVAL':
                return '#FFD700';
            case 'BOOKED':
                return Colors.light.primary;
            case 'REJECTED':
                return Colors.light.error;
            default:
                return Colors.light.textSecondary;
        }
    };

    const getStatusLabel = (status: SlotStatus) => {
        switch (status) {
            case 'OPEN':
                return 'Open';
            case 'HELD':
                return 'Held';
            case 'PENDING_APPROVAL':
                return 'Pending';
            case 'BOOKED':
                return 'Booked';
            case 'REJECTED':
                return 'Rejected';
            default:
                return status;
        }
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
            <SafeAreaView style={styles.centerContainer} edges={['top']}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </SafeAreaView>
        );
    }

    if (offers.length === 0) {
        return (
            <SafeAreaView style={styles.centerContainer} edges={['top']}>
                <Ionicons name="football-outline" size={64} color={Colors.light.textSecondary} />
                <Text style={styles.emptyTitle}>No Match Offers Yet</Text>
                <Text style={styles.emptySubtitle}>Create your first match offer to get started</Text>
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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>My Match Offers</Text>
                    <Text style={styles.subtitle}>
                        {offers.length} {offers.length === 1 ? 'offer' : 'offers'}
                    </Text>
                </View>

                {offers.map((offer) => (
                    <Card key={offer.id} style={styles.offerCard}>
                        {/* Offer Header */}
                        <View style={styles.offerHeader}>
                            <View style={styles.offerHeaderLeft}>
                                <Text style={styles.offerTitle}>
                                    {offer.age_group} • {offer.format}
                                </Text>
                                <Text style={styles.offerLocation}>
                                    <Ionicons name="location-outline" size={14} />
                                    {' '}{offer.location}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, {
                                backgroundColor: offer.status === 'OPEN' ? 'rgba(52,211,153,0.15)' :
                                    offer.status === 'PENDING_APPROVAL' ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)'
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: offer.status === 'OPEN' ? Colors.light.success :
                                        offer.status === 'PENDING_APPROVAL' ? Colors.light.warning : Colors.light.error
                                }]}>
                                    {offer.status === 'PENDING_APPROVAL' ? 'AWAITING APPROVAL' : offer.status}
                                </Text>
                            </View>
                        </View>

                        {/* Offer Details */}
                        <View style={styles.offerDetails}>
                            <Text style={styles.offerDetailText}>
                                Duration: {offer.duration} mins
                            </Text>
                            <Text style={styles.offerDetailText}>
                                {offer.slots.length} {offer.slots.length === 1 ? 'slot' : 'slots'}
                            </Text>
                        </View>

                        {/* Slots */}
                        <View style={styles.slotsContainer}>
                            <Text style={styles.slotsHeader}>Time Slots:</Text>
                            {offer.slots.map((slot) => (
                                <View key={slot.id} style={styles.slotRow}>
                                    <View style={styles.slotInfo}>
                                        <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
                                        <Text style={styles.slotTime}>
                                            {formatDateTime(slot.start_time)}
                                        </Text>
                                    </View>
                                    <View style={styles.slotStatusRow}>
                                        <View style={[styles.slotStatusDot, { backgroundColor: getStatusColor(slot.status) }]} />
                                        <Text style={[styles.slotStatusText, { color: getStatusColor(slot.status) }]}>
                                            {getStatusLabel(slot.status)}
                                        </Text>
                                        {slot.guest_club && (
                                            <Text style={styles.guestClub}> - {slot.guest_club}</Text>
                                        )}
                                    </View>

                                    {/* Show results or save results button */}
                                    {slot.result_saved_at ? (
                                        <View style={styles.resultBadge}>
                                            <Text style={styles.resultText}>
                                                {slot.home_score} - {slot.away_score}
                                            </Text>
                                        </View>
                                    ) : canSaveResults(slot) && (
                                        <TouchableOpacity
                                            style={styles.saveResultButton}
                                            onPress={() => openResultsModal(slot)}
                                        >
                                            <Ionicons name="create-outline" size={14} color={Colors.light.primary} />
                                            <Text style={styles.saveResultText}>Result</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            {offer.status === 'PENDING_APPROVAL' ? (
                                <>
                                    <View style={[styles.actionButton, styles.pendingButton]}>
                                        <Ionicons name="hourglass-outline" size={20} color={Colors.light.warning} />
                                        <Text style={[styles.actionButtonText, { color: Colors.light.warning }]}>
                                            Waiting for Approver
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => handleDeleteOffer(offer.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                                    </TouchableOpacity>
                                </>
                            ) : offer.status === 'OPEN' ? (
                                <>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleShareLink(offer.share_token)}
                                    >
                                        <Ionicons name="share-outline" size={20} color={Colors.light.primary} />
                                        <Text style={styles.actionButtonText}>Share Link</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => handleDeleteOffer(offer.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                                        <Text style={[styles.actionButtonText, styles.closeButtonText]}>
                                            Delete
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={[styles.actionButton, { borderColor: Colors.light.textSecondary }]}>
                                        <Ionicons name="checkmark-done" size={20} color={Colors.light.textSecondary} />
                                        <Text style={[styles.actionButtonText, { color: Colors.light.textSecondary }]}>
                                            {offer.status === 'CLOSED' ? 'Match Booked' : 'Cancelled'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => handleDeleteOffer(offer.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </Card>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    offerCard: {
        padding: 16,
        marginBottom: 16,
    },
    offerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    offerHeaderLeft: {
        flex: 1,
    },
    offerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 4,
    },
    offerLocation: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    offerDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    offerDetailText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    slotsContainer: {
        marginBottom: 16,
    },
    slotsHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
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
        color: Colors.light.text,
    },
    slotStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    slotStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    slotStatusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    guestClub: {
        fontSize: 13,
        color: Colors.light.textSecondary,
    },
    resultBadge: {
        backgroundColor: Colors.light.primary,
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
        borderColor: Colors.light.primary,
    },
    saveResultText: {
        color: Colors.light.primary,
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
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: Colors.light.primary,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.primary,
    },
    closeButton: {
        borderColor: Colors.light.error,
        flex: 0,
        paddingHorizontal: 12,
    },
    pendingButton: {
        borderColor: Colors.light.warning,
        backgroundColor: 'rgba(251,191,36,0.08)',
    },
    closeButtonText: {
        color: Colors.light.error,
    },
});
