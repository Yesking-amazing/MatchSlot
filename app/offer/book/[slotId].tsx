import { AppBanner } from '@/components/ui/AppBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
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
    const [bookingConfirmed, setBookingConfirmed] = useState(false);

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
            // 1. Check slot is still available
            const { data: slotCheck, error: checkError } = await supabase
                .from('slots')
                .select('status')
                .eq('id', slotId)
                .single();

            if (checkError) throw checkError;

            if (slotCheck.status !== 'OPEN') {
                Alert.alert(
                    'Slot Unavailable',
                    'Sorry, this slot has been taken by another team. Please go back and select another available slot.',
                    [
                        { text: 'OK', onPress: () => router.back() }
                    ]
                );
                return;
            }

            // 2. Book the slot directly (no approval needed - offer was pre-approved)
            const { error: updateError } = await supabase
                .from('slots')
                .update({
                    status: 'BOOKED',
                    held_at: new Date().toISOString(),
                    guest_name: guestName,
                    guest_club: guestClub,
                    guest_contact: guestContact,
                    guest_notes: guestNotes || null,
                })
                .eq('id', slotId);

            if (updateError) throw updateError;

            // 3. Close all other slots for this offer
            const { error: rejectOthersError } = await supabase
                .from('slots')
                .update({ status: 'REJECTED' })
                .eq('match_offer_id', slot!.match_offer_id)
                .neq('id', slotId)
                .in('status', ['OPEN', 'HELD']);

            if (rejectOthersError) throw rejectOthersError;

            // 4. Close the match offer
            const { error: offerError } = await supabase
                .from('match_offers')
                .update({ status: 'CLOSED' })
                .eq('id', slot!.match_offer_id);

            if (offerError) throw offerError;

            // 5. Send confirmation email to host
            const isAvailable = await MailComposer.isAvailableAsync();

            if (isAvailable && offer?.host_contact) {
                await MailComposer.composeAsync({
                    recipients: [offer.host_contact],
                    subject: `Match Booked! ${guestClub} - ${offer?.age_group} ${offer?.format}`,
                    body: `Hello ${offer?.host_name},\n\nGreat news! A match has been booked.\n\nOpponent: ${guestClub}\nContact: ${guestName} (${guestContact})\nDate: ${formatDateTime(slot!.start_time)}\nLocation: ${offer?.location}\n\nPlease contact them to confirm details.\n\nThanks,\nMatchSlot App`,
                });
            }

            // 6. Create notification for host
            if (offer?.host_contact) {
                await supabase.from('notifications').insert({
                    recipient_email: offer.host_contact,
                    recipient_type: 'HOST',
                    notification_type: 'APPROVED',
                    match_offer_id: slot!.match_offer_id,
                    slot_id: slotId,
                    subject: 'Match Booked!',
                    message: `${guestClub} has booked your match slot on ${formatDateTime(slot!.start_time)}.`,
                    sent: false,
                });
            }

            // Show success screen instead of alert for better web UX
            setBookingConfirmed(true);
        } catch (e: any) {
            console.error(e);
            Alert.alert('Error', 'Failed to book match: ' + e.message);
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

    // Show confirmation screen after successful booking
    if (bookingConfirmed) {
        return (
            <>
                <Stack.Screen options={{
                    title: 'Booking Confirmed',
                    headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                    headerBackVisible: false,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: Colors.light.background }
                }} />
                <View style={styles.confirmationContainer}>
                    <View style={styles.confirmationContent}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={80} color={Colors.light.success} />
                        </View>
                        <Text style={styles.confirmationTitle}>Match Confirmed! 🎉</Text>
                        <Text style={styles.confirmationSubtitle}>
                            You've successfully booked a match with {offer?.host_club || offer?.host_name}
                        </Text>

                        <Card style={styles.confirmationCard}>
                            <View style={styles.confirmationDetail}>
                                <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
                                <View style={styles.confirmationDetailText}>
                                    <Text style={styles.confirmationLabel}>Date & Time</Text>
                                    <Text style={styles.confirmationValue}>{formatDateTime(slot!.start_time)}</Text>
                                </View>
                            </View>

                            <View style={styles.confirmationDetail}>
                                <Ionicons name="location-outline" size={20} color={Colors.light.primary} />
                                <View style={styles.confirmationDetailText}>
                                    <Text style={styles.confirmationLabel}>Location</Text>
                                    <Text style={styles.confirmationValue}>{offer?.location}</Text>
                                </View>
                            </View>

                            <View style={styles.confirmationDetail}>
                                <Ionicons name="shield-outline" size={20} color={Colors.light.primary} />
                                <View style={styles.confirmationDetailText}>
                                    <Text style={styles.confirmationLabel}>Host Team</Text>
                                    <Text style={styles.confirmationValue}>{offer?.host_club || offer?.host_name}</Text>
                                </View>
                            </View>
                        </Card>

                        <Text style={styles.confirmationNote}>
                            The host coach will contact you to finalize match details.
                        </Text>

                        <Button
                            title="Done"
                            onPress={() => router.push('/')}
                            style={styles.doneButton}
                        />
                    </View>
                </View>
            </>
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

            <AppBanner deepLink={`matchslot://offer/book/${slotId}`} />

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
                            Your match will be confirmed immediately. The host coach will receive a notification and can contact you to finalize details.
                        </Text>
                    </Card>
                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title="Confirm Match"
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
    // Confirmation screen styles
    confirmationContainer: {
        flex: 1,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    confirmationContent: {
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    successIcon: {
        marginBottom: 16,
    },
    confirmationTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    confirmationSubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    confirmationCard: {
        width: '100%',
        padding: 20,
        marginBottom: 24,
        backgroundColor: '#F0F9FF',
        borderColor: Colors.light.primary,
        borderWidth: 1,
    },
    confirmationDetail: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    confirmationDetailText: {
        flex: 1,
    },
    confirmationLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
    },
    confirmationValue: {
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '600',
    },
    confirmationNote: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    doneButton: {
        width: '100%',
    },
});
