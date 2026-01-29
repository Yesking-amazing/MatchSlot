import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { copyLinkToClipboard } from '@/lib/shareLink';
import { getMyMatchIds, removeMyMatchId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots, SlotStatus } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ManageScreen() {
    const [offers, setOffers] = useState<MatchOfferWithSlots[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    if (offers.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="football-outline" size={64} color={Colors.light.textSecondary} />
                <Text style={styles.emptyTitle}>No Match Offers Yet</Text>
                <Text style={styles.emptySubtitle}>Create your first match offer to get started</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
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
                                backgroundColor: offer.status === 'OPEN' ? '#E8F5E9' : '#FFEBEE'
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: offer.status === 'OPEN' ? '#2E7D32' : '#C62828'
                                }]}>
                                    {offer.status}
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
                                </View>
                            ))}
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleShareLink(offer.share_token)}
                            >
                                <Ionicons name="share-outline" size={20} color={Colors.light.primary} />
                                <Text style={styles.actionButtonText}>Share Link</Text>
                            </TouchableOpacity>

                            {offer.status === 'OPEN' && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.closeButton]}
                                    onPress={() => handleDeleteOffer(offer.id)}
                                >
                                    <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                                    <Text style={[styles.actionButtonText, styles.closeButtonText]}>
                                        Delete Offer
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Card>
                ))}
            </ScrollView>
        </View>
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
    },
    slotInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
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
        backgroundColor: Colors.light.background,
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
    },
    closeButtonText: {
        color: Colors.light.error,
    },
});
