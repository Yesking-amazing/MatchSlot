import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Approval, MatchOffer, Slot } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Approver Screen - US-AP-01, US-AP-02, US-AP-03
 * Approve or reject match booking requests
 */
export default function ApprovalScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const [approval, setApproval] = useState<Approval | null>(null);
    const [slot, setSlot] = useState<Slot | null>(null);
    const [offer, setOffer] = useState<MatchOffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [decisionNotes, setDecisionNotes] = useState('');

    useEffect(() => {
        loadApprovalDetails();
    }, [token]);

    const loadApprovalDetails = async () => {
        try {
            // Load approval by token
            const { data: approvalData, error: approvalError } = await supabase
                .from('approvals')
                .select('*')
                .eq('approval_token', token)
                .single();

            if (approvalError) throw approvalError;

            if (!approvalData) {
                Alert.alert('Not Found', 'This approval request does not exist.');
                return;
            }

            // Load slot
            const { data: slotData, error: slotError } = await supabase
                .from('slots')
                .select('*')
                .eq('id', approvalData.slot_id)
                .single();

            if (slotError) throw slotError;

            // Load offer
            const { data: offerData, error: offerError } = await supabase
                .from('match_offers')
                .select('*')
                .eq('id', approvalData.match_offer_id)
                .single();

            if (offerError) throw offerError;

            setApproval(approvalData);
            setSlot(slotData);
            setOffer(offerData);
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', 'Failed to load approval details');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!approval || !slot || !offer) return;

        Alert.alert(
            'Approve Match',
            'Are you sure you want to approve this match booking? This will confirm the booking and lock all other slots.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setProcessing(true);
                        try {
                            // 1. Update approval status (US-AP-02)
                            const { error: approvalError } = await supabase
                                .from('approvals')
                                .update({
                                    status: 'APPROVED',
                                    decision_at: new Date().toISOString(),
                                    decision_notes: decisionNotes || null,
                                })
                                .eq('id', approval.id);

                            if (approvalError) throw approvalError;

                            // 2. Update slot to BOOKED (US-AP-02)
                            const { error: slotError } = await supabase
                                .from('slots')
                                .update({
                                    status: 'BOOKED',
                                })
                                .eq('id', slot.id);

                            if (slotError) throw slotError;

                            // 3. Update all other slots for this offer to REJECTED (US-AP-02)
                            const { error: rejectOthersError } = await supabase
                                .from('slots')
                                .update({
                                    status: 'REJECTED',
                                })
                                .eq('match_offer_id', offer.id)
                                .neq('id', slot.id)
                                .in('status', ['OPEN', 'HELD', 'PENDING_APPROVAL']);

                            if (rejectOthersError) throw rejectOthersError;

                            // 4. Close the match offer
                            const { error: offerError } = await supabase
                                .from('match_offers')
                                .update({
                                    status: 'CLOSED',
                                })
                                .eq('id', offer.id);

                            if (offerError) throw offerError;

                            // 5. Create notification for guest (US-SYS-03)
                            if (slot.guest_contact) {
                                await supabase.from('notifications').insert({
                                    recipient_email: slot.guest_contact,
                                    recipient_type: 'GUEST',
                                    notification_type: 'APPROVED',
                                    match_offer_id: offer.id,
                                    slot_id: slot.id,
                                    subject: 'Match Booking Approved!',
                                    message: `Great news! Your match booking for ${offer.age_group} ${offer.format} at ${offer.location} has been approved.`,
                                    sent: false,
                                });
                            }

                            // 6. Create notification for host (US-SYS-03)
                            if (offer.host_contact) {
                                await supabase.from('notifications').insert({
                                    recipient_email: offer.host_contact,
                                    recipient_type: 'HOST',
                                    notification_type: 'APPROVED',
                                    match_offer_id: offer.id,
                                    slot_id: slot.id,
                                    subject: 'Match Booking Confirmed',
                                    message: `The match with ${slot.guest_club} has been approved and confirmed.`,
                                    sent: false,
                                });
                            }

                            Alert.alert(
                                'Approved!',
                                'The match booking has been approved. Both teams have been notified.',
                                [
                                    { text: 'OK', onPress: () => router.push('/') }
                                ]
                            );
                        } catch (e: any) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to approve booking: ' + e.message);
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const handleReject = async () => {
        if (!approval || !slot || !offer) return;

        if (!decisionNotes.trim()) {
            Alert.alert('Note Required', 'Please provide a reason for rejecting this booking.');
            return;
        }

        Alert.alert(
            'Reject Match',
            'Are you sure you want to reject this match booking? The slot will become available again.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessing(true);
                        try {
                            // 1. Update approval status (US-AP-03)
                            const { error: approvalError } = await supabase
                                .from('approvals')
                                .update({
                                    status: 'REJECTED',
                                    decision_at: new Date().toISOString(),
                                    decision_notes: decisionNotes,
                                })
                                .eq('id', approval.id);

                            if (approvalError) throw approvalError;

                            // 2. Update slot back to OPEN (US-AP-03)
                            const { error: slotError } = await supabase
                                .from('slots')
                                .update({
                                    status: 'OPEN',
                                    held_by_session: null,
                                    held_at: null,
                                    guest_name: null,
                                    guest_club: null,
                                    guest_contact: null,
                                    guest_notes: null,
                                })
                                .eq('id', slot.id);

                            if (slotError) throw slotError;

                            // 3. Create notification for guest (US-AP-03, US-SYS-03)
                            if (slot.guest_contact) {
                                await supabase.from('notifications').insert({
                                    recipient_email: slot.guest_contact,
                                    recipient_type: 'GUEST',
                                    notification_type: 'REJECTED',
                                    match_offer_id: offer.id,
                                    slot_id: slot.id,
                                    subject: 'Match Booking Not Approved',
                                    message: `Unfortunately, your match booking request was not approved. Reason: ${decisionNotes}`,
                                    sent: false,
                                });
                            }

                            // 4. Create notification for host (US-SYS-03)
                            if (offer.host_contact) {
                                await supabase.from('notifications').insert({
                                    recipient_email: offer.host_contact,
                                    recipient_type: 'HOST',
                                    notification_type: 'REJECTED',
                                    match_offer_id: offer.id,
                                    slot_id: slot.id,
                                    subject: 'Match Booking Rejected',
                                    message: `The booking request from ${slot.guest_club} was rejected. The slot is now available again.`,
                                    sent: false,
                                });
                            }

                            Alert.alert(
                                'Rejected',
                                'The match booking has been rejected. The guest has been notified and the slot is available again.',
                                [
                                    { text: 'OK', onPress: () => router.push('/') }
                                ]
                            );
                        } catch (e: any) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to reject booking: ' + e.message);
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { 
            weekday: 'long',
            day: 'numeric', 
            month: 'long',
            year: 'numeric',
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

    if (!approval || !slot || !offer) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
                <Text style={styles.errorTitle}>Not Found</Text>
                <Text style={styles.errorSubtitle}>This approval request does not exist.</Text>
            </View>
        );
    }

    if (approval.status !== 'PENDING') {
        return (
            <View style={styles.centerContainer}>
                <Ionicons 
                    name={approval.status === 'APPROVED' ? 'checkmark-circle' : 'close-circle'} 
                    size={64} 
                    color={approval.status === 'APPROVED' ? Colors.light.success : Colors.light.error} 
                />
                <Text style={styles.errorTitle}>Already Processed</Text>
                <Text style={styles.errorSubtitle}>
                    This approval request has already been {approval.status.toLowerCase()}.
                </Text>
                {approval.decision_notes && (
                    <Card style={styles.decisionCard}>
                        <Text style={styles.decisionLabel}>Decision Notes:</Text>
                        <Text style={styles.decisionText}>{approval.decision_notes}</Text>
                    </Card>
                )}
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{
                title: 'Approve Match',
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                headerBackTitleVisible: false,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: Colors.light.background }
            }} />

            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <Card style={styles.headerCard}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="mail-open" size={40} color={Colors.light.primary} />
                        </View>
                        <Text style={styles.headerTitle}>Match Booking Approval</Text>
                        <Text style={styles.headerSubtitle}>
                            A team is requesting to book a match slot. Please review the details below.
                        </Text>
                    </Card>

                    {/* Match Details */}
                    <Text style={styles.sectionTitle}>Match Details</Text>
                    <Card style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Ionicons name="football" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Match Type</Text>
                                <Text style={styles.detailValue}>
                                    {offer.age_group} • {offer.format}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="calendar" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Date & Time</Text>
                                <Text style={styles.detailValue}>
                                    {formatDateTime(slot.start_time)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="location" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Location</Text>
                                <Text style={styles.detailValue}>{offer.location}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="timer" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Duration</Text>
                                <Text style={styles.detailValue}>{offer.duration} minutes</Text>
                            </View>
                        </View>
                    </Card>

                    {/* Guest Team Details */}
                    <Text style={styles.sectionTitle}>Requesting Team</Text>
                    <Card style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Ionicons name="person" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Coach Name</Text>
                                <Text style={styles.detailValue}>{slot.guest_name}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="shield" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Club</Text>
                                <Text style={styles.detailValue}>{slot.guest_club}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="call" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Contact</Text>
                                <Text style={styles.detailValue}>{slot.guest_contact}</Text>
                            </View>
                        </View>

                        {slot.guest_notes && (
                            <View style={styles.detailRow}>
                                <Ionicons name="document-text" size={24} color={Colors.light.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Notes</Text>
                                    <Text style={styles.detailValue}>{slot.guest_notes}</Text>
                                </View>
                            </View>
                        )}
                    </Card>

                    {/* Host Details */}
                    <Text style={styles.sectionTitle}>Host Coach</Text>
                    <Card style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Ionicons name="person-circle" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Host</Text>
                                <Text style={styles.detailValue}>
                                    {offer.host_name}
                                    {offer.host_club && ` (${offer.host_club})`}
                                </Text>
                            </View>
                        </View>
                    </Card>

                    {/* Decision Notes */}
                    <Text style={styles.sectionTitle}>Your Decision</Text>
                    <Input
                        placeholder="Add notes (optional for approval, required for rejection)"
                        value={decisionNotes}
                        onChangeText={setDecisionNotes}
                        multiline
                        numberOfLines={4}
                    />
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title="Reject"
                        onPress={handleReject}
                        loading={processing}
                        style={styles.rejectButton}
                    />
                    <Button
                        title="Approve"
                        onPress={handleApprove}
                        loading={processing}
                        style={styles.approveButton}
                    />
                </View>
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
        paddingBottom: 120,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 16,
        textAlign: 'center',
    },
    errorSubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    decisionCard: {
        padding: 16,
        marginTop: 16,
        backgroundColor: '#F5F5F5',
    },
    decisionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 8,
    },
    decisionText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    headerCard: {
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#F0F9FF',
        borderColor: Colors.light.primary,
        borderWidth: 1,
    },
    headerIcon: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginTop: 8,
        marginBottom: 12,
    },
    detailsCard: {
        padding: 16,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        backgroundColor: Colors.light.background,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: Colors.light.error,
    },
    approveButton: {
        flex: 1,
        backgroundColor: Colors.light.success,
    },
});
