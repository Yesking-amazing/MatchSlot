import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Wordmark } from '@/components/ui/Brandmark';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { addMatchToCalendar } from '@/lib/calendarUtils';
import { scheduleMatchReminders, sendPushToUser } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { MatchOffer, Slot } from '@/types/database';
import * as MailComposer from 'expo-mail-composer';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, CalendarClock, Check, MapPin, ShieldCheck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Guest Coach Booking Form - US-GC-03
 * Enter team and contact details to book a slot
 */
export default function BookSlotScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
    const styles = getStyles(colorScheme);
    const { t } = useTranslation();
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
                Alert.alert(t('offer.notFound'), t('offer.notFoundDesc'));
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
            Alert.alert(t('common.error'), t('detail.failedLoad'));
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!guestName.trim()) {
            Alert.alert(t('common.required'), t('book.enterName'));
            return;
        }
        if (!guestClub.trim()) {
            Alert.alert(t('common.required'), t('book.enterClub'));
            return;
        }
        if (!guestContact.trim()) {
            Alert.alert(t('common.required'), t('book.enterContact'));
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
                    t('offer.notAvailable'),
                    t('offer.slotUnavailable'),
                    [
                        { text: t('common.ok'), onPress: () => router.back() }
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

            // 7. Send push notification to host
            if (offer?.created_by) {
                await sendPushToUser(
                    offer.created_by,
                    'Match Booked! 🎉',
                    `${guestClub} has booked your ${offer.age_group} ${offer.format} slot.`
                );
            }

            // 8. Schedule local reminders (1h before + day-before attendance check)
            const matchTitle = `${offer?.age_group} ${offer?.format} — ${guestClub} vs ${offer?.host_club || offer?.host_name}`;
            await scheduleMatchReminders(slotId!, slot!.start_time, matchTitle, offer?.location || '');

            // Show success screen instead of alert for better web UX
            setBookingConfirmed(true);
        } catch (e: any) {
            console.error(e);
            Alert.alert(t('common.error'), t('book.failedBook') + ': ' + e.message);
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
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    if (!slot || !offer) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{t('detail.slotNotFound')}</Text>
            </View>
        );
    }

    // Show confirmation screen after successful booking
    if (bookingConfirmed) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.confirmationContainer}>
                    <View style={styles.confirmationContent}>
                        <View style={styles.successRing}>
                            <View style={styles.successCircle}>
                                <Check size={38} color={colorScheme === 'dark' ? c.primaryInk : c.accent} strokeWidth={3} />
                            </View>
                        </View>
                        <Text style={styles.confirmationTitle}>{t('book.confirmed')}</Text>
                        <Text style={styles.confirmationSubtitle}>
                            {t('book.confirmedDesc')}
                        </Text>

                        <Card radius={20} padding={4} style={styles.confirmationCard}>
                            <View style={styles.recapRow}>
                                <View style={styles.recapLabelGroup}>
                                    <ShieldCheck size={15} color={c.textMuted} strokeWidth={2} />
                                    <Text style={styles.recapLabel}>{t('book.matchDetails')}</Text>
                                </View>
                                <Text style={styles.recapValue} numberOfLines={1}>
                                    {offer.age_group} · {offer.format}
                                </Text>
                            </View>

                            <View style={styles.recapRow}>
                                <View style={styles.recapLabelGroup}>
                                    <CalendarClock size={15} color={c.textMuted} strokeWidth={2} />
                                    <Text style={styles.recapLabel}>{t('detail.dateTime')}</Text>
                                </View>
                                <Text style={styles.recapValue} numberOfLines={1}>{formatDateTime(slot!.start_time)}</Text>
                            </View>

                            <View style={[styles.recapRow, styles.recapRowLast]}>
                                <View style={styles.recapLabelGroup}>
                                    <MapPin size={15} color={c.textMuted} strokeWidth={2} />
                                    <Text style={styles.recapLabel}>{t('offer.locationLabel')}</Text>
                                </View>
                                <Text style={styles.recapValue} numberOfLines={1}>{offer?.location}</Text>
                            </View>
                        </Card>

                        <Button
                            title="Add to Calendar"
                            variant="primary"
                            style={styles.confirmButton}
                            onPress={async () => {
                                const title = `${offer?.age_group} ${offer?.format} — ${guestClub} vs ${offer?.host_club || offer?.host_name}`;
                                const success = await addMatchToCalendar(
                                    slot!.start_time, slot!.end_time,
                                    title, offer?.location || '',
                                    `Host: ${offer?.host_name}\nContact: ${offer?.host_contact || ''}`
                                );
                                if (success) Alert.alert('Added!', 'Match added to your calendar.');
                            }}
                        />
                        <Button
                            title={t('common.ok')}
                            variant="secondary"
                            onPress={() => router.push('/')}
                            style={styles.confirmButtonSecondary}
                        />
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Back header with slot summary */}
                <View style={styles.header}>
                    <View style={styles.column}>
                        <View style={styles.headerRow}>
                            <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
                                <ArrowLeft size={20} color={c.text} strokeWidth={2} />
                            </Pressable>
                            <View style={styles.headerSummary}>
                                <Text style={styles.headerTitle} numberOfLines={1}>
                                    {offer.age_group} · {offer.format}
                                </Text>
                                <Text style={styles.headerSub} numberOfLines={1}>
                                    {formatDateTime(slot.start_time)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                    <View style={styles.column}>
                        <Text style={styles.sectionKicker}>{t('book.yourTeamDetails')}</Text>

                        <Card radius={20} padding={18} style={styles.formCard}>
                            <Input
                                label={t('book.clubName')}
                                placeholder={t('book.clubName')}
                                value={guestClub}
                                onChangeText={setGuestClub}
                            />
                            <Input
                                label={t('book.teamCoach')}
                                placeholder={t('book.teamCoach')}
                                value={guestName}
                                onChangeText={setGuestName}
                            />
                            <Input
                                label={t('book.contactInfo')}
                                placeholder={t('book.contactInfo')}
                                value={guestContact}
                                onChangeText={setGuestContact}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Input
                                label={t('book.notes')}
                                optional
                                placeholder={t('book.notes')}
                                value={guestNotes}
                                onChangeText={setGuestNotes}
                                multiline
                                numberOfLines={3}
                                style={styles.notesInput}
                            />
                        </Card>

                        <View style={styles.trustRow}>
                            <Wordmark size={15} />
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <View style={styles.column}>
                        <Button
                            title={t('book.confirmBooking')}
                            onPress={handleSubmit}
                            loading={submitting}
                            icon={<ArrowRight size={17} color={c.primaryInk} strokeWidth={2.5} />}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

const COLUMN = 460;

const getStyles = (colorScheme: 'light' | 'dark') => {
    const c = Colors[colorScheme];
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.background,
        },
        centerContainer: {
            flex: 1,
            backgroundColor: c.background,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorText: {
            fontFamily: Fonts.body,
            fontSize: 14,
            fontWeight: '600',
            color: c.error,
        },
        column: {
            width: '100%',
            maxWidth: COLUMN,
            alignSelf: 'center',
        },
        // Header
        header: {
            backgroundColor: c.background,
            borderBottomWidth: 1,
            borderBottomColor: c.divider,
            paddingHorizontal: 20,
            paddingTop: Platform.OS === 'web' ? 16 : 56,
            paddingBottom: 14,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        backButton: {
            width: 38,
            height: 38,
            borderRadius: 19,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.card,
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerSummary: {
            flex: 1,
        },
        headerTitle: {
            fontFamily: Fonts.display,
            fontSize: 17,
            fontWeight: '800',
            letterSpacing: -0.3,
            color: c.text,
        },
        headerSub: {
            fontFamily: Fonts.body,
            fontSize: 12,
            fontWeight: '500',
            color: c.textMuted,
            marginTop: 2,
        },
        scrollContent: {
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 120,
        },
        sectionKicker: {
            fontFamily: Fonts.body,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: c.textMuted,
            marginBottom: 12,
        },
        formCard: {},
        notesInput: {
            minHeight: 88,
        },
        trustRow: {
            alignItems: 'center',
            marginTop: 8,
            opacity: 0.7,
        },
        footer: {
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'web' ? 16 : 28,
            backgroundColor: c.background,
            borderTopWidth: 1,
            borderTopColor: c.divider,
        },
        // Confirmation
        confirmationContainer: {
            flex: 1,
            backgroundColor: c.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
        },
        confirmationContent: {
            alignItems: 'center',
            width: '100%',
            maxWidth: COLUMN,
        },
        successRing: {
            width: 92,
            height: 92,
            borderRadius: 46,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colorScheme === 'dark' ? 'rgba(53,217,138,0.16)' : 'rgba(21,96,61,0.12)',
            marginBottom: 20,
        },
        successCircle: {
            width: 76,
            height: 76,
            borderRadius: 38,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colorScheme === 'dark' ? c.primary : c.primary,
        },
        confirmationTitle: {
            fontFamily: Fonts.display,
            fontSize: 28,
            fontWeight: '800',
            letterSpacing: -0.8,
            color: c.text,
            textAlign: 'center',
            marginBottom: 8,
        },
        confirmationSubtitle: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '500',
            color: c.textMuted,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 20,
            paddingHorizontal: 8,
        },
        confirmationCard: {
            width: '100%',
            paddingHorizontal: 18,
            paddingVertical: 4,
            marginBottom: 20,
        },
        recapRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 13,
            borderBottomWidth: 1,
            borderBottomColor: c.dividerFine,
            gap: 12,
        },
        recapRowLast: {
            borderBottomWidth: 0,
        },
        recapLabelGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        recapLabel: {
            fontFamily: Fonts.body,
            fontSize: 12.5,
            fontWeight: '500',
            color: c.textMuted,
        },
        recapValue: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '700',
            color: c.text,
            flexShrink: 1,
            textAlign: 'right',
        },
        confirmButton: {
            width: '100%',
        },
        confirmButtonSecondary: {
            width: '100%',
            marginTop: 10,
        },
    });
};
