import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { generateApprovalLink } from '@/lib/shareLink';
import { supabase } from '@/lib/supabase';
import { MatchOffer, Slot } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Guest Coach Booking Form - US-GC-03
 * Enter team and contact details to book a slot
 */
export default function BookSlotScreen() {
    const { slotId, token } = useLocalSearchParams<{ slotId: string; token: string }>();
    const [slot, setSlot] = useState<Slot | null>(null);
    const [offer, setOffer] = useState<MatchOffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [guestName, setGuestName] = useState('');
    const [guestClub, setGuestClub] = useState('');
    const [guestContact, setGuestContact] = useState('');
    const [guestNotes, setGuestNotes] = useState('');


    useEffect(() => {
        loadSlotDetails();
    }, [slotId]);

    const loadSlotDetails = async () => {
        try {
            // Load slot
            const { data: slotData, error: slotError } = await supabase
                .from('slots')
                .select('*')
                .eq('id', slotId)
                .single();

            if (slotError) throw slotError;

            if (!slotData) {
                Alert.alert('Not Found', 'This slot does not exist.');
                router.back();
                return;
            }

            // Load offer
            const { data: offerData, error: offerError } = await supabase
                .from('match_offers')
                .select('*')
                .eq('id', slotData.match_offer_id)
                .single();

            if (offerError) throw offerError;

            setSlot(slotData);
            setOffer(offerData);
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', 'Failed to load slot details');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!guestName.trim()) {
            Alert.alert('Required', 'Please enter your name');
            return;
        }
        if (!guestClub.trim()) {
            Alert.alert('Required', 'Please enter your club name');
            return;
        }
        if (!guestContact.trim()) {
            Alert.alert('Required', 'Please enter your contact information');
            return;
        }


        setSubmitting(true);
        try {
            // Generate session ID for hold
            const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // 1. Check slot is still available and update to PENDING_APPROVAL
            const { data: slotCheck, error: checkError } = await supabase
                .from('slots')
                .select('status')
                .eq('id', slotId)
                .single();

            if (checkError) throw checkError;

            if (slotCheck.status !== 'OPEN') {
                // US-GC-04: Slot unavailable handling
                Alert.alert(
                    'Slot Unavailable',
                    'Sorry, this slot has been taken by another team. Please go back and select another available slot.',
                    [
                        { text: 'OK', onPress: () => router.back() }
                    ]
                );
                return;
            }

            // 2. Update slot with guest details and status
            const { error: updateError } = await supabase
                .from('slots')
                .update({
                    status: 'PENDING_APPROVAL',
                    held_by_session: sessionId,
                    held_at: new Date().toISOString(),
                    guest_name: guestName,
                    guest_club: guestClub,
                    guest_contact: guestContact,
                    guest_notes: guestNotes || null,
                })
                .eq('id', slotId);

            if (updateError) throw updateError;

            // 3. Create approval request (US-AP-01)
            const approvalToken = `approval-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const { error: approvalError } = await supabase
                .from('approvals')
                .insert({
                    slot_id: slotId,
                    match_offer_id: slot!.match_offer_id,
                    approval_token: approvalToken,
                    approver_email: offer!.approver_email,
                    status: 'PENDING',
                });

            if (approvalError) throw approvalError;

            // 4. Create notification for approver (US-AP-01, US-SYS-03)
            const approvalLink = generateApprovalLink(approvalToken);
            const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    recipient_email: offer!.approver_email,
                    recipient_type: 'APPROVER',
                    notification_type: 'APPROVAL_REQUEST',
                    match_offer_id: slot!.match_offer_id,
                    slot_id: slotId,
                    subject: 'Match Booking Approval Required',
                    message: `${guestClub} has requested to book a match slot. Please review and approve: ${approvalLink}`,
                    sent: false,
                });

            if (notificationError) throw notificationError;

            // 5. Create notification for host (US-SYS-03)
            if (offer?.host_contact) {
                await supabase.from('notifications').insert({
                    recipient_email: offer.host_contact,
                    recipient_type: 'HOST',
                    notification_type: 'SLOT_SELECTED',
                    match_offer_id: slot!.match_offer_id,
                    slot_id: slotId,
                    subject: 'Match Slot Selected',
                    message: `${guestClub} has selected a slot for your match offer and is awaiting approval.`,
                    sent: false,
                });
            }

            // Send Email via Native Composer (US-HC-TestFlight)
            const isAvailable = await MailComposer.isAvailableAsync();

            if (isAvailable) {
                await MailComposer.composeAsync({
                    recipients: [offer!.approver_email],
                    subject: `Match Booking Approval Request - ${guestClub} (U${offer?.age_group})`,
                    body: `Hello,\n\n${guestClub} has requested to book a match slot.\n\nDetails:\nMatch: U${offer?.age_group} ${offer?.format}\nDate: ${formatDateTime(slot!.start_time)}\nLocation: ${offer?.location}\n\nPlease review and approve the booking here:\n${approvalLink}\n\nThanks,\nMatchSlot App`,
                });

                Alert.alert(
                    'Booking Submitted!',
                    'Please send the email that was just created to complete the request.',
                    [{ text: 'OK', onPress: () => router.push('/') }]
                );
            } else {
                // Fallback for simulators or devices without mail accounts
                Alert.alert(
                    'Booking Submitted!',
                    `Mail app not available. Please manually send this link to ${offer!.approver_email}:\n\n${approvalLink}`,
                    [{ text: 'OK', onPress: () => router.push('/') }]
                );
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', 'Failed to submit booking: ' + e.message);
        } finally {
            setSubmitting(false);
        }
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

    if (!slot || !offer) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Slot not found</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{
                title: 'Book Slot',
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                headerBackTitleVisible: false,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: Colors.light.background }
            }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Selected Slot Summary */}
                    <Card style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="checkmark-circle" size={32} color={Colors.light.success} />
                            <Text style={styles.summaryTitle}>Selected Slot</Text>
                        </View>

                        <View style={styles.summaryDetails}>
                            <Text style={styles.summaryLabel}>Match</Text>
                            <Text style={styles.summaryValue}>
                                {offer.age_group} • {offer.format}
                            </Text>
                        </View>

                        <View style={styles.summaryDetails}>
                            <Text style={styles.summaryLabel}>Date & Time</Text>
                            <Text style={styles.summaryValue}>
                                {formatDateTime(slot.start_time)}
                            </Text>
                        </View>

                        <View style={styles.summaryDetails}>
                            <Text style={styles.summaryLabel}>Location</Text>
                            <Text style={styles.summaryValue}>{offer.location}</Text>
                        </View>
                    </Card>

                    {/* Booking Form */}
                    <Text style={styles.sectionTitle}>Your Team Details</Text>
                    <Text style={styles.sectionSubtitle}>
                        Please provide your information so the host can contact you
                    </Text>

                    <Input
                        placeholder="Your Name *"
                        value={guestName}
                        onChangeText={setGuestName}
                        icon="person-outline"
                    />

                    <Input
                        placeholder="Your Club Name *"
                        value={guestClub}
                        onChangeText={setGuestClub}
                        icon="shield-outline"
                    />

                    <Input
                        placeholder="Contact (Email or Phone) *"
                        value={guestContact}
                        onChangeText={setGuestContact}
                        icon="call-outline"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Input
                        placeholder="Additional Notes (optional)"
                        value={guestNotes}
                        onChangeText={setGuestNotes}
                        icon="document-text-outline"
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.divider} />

                    <Card style={styles.infoCard}>
                        <Ionicons name="information-circle-outline" size={24} color={Colors.light.primary} />
                        <Text style={styles.infoText}>
                            An approval request will be sent to the club administrator. The booking will be confirmed once approved.
                        </Text>
                    </Card>
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title="Submit Booking Request"
                        onPress={handleSubmit}
                        loading={submitting}
                    />
                </View>
            </KeyboardAvoidingView>
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
    },
    errorText: {
        fontSize: 16,
        color: Colors.light.error,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    summaryCard: {
        padding: 20,
        marginBottom: 24,
        backgroundColor: '#F0F9FF',
        borderColor: Colors.light.primary,
        borderWidth: 1,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    summaryDetails: {
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginTop: 8,
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.light.border,
        marginVertical: 24,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        backgroundColor: '#FFF9E6',
        borderColor: '#FFD700',
        borderWidth: 1,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: Colors.light.text,
        lineHeight: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: Colors.light.background,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
});
