import { AppBanner } from '@/components/ui/AppBanner';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots, Slot, SlotStatus } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Guest Coach View - US-GC-01, US-GC-02
 * View match offer via shareable link and select a slot
 */
export default function OfferViewScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const [offer, setOffer] = useState<MatchOfferWithSlots | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

    useEffect(() => {
        loadOffer();

        // Set up real-time subscription to slot changes
        const channel = supabase
            .channel('slot-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'slots',
                },
                () => {
                    loadOffer();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [token]);

    const loadOffer = async () => {
        try {
            // Find offer by share token
            const { data: offerData, error: offerError } = await supabase
                .from('match_offers')
                .select('*')
                .eq('share_token', token)
                .single();

            if (offerError) throw offerError;

            if (!offerData) {
                Alert.alert('Not Found', 'This match offer does not exist.');
                return;
            }

            // Check if offer is open
            if (offerData.status !== 'OPEN') {
                Alert.alert('Closed', 'This match offer is no longer accepting bookings.');
            }

            // Load slots
            const { data: slotsData, error: slotsError } = await supabase
                .from('slots')
                .select('*')
                .eq('match_offer_id', offerData.id)
                .order('start_time', { ascending: true });

            if (slotsError) throw slotsError;

            setOffer({
                ...offerData,
                slots: slotsData || [],
            });
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', 'Failed to load match offer');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = async (slotId: string) => {
        if (!offer) return;

        // Check if slot is still available
        const slot = offer.slots.find(s => s.id === slotId);
        if (!slot || slot.status !== 'OPEN') {
            Alert.alert('Unavailable', 'This slot is no longer available. Please select another slot.');
            loadOffer(); // Refresh to get latest status
            return;
        }

        // Navigate to booking form
        router.push({
            pathname: '/offer/book/[slotId]',
            params: { slotId, token },
        });
    };

    const isSlotAvailable = (slot: Slot) => {
        return slot.status === 'OPEN' && offer?.status === 'OPEN';
    };

    const getStatusColor = (status: SlotStatus) => {
        switch (status) {
            case 'OPEN':
                return Colors.light.success;
            case 'HELD':
            case 'PENDING_APPROVAL':
                return '#FFA500';
            case 'BOOKED':
                return Colors.light.primary;
            default:
                return Colors.light.textSecondary;
        }
    };

    const getStatusLabel = (status: SlotStatus) => {
        switch (status) {
            case 'OPEN':
                return 'Available';
            case 'HELD':
                return 'Held (Temporarily)';
            case 'PENDING_APPROVAL':
                return 'Pending Approval';
            case 'BOOKED':
                return 'Booked';
            case 'REJECTED':
                return 'No Longer Available';
            default:
                return status;
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    const formatDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const durationMins = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
        return `${durationMins} mins`;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    if (!offer) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
                <Text style={styles.errorTitle}>Offer Not Found</Text>
                <Text style={styles.errorSubtitle}>This match offer does not exist or has been removed.</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{
                title: 'Match Offer',
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                headerBackTitleVisible: false,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: Colors.light.background }
            }} />

            <AppBanner deepLink={`matchslot://offer/${token}`} />

            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Match Details Header */}
                    <Card style={styles.detailsCard}>
                        <View style={styles.iconHeader}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="football" size={32} color={Colors.light.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.mainTitle}>
                                    {offer.age_group} Football Match
                                </Text>
                                <Text style={styles.formatText}>{offer.format}</Text>
                            </View>
                            {offer.status !== 'OPEN' && (
                                <View style={styles.closedBadge}>
                                    <Text style={styles.closedBadgeText}>CLOSED</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailRow}>
                                <Ionicons name="location" size={20} color={Colors.light.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Location</Text>
                                    <Text style={styles.detailValue}>{offer.location}</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="timer" size={20} color={Colors.light.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Duration</Text>
                                    <Text style={styles.detailValue}>{offer.duration} minutes</Text>
                                </View>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="person" size={20} color={Colors.light.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Host</Text>
                                    <Text style={styles.detailValue}>
                                        {offer.host_name}
                                        {offer.host_club && ` (${offer.host_club})`}
                                    </Text>
                                </View>
                            </View>

                            {offer.notes && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.detailLabel}>Additional Info</Text>
                                        <Text style={styles.detailValue}>{offer.notes}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </Card>

                    {/* Time Slots */}
                    <Text style={styles.sectionTitle}>Available Time Slots</Text>
                    <Text style={styles.sectionSubtitle}>
                        Select a time slot that works for your team
                    </Text>

                    {offer.slots.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No time slots available</Text>
                        </Card>
                    ) : (
                        offer.slots.map((slot) => {
                            const available = isSlotAvailable(slot);
                            const { date, time } = formatDateTime(slot.start_time);
                            const endTime = formatDateTime(slot.end_time).time;

                            return (
                                <Card
                                    key={slot.id}
                                    style={[
                                        styles.slotCard,
                                        !available && styles.slotCardDisabled
                                    ]}
                                >
                                    <View style={styles.slotContent}>
                                        <View style={styles.slotTimeInfo}>
                                            <Text style={[styles.slotDate, !available && styles.textDisabled]}>
                                                {date}
                                            </Text>
                                            <Text style={[styles.slotTime, !available && styles.textDisabled]}>
                                                {time} - {endTime}
                                            </Text>
                                            <View style={styles.slotMeta}>
                                                <View style={[styles.statusDot, { backgroundColor: getStatusColor(slot.status) }]} />
                                                <Text style={[styles.statusLabel, { color: getStatusColor(slot.status) }]}>
                                                    {getStatusLabel(slot.status)}
                                                </Text>
                                            </View>
                                        </View>

                                        {available ? (
                                            <TouchableOpacity
                                                style={styles.selectButton}
                                                onPress={() => handleSelectSlot(slot.id)}
                                            >
                                                <Text style={styles.selectButtonText}>Select</Text>
                                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={styles.unavailableIcon}>
                                                <Ionicons name="lock-closed" size={24} color={Colors.light.textSecondary} />
                                            </View>
                                        )}
                                    </View>
                                </Card>
                            );
                        })
                    )}
                </ScrollView>
            </View>
        </>
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
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 16,
    },
    errorSubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    detailsCard: {
        padding: 20,
        marginBottom: 24,
    },
    iconHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 4,
    },
    formatText: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },
    closedBadge: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    closedBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#C62828',
    },
    detailsGrid: {
        gap: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginBottom: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 16,
    },
    emptyCard: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    slotCard: {
        padding: 16,
        marginBottom: 12,
    },
    slotCardDisabled: {
        opacity: 0.6,
    },
    slotContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    slotTimeInfo: {
        flex: 1,
    },
    slotDate: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 4,
    },
    slotTime: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
    },
    textDisabled: {
        color: Colors.light.textSecondary,
    },
    slotMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.light.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    unavailableIcon: {
        padding: 12,
    },
});
