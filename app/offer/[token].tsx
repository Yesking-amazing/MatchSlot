import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Crest } from '@/components/ui/Crest';
import { EmptyState } from '@/components/ui/EmptyState';
import { Monogram, Wordmark } from '@/components/ui/Brandmark';
import { StatusChip, slotStatusKind } from '@/components/ui/StatusChip';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { openInMaps } from '@/lib/mapsUtils';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots, Slot, SlotStatus } from '@/types/database';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, Clock, Lock, MapPin, Navigation } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Guest Coach View - US-GC-01, US-GC-02
 * View match offer via shareable link and select a slot
 */
export default function OfferViewScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
    const styles = getStyles(colorScheme);
    const { t } = useTranslation();
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
                Alert.alert(t('offer.notFound'), t('offer.notFoundDesc'));
                return;
            }

            // Check if offer is open
            if (offerData.status !== 'OPEN') {
                Alert.alert(t('offer.closed'), t('offer.closedMessage'));
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
            Alert.alert(t('common.error'), t('offer.notFoundDesc'));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = async (slotId: string) => {
        if (!offer) return;

        // Check if slot is still available
        const slot = offer.slots.find(s => s.id === slotId);
        if (!slot || slot.status !== 'OPEN') {
            Alert.alert(t('offer.notAvailable'), t('offer.slotUnavailable'));
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
                return Colors[colorScheme].success;
            case 'HELD':
            case 'PENDING_APPROVAL':
                return Colors[colorScheme].warning;
            case 'BOOKED':
                return Colors[colorScheme].primary;
            default:
                return Colors[colorScheme].textSecondary;
        }
    };

    const getStatusLabel = (status: SlotStatus) => {
        switch (status) {
            case 'OPEN':
                return t('offer.available');
            case 'HELD':
                return t('offer.heldTemporarily');
            case 'PENDING_APPROVAL':
                return t('offer.pendingApproval');
            case 'BOOKED':
                return t('offer.slotBooked');
            case 'REJECTED':
                return t('offer.notAvailable');
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

    const openInApp = () => {
        const deepLink = `matchslot://offer/${token}`;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.href = deepLink;
        } else {
            Linking.openURL(deepLink).catch(() => { });
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    if (!offer) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.column}>
                    <EmptyState
                        icon={<AlertCircle size={24} color={c.primary} strokeWidth={2} />}
                        title={t('offer.notFound')}
                        subtitle={t('offer.notFoundDesc')}
                    />
                </View>
            </View>
        );
    }

    const isClosed = offer.status !== 'OPEN';

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.container}>
                {/* Verified header */}
                <View style={styles.verifiedHeader}>
                    <View style={styles.column}>
                        <View style={styles.verifiedRow}>
                            <Wordmark size={19} />
                            <View style={styles.secureChip}>
                                <Lock size={11} color={c.primary} strokeWidth={2.5} />
                                <Text style={styles.secureChipText}>Secure invite</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.column}>
                        {/* Share / invite banner */}
                        <Card tone="sunk" radius={16} padding={16} style={styles.inviteCard}>
                            <Text style={styles.inviteText}>
                                <Text style={styles.inviteStrong}>{offer.host_club || offer.host_name}</Text>
                                {' '}invited your team to a friendly.
                            </Text>
                        </Card>

                        {/* Fixture card */}
                        <Card radius={20} padding={22} style={styles.fixtureCard}>
                            <Text style={styles.kicker}>
                                {t('offer.footballMatch')} · {offer.age_group}
                            </Text>

                            <View style={styles.fixtureRow}>
                                <View style={styles.fixtureSide}>
                                    <Crest name={offer.host_club || offer.host_name} shape="circle" size={50} />
                                    <Text style={styles.crestName} numberOfLines={1}>
                                        {offer.host_club || offer.host_name}
                                    </Text>
                                </View>

                                <View style={styles.fixtureCenter}>
                                    <Text style={styles.fixtureDetail}>{offer.age_group}</Text>
                                    <Text style={styles.fixtureSub}>{offer.format}</Text>
                                </View>

                                <View style={styles.fixtureSide}>
                                    <Crest name={null} shape="circle" size={50} />
                                    <Text style={[styles.crestName, { color: c.textFaint }]} numberOfLines={1}>
                                        {t('common.away')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.fixtureStatus}>
                                <StatusChip
                                    kind={isClosed ? 'closed' : 'open'}
                                    label={isClosed ? t('offer.closed') : t('offer.available')}
                                />
                            </View>

                            {/* Location + host info */}
                            <View style={styles.infoList}>
                                <Pressable style={styles.infoRow} onPress={() => openInMaps(offer.location)}>
                                    <View style={styles.infoLabelGroup}>
                                        <MapPin size={15} color={c.textMuted} strokeWidth={2} />
                                        <Text style={styles.infoLabel}>{t('offer.locationLabel')}</Text>
                                    </View>
                                    <View style={styles.infoValueGroup}>
                                        <Text style={[styles.infoValue, { color: c.primary }]} numberOfLines={1}>
                                            {offer.location}
                                        </Text>
                                        <Navigation size={14} color={c.primary} strokeWidth={2} />
                                    </View>
                                </Pressable>

                                <View style={styles.infoRow}>
                                    <View style={styles.infoLabelGroup}>
                                        <Clock size={15} color={c.textMuted} strokeWidth={2} />
                                        <Text style={styles.infoLabel}>{t('offer.durationLabel')}</Text>
                                    </View>
                                    <Text style={styles.infoValue}>{offer.duration} {t('common.minutes')}</Text>
                                </View>

                                {offer.notes ? (
                                    <View style={[styles.infoRow, styles.infoRowLast]}>
                                        <View style={styles.infoLabelGroup}>
                                            <AlertCircle size={15} color={c.textMuted} strokeWidth={2} />
                                            <Text style={styles.infoLabel}>{t('offer.additionalInfo')}</Text>
                                        </View>
                                        <Text style={[styles.infoValue, styles.infoValueWrap]}>{offer.notes}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </Card>

                        {/* Slots */}
                        <Text style={styles.sectionKicker}>{t('offer.availableSlots')}</Text>
                        <Text style={styles.sectionSubtitle}>{t('offer.selectSlotDesc')}</Text>

                        {offer.slots.length === 0 ? (
                            <EmptyState
                                icon={<Clock size={24} color={c.primary} strokeWidth={2} />}
                                title={t('offer.noSlots')}
                            />
                        ) : (
                            offer.slots.map((slot) => {
                                const available = isSlotAvailable(slot);
                                const { date, time } = formatDateTime(slot.start_time);
                                const endTime = formatDateTime(slot.end_time).time;
                                const statusColor = getStatusColor(slot.status);

                                if (available) {
                                    return (
                                        <Card key={slot.id} radius={16} padding={16} style={styles.slotCard}>
                                            <View style={styles.slotContent}>
                                                <View style={styles.slotTimeInfo}>
                                                    <Text style={styles.slotDate}>{date}</Text>
                                                    <Text style={styles.slotTime}>{time} - {endTime}</Text>
                                                </View>
                                                <Button
                                                    title={t('offer.select')}
                                                    variant="primary"
                                                    onPress={() => handleSelectSlot(slot.id)}
                                                    style={styles.bookButton}
                                                />
                                            </View>
                                        </Card>
                                    );
                                }

                                return (
                                    <Card key={slot.id} radius={16} padding={16} style={[styles.slotCard, styles.slotCardDisabled]}>
                                        <View style={styles.slotContent}>
                                            <View style={styles.slotTimeInfo}>
                                                <Text style={[styles.slotDate, { color: c.textMuted }]}>{date}</Text>
                                                <Text style={[styles.slotTime, { color: c.textFaint }]}>{time} - {endTime}</Text>
                                            </View>
                                            <StatusChip kind={slotStatusKind(slot.status)} label={getStatusLabel(slot.status)} />
                                        </View>
                                    </Card>
                                );
                            })
                        )}
                    </View>
                </ScrollView>

                {/* Pinned smart-app banner */}
                <View style={styles.smartBanner}>
                    <View style={styles.smartBannerInner}>
                        <View style={styles.smartBannerLeft}>
                            <Monogram size={32} />
                            <View>
                                <Text style={styles.smartBannerTitle}>Get MatchSlot</Text>
                                <Text style={styles.smartBannerSub}>Track every match</Text>
                            </View>
                        </View>
                        <Pressable style={styles.smartBannerButton} onPress={openInApp}>
                            <Text style={styles.smartBannerButtonText}>Open</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
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
            padding: 20,
        },
        column: {
            width: '100%',
            maxWidth: COLUMN,
            alignSelf: 'center',
        },
        // Verified header
        verifiedHeader: {
            backgroundColor: c.background,
            borderBottomWidth: 1,
            borderBottomColor: c.divider,
            paddingHorizontal: 20,
            paddingTop: Platform.OS === 'web' ? 16 : 56,
            paddingBottom: 14,
        },
        verifiedRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        secureChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            height: 28,
            paddingHorizontal: 11,
            borderRadius: 999,
            backgroundColor: c.primaryTint,
        },
        secureChipText: {
            fontFamily: Fonts.body,
            fontSize: 12,
            fontWeight: '700',
            color: c.primary,
        },
        scrollContent: {
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 96,
        },
        // Invite banner
        inviteCard: {
            backgroundColor: c.primaryTint,
            borderColor: c.primaryTint,
        },
        inviteText: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '500',
            color: c.text,
            lineHeight: 19,
        },
        inviteStrong: {
            fontFamily: Fonts.body,
            fontWeight: '700',
            color: c.primary,
        },
        // Fixture card
        fixtureCard: {},
        kicker: {
            fontFamily: Fonts.body,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: c.textMuted,
            textAlign: 'center',
            marginBottom: 18,
        },
        fixtureRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        fixtureSide: {
            width: 88,
            alignItems: 'center',
            gap: 8,
        },
        crestName: {
            fontFamily: Fonts.body,
            fontSize: 12.5,
            fontWeight: '600',
            color: c.text,
            textAlign: 'center',
        },
        fixtureCenter: {
            flex: 1,
            alignItems: 'center',
        },
        fixtureDetail: {
            fontFamily: Fonts.display,
            fontSize: 30,
            fontWeight: '800',
            letterSpacing: -1,
            color: c.text,
        },
        fixtureSub: {
            fontFamily: Fonts.body,
            fontSize: 10.5,
            fontWeight: '700',
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: c.textFaint,
            marginTop: 2,
        },
        fixtureStatus: {
            alignItems: 'center',
            marginTop: 18,
        },
        infoList: {
            marginTop: 20,
            borderTopWidth: 1,
            borderTopColor: c.dividerFine,
        },
        infoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 11,
            borderBottomWidth: 1,
            borderBottomColor: c.dividerFine,
            gap: 12,
        },
        infoRowLast: {
            borderBottomWidth: 0,
            alignItems: 'flex-start',
        },
        infoLabelGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        infoLabel: {
            fontFamily: Fonts.body,
            fontSize: 12.5,
            fontWeight: '500',
            color: c.textMuted,
        },
        infoValueGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            flexShrink: 1,
        },
        infoValue: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '700',
            color: c.text,
            textAlign: 'right',
        },
        infoValueWrap: {
            flexShrink: 1,
            textAlign: 'right',
        },
        // Section
        sectionKicker: {
            fontFamily: Fonts.body,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: c.textMuted,
            marginTop: 8,
            marginBottom: 6,
        },
        sectionSubtitle: {
            fontFamily: Fonts.body,
            fontSize: 13,
            fontWeight: '500',
            color: c.textMuted,
            marginBottom: 14,
        },
        // Slot rows
        slotCard: {},
        slotCardDisabled: {
            opacity: 0.72,
        },
        slotContent: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
        },
        slotTimeInfo: {
            flex: 1,
        },
        slotDate: {
            fontFamily: Fonts.body,
            fontSize: 12.5,
            fontWeight: '600',
            color: c.textMuted,
            marginBottom: 3,
        },
        slotTime: {
            fontFamily: Fonts.display,
            fontSize: 16,
            fontWeight: '800',
            letterSpacing: -0.3,
            color: c.text,
        },
        bookButton: {
            height: 44,
            paddingHorizontal: 20,
        },
        // Smart app banner
        smartBanner: {
            backgroundColor: colorScheme === 'dark' ? '#0A100C' : '#131E17',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'web' ? 12 : 28,
        },
        smartBannerInner: {
            width: '100%',
            maxWidth: COLUMN,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        smartBannerLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flexShrink: 1,
        },
        smartBannerTitle: {
            fontFamily: Fonts.body,
            fontSize: 14,
            fontWeight: '700',
            color: '#EAF1EA',
        },
        smartBannerSub: {
            fontFamily: Fonts.body,
            fontSize: 11.5,
            fontWeight: '500',
            color: '#8FA091',
            marginTop: 1,
        },
        smartBannerButton: {
            backgroundColor: '#35D98A',
            paddingHorizontal: 18,
            height: 36,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
        },
        smartBannerButtonText: {
            fontFamily: Fonts.body,
            fontSize: 13,
            fontWeight: '700',
            color: '#06231A',
        },
    });
};
