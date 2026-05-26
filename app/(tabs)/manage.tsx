import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ManageSkeleton } from '@/components/ui/SkeletonLoader';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { openInMaps } from '@/lib/mapsUtils';
import { canShareWhatsApp, copyLinkToClipboard, shareMatchLink, shareViaWhatsApp } from '@/lib/shareLink';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots, Slot, SlotStatus } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
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
                                maxLength={2}
                            />
                        </View>
                        <Text style={modalStyles.scoreSeparator}>-</Text>
                        <View style={modalStyles.scoreInput}>
                            <Text style={modalStyles.scoreLabel}>{t('common.away')}</Text>
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
                        placeholder={t('manage.matchNotes')}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={modalStyles.buttonRow}>
                        <Pressable style={modalStyles.cancelButton} onPress={onClose}>
                            <Text style={modalStyles.cancelText}>{t('common.cancel')}</Text>
                        </Pressable>
                        <Pressable style={modalStyles.saveButton} onPress={handleSave}>
                            <Text style={modalStyles.saveText}>{t('manage.saveResult')}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const getModalStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: Colors[colorScheme].backgroundAlt,
        borderRadius: 20,
        padding: 24,
        maxWidth: 340,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
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
        fontSize: 14,
        color: Colors[colorScheme].textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    scoreField: {
        width: 80,
        height: 60,
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        color: Colors[colorScheme].text,
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
        borderRadius: 16,
        backgroundColor: Colors[colorScheme].card,
    },
    scoreSeparator: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors[colorScheme].text,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
        borderRadius: 16,
        padding: 12,
        fontSize: 16,
        color: Colors[colorScheme].text,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
        backgroundColor: Colors[colorScheme].card,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        backgroundColor: Colors[colorScheme].secondary,
        minWidth: 100,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        color: Colors[colorScheme].textSecondary,
    },
    saveButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 16,
        backgroundColor: Colors[colorScheme].primary,
        minWidth: 100,
        shadowColor: Colors[colorScheme].primary,
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

// Slot status badge config
const getSlotBadgeConfig = (status: SlotStatus, colorScheme: 'light' | 'dark') => {
    switch (status) {
        case 'OPEN':
            return {
                icon: 'radio-button-on' as const,
                color: Colors[colorScheme].success,
                bg: 'rgba(34,197,94,0.12)',
                labelKey: 'manage.awaitingBooking',
            };
        case 'HELD':
            return {
                icon: 'pause-circle' as const,
                color: '#FFA500',
                bg: 'rgba(255,165,0,0.12)',
                labelKey: 'manage.held',
            };
        case 'PENDING_APPROVAL':
            return {
                icon: 'hourglass' as const,
                color: Colors[colorScheme].warning,
                bg: 'rgba(251,191,36,0.12)',
                labelKey: 'manage.pending',
            };
        case 'BOOKED':
            return {
                icon: 'checkmark-circle' as const,
                color: Colors[colorScheme].primary,
                bg: colorScheme === 'dark' ? 'rgba(74,222,128,0.15)' : 'rgba(27,139,78,0.12)',
                labelKey: 'manage.booked',
            };
        case 'REJECTED':
            return {
                icon: 'close-circle' as const,
                color: Colors[colorScheme].error,
                bg: 'rgba(239,68,68,0.12)',
                labelKey: 'manage.rejected',
            };
        default:
            return {
                icon: 'ellipse' as const,
                color: Colors[colorScheme].textSecondary,
                bg: 'rgba(168,162,158,0.08)',
                labelKey: status as string,
            };
    }
};

export default function ManageScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);
    const { user } = useAuth();
    const [offers, setOffers] = useState<MatchOfferWithSlots[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
    const [whatsAppAvailable, setWhatsAppAvailable] = useState(false);

    // Results modal state
    const [resultsModalVisible, setResultsModalVisible] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

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

    // Calendar: build marked dates from all slots
    const markedDates = React.useMemo(() => {
        const marks: Record<string, any> = {};
        offers.forEach(offer => {
            offer.slots.forEach(slot => {
                const day = slot.start_time.split('T')[0];
                const badge = getSlotBadgeConfig(slot.status, colorScheme);
                if (!marks[day]) marks[day] = { dots: [], marked: true };
                marks[day].dots.push({ color: badge.color, key: slot.id });
            });
        });
        // Highlight selected date
        if (selectedCalDate) {
            marks[selectedCalDate] = {
                ...(marks[selectedCalDate] || {}),
                selected: true,
                selectedColor: Colors[colorScheme].primary,
            };
        }
        return marks;
    }, [offers, selectedCalDate, colorScheme]);

    const slotsForSelectedDate = React.useMemo(() => {
        if (!selectedCalDate) return [];
        return offers.flatMap(offer =>
            offer.slots
                .filter(s => s.start_time.startsWith(selectedCalDate))
                .map(s => ({ slot: s, offer }))
        );
    }, [offers, selectedCalDate]);

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
                    <View style={styles.emptyIconWrap}>
                        <Ionicons name="football-outline" size={44} color={Colors[colorScheme].primary} />
                    </View>
                    <Text style={styles.emptyTitle}>{t('manage.noOffers')}</Text>
                    <Text style={styles.emptySubtitle}>{t('manage.noOffersDesc')}</Text>
                    <Button
                        title={t('manage.createOffer')}
                        onPress={() => router.push('/match/create')}
                        style={{ marginTop: 12 }}
                    />
                </View>

                {/* FAB */}
                <AnimatedPressable
                    style={styles.fab}
                    onPress={() => router.push('/match/create')}
                    scaleTo={0.9}
                >
                    <Ionicons name="add" size={28} color="#fff" />
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
                        tintColor={Colors[colorScheme].primary}
                    />
                }
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>{t('manage.title')}</Text>
                        <Text style={styles.subtitle}>
                            {offers.length} {offers.length === 1 ? t('common.offer') : t('common.offers')}
                        </Text>
                    </View>
                    <View style={styles.viewToggle}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                            onPress={() => setViewMode('list')}
                        >
                            <Ionicons name="list" size={18} color={viewMode === 'list' ? '#fff' : Colors[colorScheme].textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
                            onPress={() => setViewMode('calendar')}
                        >
                            <Ionicons name="calendar" size={18} color={viewMode === 'calendar' ? '#fff' : Colors[colorScheme].textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Calendar View */}
                {viewMode === 'calendar' && (
                    <View style={styles.calendarContainer}>
                        <Calendar
                            markingType="multi-dot"
                            markedDates={markedDates}
                            onDayPress={(day) => setSelectedCalDate(day.dateString)}
                            theme={{
                                backgroundColor: 'transparent',
                                calendarBackground: 'transparent',
                                textSectionTitleColor: Colors[colorScheme].textSecondary,
                                selectedDayBackgroundColor: Colors[colorScheme].primary,
                                selectedDayTextColor: '#fff',
                                todayTextColor: Colors[colorScheme].primary,
                                dayTextColor: Colors[colorScheme].text,
                                textDisabledColor: Colors[colorScheme].textTertiary,
                                dotColor: Colors[colorScheme].primary,
                                monthTextColor: Colors[colorScheme].text,
                                arrowColor: Colors[colorScheme].primary,
                            }}
                        />
                        {selectedCalDate && slotsForSelectedDate.length > 0 && (
                            <View style={styles.calDateSlots}>
                                <Text style={styles.calDateTitle}>
                                    {new Date(selectedCalDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </Text>
                                {slotsForSelectedDate.map(({ slot, offer }) => {
                                    const badge = getSlotBadgeConfig(slot.status, colorScheme);
                                    return (
                                        <AnimatedPressable
                                            key={slot.id}
                                            scaleTo={0.98}
                                            onPress={() => router.push(`/match/detail/${slot.id}` as any)}
                                        >
                                            <Card style={styles.calSlotCard}>
                                                <View style={styles.calSlotRow}>
                                                    <View>
                                                        <Text style={styles.calSlotTitle}>{offer.age_group} • {offer.format}</Text>
                                                        <Text style={styles.calSlotTime}>
                                                            {new Date(slot.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                            {' – '}
                                                            {new Date(slot.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                        </Text>
                                                        <TouchableOpacity onPress={() => openInMaps(offer.location)} style={styles.calSlotLocation}>
                                                            <Ionicons name="location-outline" size={13} color={Colors[colorScheme].primary} />
                                                            <Text style={styles.calSlotLocationText} numberOfLines={1}>{offer.location}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={[styles.slotStatusPill, { backgroundColor: badge.bg }]}>
                                                        <Ionicons name={badge.icon} size={12} color={badge.color} />
                                                        <Text style={[styles.slotStatusText, { color: badge.color }]}>{t(badge.labelKey)}</Text>
                                                    </View>
                                                </View>
                                            </Card>
                                        </AnimatedPressable>
                                    );
                                })}
                            </View>
                        )}
                        {selectedCalDate && slotsForSelectedDate.length === 0 && (
                            <Text style={styles.calNoSlots}>{t('manage.noMatchesOnDay')}</Text>
                        )}
                    </View>
                )}

                {viewMode === 'list' && offers.map((offer) => (
                    <View key={offer.id} style={styles.scoreboardCard}>
                        {/* Scoreboard Header — dark strip */}
                        <View style={styles.scoreboardHeader}>
                            <View style={styles.scoreboardTeamSide}>
                                <Text style={styles.scoreboardTeamLabel}>HOST</Text>
                                <Text style={styles.scoreboardTeamName} numberOfLines={1}>
                                    {offer.host_club || 'Your Team'}
                                </Text>
                            </View>
                            <View style={styles.scoreboardCenter}>
                                <Text style={styles.scoreboardFormat}>{offer.format}</Text>
                                <Text style={styles.scoreboardAge}>{offer.age_group}</Text>
                            </View>
                            <View style={[styles.scoreboardTeamSide, { alignItems: 'flex-end' }]}>
                                <Text style={styles.scoreboardTeamLabel}>SLOTS</Text>
                                <Text style={styles.scoreboardSlotCount}>
                                    {offer.slots.filter(s => s.status === 'BOOKED').length}/{offer.slots.length}
                                </Text>
                            </View>
                        </View>

                        {/* Status LED strip */}
                        <View style={[styles.scoreboardLED, {
                            backgroundColor: offer.status === 'OPEN' ? 'rgba(34,197,94,0.12)' :
                                offer.status === 'PENDING_APPROVAL' ? 'rgba(251,191,36,0.12)' : 'rgba(168,162,158,0.08)',
                        }]}>
                            <View style={[styles.ledDot, {
                                backgroundColor: offer.status === 'OPEN' ? Colors[colorScheme].success :
                                    offer.status === 'PENDING_APPROVAL' ? Colors[colorScheme].warning : Colors[colorScheme].textSecondary,
                            }]} />
                            <Text style={[styles.ledText, {
                                color: offer.status === 'OPEN' ? Colors[colorScheme].success :
                                    offer.status === 'PENDING_APPROVAL' ? Colors[colorScheme].warning : Colors[colorScheme].textSecondary,
                            }]}>
                                {offer.status === 'PENDING_APPROVAL' ? t('manage.awaitingApproval') : offer.status}
                            </Text>
                            <TouchableOpacity style={styles.ledRight} onPress={() => openInMaps(offer.location)}>
                                <Ionicons name="location-outline" size={12} color={Colors[colorScheme].primary} />
                                <Text style={[styles.ledLocation, { color: Colors[colorScheme].primary }]} numberOfLines={1}>{offer.location}</Text>
                                <Ionicons name="navigate-outline" size={11} color={Colors[colorScheme].primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Slots body */}
                        <View style={styles.scoreboardBody}>
                            <Text style={styles.scoreboardSlotsTitle}>
                                {offer.duration} {t('common.minutes')}  •  {offer.slots.length} {offer.slots.length === 1 ? t('common.slot') : t('common.slots')}
                            </Text>
                            {offer.slots.map((slot) => {
                                const badge = getSlotBadgeConfig(slot.status, colorScheme);
                                return (
                                    <AnimatedPressable
                                        key={slot.id}
                                        onPress={() => router.push(`/match/detail/${slot.id}` as any)}
                                        scaleTo={0.98}
                                    >
                                        <View style={styles.slotRow}>
                                            <View style={styles.slotInfo}>
                                                <Ionicons name="time-outline" size={16} color={Colors[colorScheme].textSecondary} />
                                                <Text style={styles.slotTime}>
                                                    {formatDateTime(slot.start_time)}
                                                </Text>
                                            </View>
                                            <View style={styles.slotStatusRow}>
                                                <View style={[styles.slotStatusPill, { backgroundColor: badge.bg }]}>
                                                    <Ionicons name={badge.icon} size={12} color={badge.color} />
                                                    <Text style={[styles.slotStatusText, { color: badge.color }]}>
                                                        {t(badge.labelKey)}
                                                    </Text>
                                                </View>
                                                {slot.guest_club && (
                                                    <Text style={styles.guestClub}> vs {slot.guest_club}</Text>
                                                )}
                                            </View>

                                            {slot.result_saved_at ? (
                                                <View style={styles.resultBadge}>
                                                    <Text style={styles.resultText}>
                                                        {slot.home_score} - {slot.away_score}
                                                    </Text>
                                                </View>
                                            ) : canSaveResults(slot) ? (
                                                <View style={styles.saveResultButton}>
                                                    <Ionicons name="create-outline" size={14} color={Colors[colorScheme].primary} />
                                                    <Text style={styles.saveResultText}>{t('manage.result')}</Text>
                                                </View>
                                            ) : (
                                                <Ionicons name="chevron-forward" size={16} color={Colors[colorScheme].textTertiary} />
                                            )}
                                        </View>
                                    </AnimatedPressable>
                                );
                            })}
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            {offer.status === 'PENDING_APPROVAL' ? (
                                <>
                                    <View style={[styles.actionButton, styles.pendingButton]}>
                                        <Ionicons name="hourglass-outline" size={20} color={Colors[colorScheme].warning} />
                                        <Text style={[styles.actionButtonText, { color: Colors[colorScheme].warning }]}>
                                            {t('manage.waitingApprover')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => handleDeleteOffer(offer.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors[colorScheme].error} />
                                    </TouchableOpacity>
                                </>
                            ) : offer.status === 'OPEN' ? (
                                <>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleShareLink(offer)}
                                    >
                                        <Ionicons name="share-outline" size={20} color={Colors[colorScheme].primary} />
                                        <Text style={styles.actionButtonText}>{t('manage.shareLink')}</Text>
                                    </TouchableOpacity>

                                    {whatsAppAvailable && (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.whatsappButton]}
                                            onPress={() => handleWhatsApp(offer)}
                                        >
                                            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                                        </TouchableOpacity>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => handleDeleteOffer(offer.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors[colorScheme].error} />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={[styles.actionButton, { borderColor: Colors[colorScheme].textSecondary }]}>
                                        <Ionicons name="checkmark-done" size={20} color={Colors[colorScheme].textSecondary} />
                                        <Text style={[styles.actionButtonText, { color: Colors[colorScheme].textSecondary }]}>
                                            {offer.status === 'CLOSED' ? t('manage.matchBooked') : t('manage.cancelled')}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.closeButton]}
                                        onPress={() => handleDeleteOffer(offer.id)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={Colors[colorScheme].error} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Floating Action Button */}
            <AnimatedPressable
                style={styles.fab}
                onPress={() => router.push('/match/create')}
                scaleTo={0.9}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </AnimatedPressable>
        </SafeAreaView>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors[colorScheme].background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors[colorScheme].text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: Colors[colorScheme].textSecondary,
    },

    // Enhanced empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors[colorScheme].secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors[colorScheme].text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors[colorScheme].textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },

    // Scoreboard Card
    scoreboardCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: Colors[colorScheme].card,
        borderWidth: colorScheme === 'dark' ? 1 : 0,
        borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'transparent',
        shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(27,139,78,0.12)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 4,
    },
    scoreboardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colorScheme === 'dark' ? '#0A1F12' : '#1A2E1A',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    scoreboardTeamSide: {
        flex: 1,
    },
    scoreboardTeamLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1.5,
        marginBottom: 2,
    },
    scoreboardTeamName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scoreboardCenter: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    scoreboardFormat: {
        fontSize: 20,
        fontWeight: '800',
        color: '#4ADE80',
        letterSpacing: 1,
    },
    scoreboardAge: {
        fontSize: 11,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        marginTop: 1,
    },
    scoreboardSlotCount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#4ADE80',
    },
    scoreboardLED: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 6,
    },
    ledDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    ledText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    ledRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        justifyContent: 'flex-end',
    },
    ledLocation: {
        fontSize: 11,
        color: Colors[colorScheme].textSecondary,
        maxWidth: 140,
    },
    scoreboardBody: {
        padding: 16,
    },
    scoreboardSlotsTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors[colorScheme].textSecondary,
        marginBottom: 10,
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
        color: Colors[colorScheme].text,
    },
    slotStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    slotStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    slotStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    guestClub: {
        fontSize: 13,
        color: Colors[colorScheme].textSecondary,
    },
    resultBadge: {
        backgroundColor: Colors[colorScheme].primary,
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
        borderColor: Colors[colorScheme].primary,
    },
    saveResultText: {
        color: Colors[colorScheme].primary,
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
        borderRadius: 16,
        backgroundColor: Colors[colorScheme].secondary,
        borderWidth: 1,
        borderColor: Colors[colorScheme].primary,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors[colorScheme].primary,
    },
    closeButton: {
        borderColor: Colors[colorScheme].error,
        flex: 0,
        paddingHorizontal: 12,
    },
    pendingButton: {
        borderColor: Colors[colorScheme].warning,
        backgroundColor: 'rgba(251,191,36,0.08)',
    },
    closeButtonText: {
        color: Colors[colorScheme].error,
    },

    // Header toggle
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: Colors[colorScheme].card,
        borderRadius: 10,
        padding: 3,
        gap: 2,
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
    },
    toggleBtn: {
        padding: 6,
        borderRadius: 8,
    },
    toggleBtnActive: {
        backgroundColor: Colors[colorScheme].primary,
    },

    // WhatsApp button
    whatsappButton: {
        flex: 0,
        paddingHorizontal: 12,
        borderColor: '#25D366',
    },

    // Calendar
    calendarContainer: {
        marginBottom: 16,
    },
    calDateSlots: {
        marginTop: 12,
        gap: 8,
    },
    calDateTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors[colorScheme].text,
        marginBottom: 4,
    },
    calSlotCard: {
        padding: 12,
    },
    calSlotRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    calSlotTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors[colorScheme].text,
        marginBottom: 2,
    },
    calSlotTime: {
        fontSize: 13,
        color: Colors[colorScheme].textSecondary,
        marginBottom: 2,
    },
    calSlotLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    calSlotLocationText: {
        fontSize: 12,
        color: Colors[colorScheme].primary,
        maxWidth: 180,
    },
    calNoSlots: {
        textAlign: 'center',
        color: Colors[colorScheme].textTertiary,
        fontSize: 14,
        marginTop: 16,
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors[colorScheme].primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors[colorScheme].primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
});
