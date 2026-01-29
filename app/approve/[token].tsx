import { AppBanner } from '@/components/ui/AppBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { generateShareableLink } from '@/lib/shareLink';
import { supabase } from '@/lib/supabase';
import { Approval, MatchOffer, Slot } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Approval Screen - Handles both offer approval (pre-share) and slot approval (booking)
 * 
 * For OFFER approval (slot_id is null):
 * - Approving sets the offer status to OPEN, enabling sharing
 * 
 * For SLOT approval (slot_id is set):
 * - Approving confirms the booking
 */
export default function ApprovalScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const [approval, setApproval] = useState<Approval | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [offer, setOffer] = useState<MatchOffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [decisionNotes, setDecisionNotes] = useState('');

    // Determine if this is an offer approval (no slot_id) vs slot approval
    const isOfferApproval = approval && !approval.slot_id;

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
                return;
            }

            // Load offer
            const { data: offerData, error: offerError } = await supabase
                .from('match_offers')
                .select('*')
                .eq('id', approvalData.match_offer_id)
                .single();

            if (offerError) throw offerError;

            // Load slots for offer approval
            const { data: slotsData, error: slotsError } = await supabase
                .from('slots')
                .select('*')
                .eq('match_offer_id', approvalData.match_offer_id)
                .order('start_time', { ascending: true });

            if (slotsError) throw slotsError;

            setApproval(approvalData);
            setOffer(offerData);
            setSlots(slotsData || []);
        } catch (e: any) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveOffer = async () => {
        if (!approval || !offer) return;

        Alert.alert(
            'Approve Match Offer',
            'This will allow the host to share the match link with other coaches. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        setProcessing(true);
                        try {
                            // 1. Update approval status
                            const { error: approvalError } = await supabase
                                .from('approvals')
                                .update({
                                    status: 'APPROVED',
                                    decision_at: new Date().toISOString(),
                                    decision_notes: decisionNotes || null,
                                })
                                .eq('id', approval.id);

                            if (approvalError) throw approvalError;

                            // 2. Update offer status to OPEN (now shareable!)
                            const { error: offerError } = await supabase
                                .from('match_offers')
                                .update({
                                    status: 'OPEN',
                                })
                                .eq('id', offer.id);

                            if (offerError) throw offerError;

                            // 3. Create notification for host
                            if (offer.host_contact) {
                                const shareLink = generateShareableLink(offer.share_token);
                                await supabase.from('notifications').insert({
                                    recipient_email: offer.host_contact,
                                    recipient_type: 'HOST',
                                    notification_type: 'APPROVED',
                                    match_offer_id: offer.id,
                                    subject: 'Match Offer Approved!',
                                    message: `Great news! Your match offer has been approved. You can now share it with other coaches: ${shareLink}`,
                                    sent: false,
                                });
                            }

                            // Show share link
                            const shareLink = generateShareableLink(offer.share_token);

                            Alert.alert(
                                'Approved!',
                                'The match offer has been approved. The host can now share it with other coaches.',
                                [
                                    {
                                        text: 'Copy Share Link',
                                        onPress: async () => {
                                            await Clipboard.setStringAsync(shareLink);
                                            Alert.alert('Copied!', 'Share link copied to clipboard');
                                        }
                                    },
                                    { text: 'Done', onPress: () => router.push('/') }
                                ]
                            );
                        } catch (e: any) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to approve offer: ' + e.message);
                        } finally {
                            setProcessing(false);
                        }
                    },
                },
            ]
        );
    };

    const handleRejectOffer = async () => {
        if (!approval || !offer) return;

        if (!decisionNotes.trim()) {
            Alert.alert('Note Required', 'Please provide a reason for rejecting this offer.');
            return;
        }

        Alert.alert(
            'Reject Match Offer',
            'This will prevent the host from sharing this match offer. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessing(true);
                        try {
                            // 1. Update approval status
                            const { error: approvalError } = await supabase
                                .from('approvals')
                                .update({
                                    status: 'REJECTED',
                                    decision_at: new Date().toISOString(),
                                    decision_notes: decisionNotes,
                                })
                                .eq('id', approval.id);

                            if (approvalError) throw approvalError;

                            // 2. Update offer status to CANCELLED
                            const { error: offerError } = await supabase
                                .from('match_offers')
                                .update({
                                    status: 'CANCELLED',
                                })
                                .eq('id', offer.id);

                            if (offerError) throw offerError;

                            // 3. Notify host
                            if (offer.host_contact) {
                                await supabase.from('notifications').insert({
                                    recipient_email: offer.host_contact,
                                    recipient_type: 'HOST',
                                    notification_type: 'REJECTED',
                                    match_offer_id: offer.id,
                                    subject: 'Match Offer Not Approved',
                                    message: `Your match offer was not approved. Reason: ${decisionNotes}`,
                                    sent: false,
                                });
                            }

                            Alert.alert(
                                'Rejected',
                                'The match offer has been rejected. The host has been notified.',
                                [{ text: 'OK', onPress: () => router.push('/') }]
                            );
                        } catch (e: any) {
                            console.error(e);
                            Alert.alert('Error', 'Failed to reject offer: ' + e.message);
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

    if (!approval || !offer) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
                <Text style={styles.errorTitle}>Not Found</Text>
                <Text style={styles.errorSubtitle}>This approval request does not exist or has expired.</Text>
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
                    This request has already been {approval.status.toLowerCase()}.
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

    // Render for OFFER approval (pre-share)
    return (
        <>
            <Stack.Screen options={{
                title: 'Approve Match Offer',
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                headerShadowVisible: false,
                headerStyle: { backgroundColor: Colors.light.background }
            }} />

            <AppBanner deepLink={`matchslot://approve/${token}`} />

            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <Card style={styles.headerCard}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="shield-checkmark" size={40} color={Colors.light.primary} />
                        </View>
                        <Text style={styles.headerTitle}>Match Offer Approval</Text>
                        <Text style={styles.headerSubtitle}>
                            A coach wants to share this match offer with other teams. Please review and approve before sharing.
                        </Text>
                    </Card>

                    {/* Host Details */}
                    <Text style={styles.sectionTitle}>Host Coach</Text>
                    <Card style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Ionicons name="person" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Name</Text>
                                <Text style={styles.detailValue}>
                                    {offer.host_name}
                                    {offer.host_club && ` (${offer.host_club})`}
                                </Text>
                            </View>
                        </View>
                        {offer.host_contact && (
                            <View style={styles.detailRow}>
                                <Ionicons name="call" size={24} color={Colors.light.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Contact</Text>
                                    <Text style={styles.detailValue}>{offer.host_contact}</Text>
                                </View>
                            </View>
                        )}
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

                        {offer.notes && (
                            <View style={styles.detailRow}>
                                <Ionicons name="document-text" size={24} color={Colors.light.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.detailLabel}>Notes</Text>
                                    <Text style={styles.detailValue}>{offer.notes}</Text>
                                </View>
                            </View>
                        )}
                    </Card>

                    {/* Available Time Slots */}
                    <Text style={styles.sectionTitle}>Available Time Slots</Text>
                    {slots.map((slot, index) => (
                        <Card key={slot.id} style={styles.slotCard}>
                            <Ionicons name="calendar" size={20} color={Colors.light.primary} />
                            <Text style={styles.slotText}>{formatDateTime(slot.start_time)}</Text>
                        </Card>
                    ))}

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
                        onPress={handleRejectOffer}
                        loading={processing}
                        style={styles.rejectButton}
                    />
                    <Button
                        title="Approve"
                        onPress={handleApproveOffer}
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
    slotCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        marginBottom: 12,
    },
    slotText: {
        fontSize: 15,
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
