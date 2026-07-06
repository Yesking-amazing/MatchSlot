import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Crest } from '@/components/ui/Crest';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ManageSkeleton } from '@/components/ui/SkeletonLoader';
import { SlotPips } from '@/components/ui/SlotPips';
import { StatusChip, offerStatusKind, slotStatusKind } from '@/components/ui/StatusChip';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { openInMaps } from '@/lib/mapsUtils';
import { canShareWhatsApp, copyLinkToClipboard, shareMatchLink, shareViaWhatsApp } from '@/lib/shareLink';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots, Slot, SlotStatus } from '@/types/database';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import {
    Calendar,
    ChevronRight,
    Clock,
    MapPin,
    MessageCircle,
    Navigation,
    Plus,
    Share2,
    Trash2,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
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
                    <Text style={modalStyles.title}>{t('manage.saveMatchResult')}</Text>

                    <View style={modalStyles.scoreRow}>
                        <View style={modalStyles.scoreInput}>
                            <Text style={modalStyles.scoreLabel}>{t('common.home')}</Text>
                            <TextInput
                                style={modalStyles.scoreField}
                                value={homeScore}
                                onChangeText={setHomeScore}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={c.textTertiary}
                                maxLength={2}
                            />
                        </View>
                        <Text style={modalStyles.scoreSeparator}>–</Text>
                        <View style={modalStyles.scoreInput}>
                            <Text style={modalStyles.scoreLabel}>{t('common.away')}</Text>
                            <TextInput
                                style={modalStyles.scoreField}
                                value={awayScore}
                                onChangeText={setAwayScore}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={c.textTertiary}
                                maxLength={2}
                            />
                        </View>
                    </View>

                    <TextInput
                        style={modalStyles.notesInput}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder={t('manage.matchNotes')}
                        placeholderTextColor={c.textTertiary}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={modalStyles.buttonRow}>
                        <View style={modalStyles.buttonHalf}>
                            <Button title={t('common.cancel')} variant="secondary" onPress={onClose} />
                        </View>
                        <View style={modalStyles.buttonHalf}>
                            <Button title={t('manage.saveResult')} onPress={handleSave} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const getModalStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: Colors[colorScheme].card,
        borderRadius: 20,
        padding: 24,
        maxWidth: 360,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 8,
    },
    title: {
        fontFamily: Fonts.display,
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
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
        fontFamily: Fonts.body,
        fontSize: 12.5,
        color: Colors[colorScheme].textMuted,
        marginBottom: 8,
        fontWeight: '600',
    },
    scoreField: {
        width: 80,
        height: 68,
        fontFamily: Fonts.display,
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -1,
        textAlign: 'center',
        color: Colors[colorScheme].text,
        borderWidth: 1,
        borderColor: Colors[colorScheme].divider,
        borderRadius: 14,
        backgroundColor: Colors[colorScheme].surfaceSunk,
    },
    scoreSeparator: {
        fontFamily: Fonts.display,
        fontSize: 30,
        fontWeight: '800',
        color: Colors[colorScheme].accent,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: Colors[colorScheme].divider,
        borderRadius: 12,
        padding: 14,
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors[colorScheme].text,
        minHeight: 84,
        textAlignVertical: 'top',
        marginBottom: 20,
        backgroundColor: Colors[colorScheme].card,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    buttonHalf: {
        flex: 1,
    },
});

// Slot status → translated label key (kind is derived via slotStatusKind).
const getSlotLabelKey = (status: SlotStatus): string => {
    switch (status) {
        case 'OPEN': return 'manage.awaitingBooking';
        case 'HELD': return 'manage.held';
        case 'PENDING_APPROVAL': return 'manage.pending';
        case 'BOOKED': return 'manage.booked';
        case 'REJECTED': return 'manage.rejected';
        default: return status as string;
    }
};

export default function ManageScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
    const styles = getStyles(colorScheme);
    const { user } = useAuth();
    const [offers, setOffers] = useState<MatchOfferWithSlots[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
    const [whatsAppAvailable, setWhatsAppAvailable] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'confirmed'>('all');

    // Results modal state
    const [resultsModalVisible, setResultsModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

    // Segmented control ↔ viewMode mapping (Agenda = calendar/date view, List = list view)
    const segmentOptions = [t('manage.agenda'), t('manage.list')];
    const segmentValue = viewMode === 'calendar' ? segmentOptions[0] : segmentOptions[1];
    const onSegmentChange = (v: string) => setViewMode(v === segmentOptions[0] ? 'calendar' : 'list');

    useEffect(() => {
        canShareWhatsApp().then(setWhatsAppAvailable);
    }, []);

    const loadOffers = async () => {
        try {
            if (!user) { setLoading(false); setRefreshing(false); return; }

            // Query matches owned by this user directly from the database
            const { data: offersData, error: offersError } = await supabase
                .from('match_offers')
                .select('*')
                .eq('created_by', user.id)
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

    const handleShareLink = (offer: MatchOfferWithSlots) => {
        const details = `${offer.host_club || 'Our team'} - ${offer.age_group} ${offer.format} at ${offer.location}`;
        shareMatchLink(offer.share_token, details);
    };

    const handleWhatsApp = (offer: MatchOfferWithSlots) => {
        const details = `${offer.host_club || 'Our team'} - ${offer.age_group} ${offer.format} at ${offer.location}`;
        shareViaWhatsApp(offer.share_token, details);
    };

    // Client-side filter of offers by status kind.
    const filteredOffers = React.useMemo(() => {
        if (statusFilter === 'all') return offers;
        return offers.filter(o => offerStatusKind(o.status) === statusFilter);
    }, [offers, statusFilter]);

    // Calendar/agenda: build a flat, date-sorted list of slots with their offer.
    const slotsByDate = React.useMemo(() => {
        const rows = filteredOffers.flatMap(offer =>
            offer.slots.map(slot => ({ slot, offer }))
        );
        rows.sort((a, b) => a.slot.start_time.localeCompare(b.slot.start_time));
        return rows;
    }, [filteredOffers]);

    const handleDeleteOffer = async (offerId: string) => {
        Alert.alert(
            t('manage.deleteOffer'),
            t('manage.deleteConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('match_offers')
                                .delete()
                                .eq('id', offerId);

                            if (error) throw error;

                            Alert.alert(t('common.success'), t('manage.offerDeleted'));
                            loadOffers();
                        } catch (e: any) {
                            Alert.alert(t('common.error'), t('manage.failedDelete') + ': ' + e.message);
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

            Alert.alert(t('common.success'), t('manage.resultSaved'));
            setResultsModalVisible(false);
            setSelectedSlot(null);
            loadOffers();
        } catch (e: any) {
            Alert.alert(t('common.error'), t('manage.failedSaveResult') + ': ' + e.message);
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

    const formatDay = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

    const formatTimeRange = (start: string, end: string) =>
        `${new Date(start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${new Date(end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    const isOfferPast = (offer: MatchOfferWithSlots) =>
        offer.status === 'CLOSED' || offer.status === 'CANCELLED';

    // ── Header (title + segmented control) ──
    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>{t('manage.title')}</Text>
            <SegmentedControl options={segmentOptions} value={segmentValue} onChange={onSegmentChange} />
        </View>
    );

    // ── Filter chips ──
    const renderFilters = () => (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScroll}
        >
            <Chip label={t('manage.filterAll')} active={statusFilter === 'all'} onPress={() => setStatusFilter('all')} />
            <Chip label={t('manage.filterOpen')} active={statusFilter === 'open'} onPress={() => setStatusFilter('open')} />
            <Chip label={t('manage.filterPending')} active={statusFilter === 'pending'} onPress={() => setStatusFilter('pending')} />
            <Chip label={t('manage.filterConfirmed')} active={statusFilter === 'confirmed'} onPress={() => setStatusFilter('confirmed')} />
        </ScrollView>
    );

    // ── One offer row card ──
    const renderOfferRow = (offer: MatchOfferWithSlots) => {
        const past = isOfferPast(offer);
        const kind = offerStatusKind(offer.status);
        const statusColor = kind === 'open' ? c.primary
            : kind === 'pending' ? c.warning
            : c.divider;
        const bookedCount = offer.slots.filter(s => s.status === 'BOOKED').length;
        const total = offer.slots.length;
        const statusLabel = offer.status === 'PENDING_APPROVAL' ? t('manage.awaitingApproval')
            : offer.status === 'OPEN' ? t('manage.open')
            : offer.status === 'CLOSED' ? t('manage.matchBooked')
            : offer.status === 'CANCELLED' ? t('manage.cancelled')
            : offer.status;

        const progressLabel = offer.status === 'PENDING_APPROVAL'
            ? t('manage.awaitingApproval')
            : `${bookedCount} / ${total} ${t('common.slots')}`;

        return (
            <View key={offer.id} style={[styles.offerCard, past && styles.offerCardPast]}>
                {/* Top line */}
                <View style={styles.offerTop}>
                    <Crest
                        name={offer.host_club}
                        size={30}
                        shape="square"
                        ringColor={statusColor}
                        muted={past}
                    />
                    <View style={styles.offerTopInfo}>
                        <Text style={styles.offerTitle} numberOfLines={1}>
                            {offer.age_group} · {offer.format}
                        </Text>
                        <Text style={styles.offerMeta} numberOfLines={1}>
                            {offer.slots.length > 0
                                ? formatDateTime(offer.slots[0].start_time)
                                : `${offer.duration} ${t('common.minutes')}`}
                        </Text>
                    </View>
                    <StatusChip
                        kind={past ? 'closed' : kind}
                        label={past ? t('manage.matchBooked') : statusLabel}
                    />
                </View>

                {/* Location row */}
                <TouchableOpacity style={styles.offerLocation} onPress={() => openInMaps(offer.location)}>
                    <MapPin size={12} color={c.primary} strokeWidth={2} />
                    <Text style={styles.offerLocationText} numberOfLines={1}>{offer.location}</Text>
                    <Navigation size={11} color={c.primary} strokeWidth={2} />
                </TouchableOpacity>

                {/* Slots list */}
                <View style={styles.slotList}>
                    {offer.slots.map((slot) => (
                        <AnimatedPressable
                            key={slot.id}
                            onPress={() => router.push(`/match/detail/${slot.id}` as any)}
                            scaleTo={0.98}
                        >
                            <View style={styles.slotRow}>
                                <Clock size={15} color={c.textMuted} strokeWidth={2} />
                                <Text style={styles.slotTime} numberOfLines={1}>
                                    {formatDateTime(slot.start_time)}
                                    {slot.guest_club ? `  ·  ${slot.guest_club}` : ''}
                                </Text>
                                {slot.result_saved_at ? (
                                    <View style={styles.resultBadge}>
                                        <Text style={styles.resultText}>{slot.home_score} – {slot.away_score}</Text>
                                    </View>
                                ) : canSaveResults(slot) ? (
                                    <Text style={styles.slotResultCta}>{t('manage.result')}</Text>
                                ) : (
                                    <StatusChip kind={slotStatusKind(slot.status)} label={t(getSlotLabelKey(slot.status))} />
                                )}
                                <ChevronRight size={16} color={c.textTertiary} strokeWidth={2} />
                            </View>
                        </AnimatedPressable>
                    ))}
                </View>

                {/* Bottom line: slot pips + progress label */}
                <View style={styles.offerBottom}>
                    <SlotPips total={total} filled={bookedCount} muted={past} />
                    <Text style={styles.progressLabel} numberOfLines={1}>{progressLabel}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {offer.status === 'OPEN' && (
                        <>
                            <View style={styles.actionFlex}>
                                <Button
                                    title={t('manage.shareLink')}
                                    variant="secondary"
                                    icon={<Share2 size={16} color={c.primary} strokeWidth={2} />}
                                    onPress={() => handleShareLink(offer)}
                                    style={styles.actionBtn}
                                />
                            </View>
                            {whatsAppAvailable && (
                                <TouchableOpacity style={styles.iconAction} onPress={() => handleWhatsApp(offer)}>
                                    <MessageCircle size={18} color={c.primary} strokeWidth={2} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.iconActionDanger} onPress={() => handleDeleteOffer(offer.id)}>
                                <Trash2 size={18} color={c.error} strokeWidth={2} />
                            </TouchableOpacity>
                        </>
                    )}
                    {offer.status === 'PENDING_APPROVAL' && (
                        <>
                            <View style={styles.actionFlex}>
                                <View style={styles.pendingNote}>
                                    <Clock size={15} color={c.warningText} strokeWidth={2} />
                                    <Text style={styles.pendingNoteText} numberOfLines={1}>{t('manage.waitingApprover')}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.iconActionDanger} onPress={() => handleDeleteOffer(offer.id)}>
                                <Trash2 size={18} color={c.error} strokeWidth={2} />
                            </TouchableOpacity>
                        </>
                    )}
                    {offer.status !== 'OPEN' && offer.status !== 'PENDING_APPROVAL' && (
                        <View style={styles.actionFlex}>
                            <TouchableOpacity style={styles.iconActionDangerWide} onPress={() => handleDeleteOffer(offer.id)}>
                                <Trash2 size={16} color={c.error} strokeWidth={2} />
                                <Text style={styles.deleteWideText}>{t('common.delete')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
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
                    <EmptyState
                        icon={<Calendar size={24} color={c.primary} strokeWidth={2} />}
                        title={t('manage.noOffers')}
                        subtitle={t('manage.noOffersDesc')}
                        action={
                            <Button
                                title={t('manage.createOffer')}
                                icon={<Plus size={16} color={c.primaryInk} strokeWidth={2.5} />}
                                onPress={() => router.push('/match/create')}
                            />
                        }
                    />
                </View>

                {/* FAB */}
                <AnimatedPressable
                    style={styles.fab}
                    onPress={() => router.push('/match/create')}
                    scaleTo={0.9}
                >
                    <Plus size={26} color={c.primaryInk} strokeWidth={2.5} />
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
                        tintColor={c.primary}
                    />
                }
            >
                {renderHeader()}
                {renderFilters()}

                {/* Agenda (date-grouped) view */}
                {viewMode === 'calendar' && (
                    slotsByDate.length === 0 ? (
                        <EmptyState
                            icon={<Calendar size={24} color={c.primary} strokeWidth={2} />}
                            title={t('manage.noMatchesOnDay')}
                            style={{ marginTop: 20 }}
                        />
                    ) : (
                        <View style={styles.agenda}>
                            {(() => {
                                let lastDay: string | null = null;
                                return slotsByDate.map(({ slot, offer }) => {
                                    const day = slot.start_time.split('T')[0];
                                    const showHeader = day !== lastDay;
                                    lastDay = day;
                                    const past = isMatchPast(slot);
                                    return (
                                        <React.Fragment key={slot.id}>
                                            {showHeader && (
                                                <Text style={styles.kicker}>{formatDay(slot.start_time)}</Text>
                                            )}
                                            <AnimatedPressable
                                                scaleTo={0.98}
                                                onPress={() => router.push(`/match/detail/${slot.id}` as any)}
                                            >
                                                <View style={[styles.agendaCard, past && styles.offerCardPast]}>
                                                    <Crest
                                                        name={offer.host_club}
                                                        size={30}
                                                        shape="square"
                                                        muted={past}
                                                    />
                                                    <View style={styles.agendaInfo}>
                                                        <Text style={styles.agendaTitle} numberOfLines={1}>
                                                            {offer.age_group} · {offer.format}
                                                        </Text>
                                                        <Text style={styles.agendaTime} numberOfLines={1}>
                                                            {formatTimeRange(slot.start_time, slot.end_time)}
                                                        </Text>
                                                        <TouchableOpacity style={styles.agendaLocation} onPress={() => openInMaps(offer.location)}>
                                                            <MapPin size={12} color={c.primary} strokeWidth={2} />
                                                            <Text style={styles.agendaLocationText} numberOfLines={1}>{offer.location}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <StatusChip
                                                        kind={slotStatusKind(slot.status)}
                                                        label={t(getSlotLabelKey(slot.status))}
                                                    />
                                                </View>
                                            </AnimatedPressable>
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </View>
                    )
                )}

                {/* List view */}
                {viewMode === 'list' && (
                    filteredOffers.length === 0 ? (
                        <EmptyState
                            icon={<Calendar size={24} color={c.primary} strokeWidth={2} />}
                            title={t('manage.noOffers')}
                            subtitle={t('manage.noOffersDesc')}
                            style={{ marginTop: 20 }}
                        />
                    ) : (
                        <>
                            <Text style={styles.kicker}>{t('manage.yourMatches')}</Text>
                            {filteredOffers.map(renderOfferRow)}
                        </>
                    )
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <AnimatedPressable
                style={styles.fab}
                onPress={() => router.push('/match/create')}
                scaleTo={0.9}
            >
                <Plus size={26} color={c.primaryInk} strokeWidth={2.5} />
            </AnimatedPressable>
        </SafeAreaView>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
    const c = Colors[colorScheme];
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.background,
        },
        scrollContent: {
            padding: 20,
            paddingBottom: 110,
        },

        // Header
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
        },
        title: {
            fontFamily: Fonts.display,
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.8,
            color: c.text,
        },

        // Filter chips
        filterScroll: {
            marginBottom: 18,
            marginHorizontal: -20,
        },
        filterRow: {
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 20,
        },

        // Micro-label / kicker
        kicker: {
            fontFamily: Fonts.body,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: c.textMuted,
            marginBottom: 10,
            marginTop: 6,
        },

        // Offer row card
        offerCard: {
            backgroundColor: c.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: c.border,
            padding: 14,
            marginBottom: 12,
        },
        offerCardPast: {
            opacity: 0.72,
        },
        offerTop: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        offerTopInfo: {
            flex: 1,
            minWidth: 0,
        },
        offerTitle: {
            fontFamily: Fonts.body,
            fontSize: 14,
            fontWeight: '700',
            color: c.text,
        },
        offerMeta: {
            fontFamily: Fonts.body,
            fontSize: 11.5,
            fontWeight: '500',
            color: c.textMuted,
            marginTop: 2,
        },

        // Location
        offerLocation: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            marginTop: 12,
        },
        offerLocationText: {
            flex: 1,
            fontFamily: Fonts.body,
            fontSize: 12,
            fontWeight: '500',
            color: c.primary,
        },

        // Slots list
        slotList: {
            marginTop: 8,
            borderTopWidth: 1,
            borderTopColor: c.dividerFine,
        },
        slotRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 9,
        },
        slotTime: {
            flex: 1,
            fontFamily: Fonts.body,
            fontSize: 13,
            fontWeight: '500',
            color: c.text,
        },
        slotResultCta: {
            fontFamily: Fonts.body,
            fontSize: 12,
            fontWeight: '700',
            color: c.primary,
        },
        resultBadge: {
            backgroundColor: c.primaryTint,
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: 999,
        },
        resultText: {
            fontFamily: Fonts.display,
            fontSize: 13,
            fontWeight: '800',
            color: c.primary,
        },

        // Bottom line (pips + progress)
        offerBottom: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: c.dividerFine,
        },
        progressLabel: {
            flex: 1,
            fontFamily: Fonts.body,
            fontSize: 11.5,
            fontWeight: '600',
            color: c.textMuted,
        },

        // Actions
        actions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 12,
        },
        actionFlex: {
            flex: 1,
        },
        actionBtn: {
            height: 44,
        },
        iconAction: {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: c.primary,
        },
        iconActionDanger: {
            width: 44,
            height: 44,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: c.errorBorder,
        },
        iconActionDangerWide: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.errorBorder,
        },
        deleteWideText: {
            fontFamily: Fonts.body,
            fontSize: 14,
            fontWeight: '700',
            color: c.error,
        },
        pendingNote: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.warning,
            backgroundColor: 'rgba(232,168,58,0.08)',
            paddingHorizontal: 12,
        },
        pendingNoteText: {
            fontFamily: Fonts.body,
            fontSize: 13,
            fontWeight: '600',
            color: c.warningText,
        },

        // Agenda view
        agenda: {
            marginTop: 2,
        },
        agendaCard: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: c.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: c.border,
            padding: 14,
            marginBottom: 12,
        },
        agendaInfo: {
            flex: 1,
            minWidth: 0,
        },
        agendaTitle: {
            fontFamily: Fonts.body,
            fontSize: 14,
            fontWeight: '700',
            color: c.text,
        },
        agendaTime: {
            fontFamily: Fonts.body,
            fontSize: 12.5,
            fontWeight: '500',
            color: c.textSecondary,
            marginTop: 2,
        },
        agendaLocation: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 4,
        },
        agendaLocationText: {
            flex: 1,
            fontFamily: Fonts.body,
            fontSize: 11.5,
            fontWeight: '500',
            color: c.primary,
        },

        // Empty state wrapper
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
        },

        // FAB
        fab: {
            position: 'absolute',
            bottom: 90,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: c.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: c.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
        },
    });
};
