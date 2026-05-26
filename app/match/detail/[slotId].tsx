import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { addMatchToCalendar } from '@/lib/calendarUtils';
import { scheduleMatchReminders } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { MatchOffer, Slot } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SlotDetailScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);
    const { t } = useTranslation();
    const { slotId } = useLocalSearchParams<{ slotId: string }>();

    const [slot, setSlot] = useState<Slot | null>(null);
    const [offer, setOffer] = useState<MatchOffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Result form
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');
    const [resultNotes, setResultNotes] = useState('');
    const [manOfMatch, setManOfMatch] = useState('');
    const [goalScorers, setGoalScorers] = useState('');

    useEffect(() => {
        loadData();
    }, [slotId]);

    const loadData = async () => {
        try {
            const { data: slotData, error: slotError } = await supabase
                .from('slots')
                .select('*')
                .eq('id', slotId)
                .single();
            if (slotError) throw slotError;

            const { data: offerData, error: offerError } = await supabase
                .from('match_offers')
                .select('*')
                .eq('id', slotData.match_offer_id)
                .single();
            if (offerError) throw offerError;

            setSlot(slotData);
            setOffer(offerData);

            // Populate form from existing data
            setHomeScore(slotData.home_score?.toString() ?? '');
            setAwayScore(slotData.away_score?.toString() ?? '');
            setResultNotes(slotData.result_notes ?? '');
            setManOfMatch(slotData.man_of_match ?? '');
            setGoalScorers(slotData.goal_scorers ?? '');
        } catch (e: any) {
            console.error(e);
            Alert.alert(t('common.error'), t('detail.failedLoad'));
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!slot) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('slots')
                .update({
                    home_score: homeScore ? parseInt(homeScore) : null,
                    away_score: awayScore ? parseInt(awayScore) : null,
                    result_notes: resultNotes || null,
                    man_of_match: manOfMatch || null,
                    goal_scorers: goalScorers || null,
                    result_saved_at: new Date().toISOString(),
                })
                .eq('id', slot.id);

            if (error) throw error;
            Alert.alert(t('detail.saved'), t('detail.resultSaved'));
            router.back();
        } catch (e: any) {
            Alert.alert(t('common.error'), t('detail.failedSave') + ': ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const isMatchPast = slot ? new Date(slot.end_time) < new Date() : false;
    const isUpcoming = slot ? new Date(slot.start_time) > new Date() : false;
    const canEdit = slot?.status === 'BOOKED';

    // Auto-schedule local reminder when viewing an upcoming booked match (host side)
    useEffect(() => {
        if (slot?.status === 'BOOKED' && isUpcoming && offer) {
            const title = `${offer.age_group} ${offer.format} — ${slot.guest_club || 'Opponent'} vs ${offer.host_club || offer.host_name}`;
            scheduleMatchReminders(slot.id, slot.start_time, title, offer.location);
        }
    }, [slot?.id, slot?.status]);

    const handleAddToCalendar = async () => {
        if (!slot || !offer) return;
        const title = `${offer.age_group} ${offer.format} — ${slot.guest_club || 'Opponent'} vs ${offer.host_club || offer.host_name}`;
        const success = await addMatchToCalendar(
            slot.start_time, slot.end_time, title, offer.location,
            `Host: ${offer.host_name}\nGuest: ${slot.guest_name || 'TBD'}`
        );
        if (success) Alert.alert(t('detail.saved'), t('calendar.added'));
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
            </View>
        );
    }

    if (!slot || !offer) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors[colorScheme].error} />
                <Text style={styles.errorText}>{t('detail.slotNotFound')}</Text>
            </View>
        );
    }

    const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
        OPEN: { color: Colors[colorScheme].success, label: t('detail.openForBooking'), icon: 'radio-button-on' },
        HELD: { color: '#FFA500', label: t('manage.held'), icon: 'pause-circle' },
        PENDING_APPROVAL: { color: Colors[colorScheme].warning, label: t('offer.pendingApproval'), icon: 'hourglass' },
        BOOKED: { color: Colors[colorScheme].primary, label: t('manage.booked'), icon: 'checkmark-circle' },
        REJECTED: { color: Colors[colorScheme].error, label: t('offer.notAvailable'), icon: 'close-circle' },
    };
    const status = statusConfig[slot.status] || { color: Colors[colorScheme].textSecondary, label: slot.status, icon: 'ellipse' };

    return (
        <>
            <Stack.Screen options={{
                title: t('detail.title'),
                headerBackTitle: t('common.back'),
                headerTitleStyle: { fontWeight: '700', fontSize: 18, color: Colors[colorScheme].text },
                headerShadowVisible: false,
                headerStyle: { backgroundColor: Colors[colorScheme].background },
                headerTintColor: Colors[colorScheme].text,
            }} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Scoreboard Header */}
                    <View style={styles.scoreboard}>
                        <View style={styles.teamSide}>
                            <Text style={styles.teamLabel}>{t('detail.host')}</Text>
                            <Text style={styles.teamName} numberOfLines={1}>
                                {offer.host_club || offer.host_name}
                            </Text>
                        </View>
                        <View style={styles.scoreCenter}>
                            {slot.result_saved_at ? (
                                <>
                                    <Text style={styles.scoreDisplay}>
                                        {slot.home_score ?? 0}  -  {slot.away_score ?? 0}
                                    </Text>
                                    <Text style={styles.scoreSubtext}>{t('detail.fullTime')}</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.formatDisplay}>{offer.format}</Text>
                                    <Text style={styles.ageDisplay}>{offer.age_group}</Text>
                                </>
                            )}
                        </View>
                        <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
                            <Text style={styles.teamLabel}>{t('detail.guest')}</Text>
                            <Text style={styles.teamName} numberOfLines={1}>
                                {slot.guest_club || t('detail.tbd')}
                            </Text>
                        </View>
                    </View>

                    {/* Status Strip */}
                    <View style={[styles.statusStrip, { backgroundColor: status.color + '18' }]}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>

                    {/* Match Info */}
                    <Card style={styles.infoCard}>
                        <InfoRow icon="calendar-outline" label={t('detail.dateTime')} value={formatDateTime(slot.start_time)} colorScheme={colorScheme} />
                        <InfoRow icon="time-outline" label={t('detail.kickoff')} value={`${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`} colorScheme={colorScheme} />
                        <InfoRow icon="location-outline" label={t('detail.location')} value={offer.location} colorScheme={colorScheme} />
                        <InfoRow icon="football-outline" label={t('detail.format')} value={`${offer.format} • ${offer.age_group}`} colorScheme={colorScheme} />
                        <InfoRow icon="timer-outline" label={t('detail.duration')} value={`${offer.duration} ${t('common.minutes')}`} colorScheme={colorScheme} last />
                    </Card>

                    {/* Add to Calendar */}
                    {slot.status === 'BOOKED' && isUpcoming && (
                        <Button
                            title={t('calendar.addToCalendar')}
                            onPress={handleAddToCalendar}
                            variant="secondary"
                            style={{ marginBottom: 4, marginTop: 8 }}
                        />
                    )}

                    {/* Guest Team Info */}
                    {slot.guest_name && (
                        <>
                            <Text style={styles.sectionTitle}>{t('detail.guestTeam')}</Text>
                            <Card style={styles.infoCard}>
                                <InfoRow icon="person-outline" label={t('detail.coach')} value={slot.guest_name} colorScheme={colorScheme} />
                                <InfoRow icon="shield-outline" label={t('detail.club')} value={slot.guest_club || '-'} colorScheme={colorScheme} />
                                <InfoRow icon="call-outline" label={t('detail.contact')} value={slot.guest_contact || '-'} colorScheme={colorScheme} />
                                {slot.guest_notes && (
                                    <InfoRow icon="document-text-outline" label={t('detail.notes')} value={slot.guest_notes} colorScheme={colorScheme} last />
                                )}
                                {!slot.guest_notes && <View />}
                            </Card>
                        </>
                    )}

                    {/* Result Form */}
                    {canEdit && (
                        <>
                            <Text style={styles.sectionTitle}>
                                {slot.result_saved_at ? t('detail.editResult') : isMatchPast ? t('detail.addResult') : t('detail.matchResult')}
                            </Text>

                            {!isMatchPast && !slot.result_saved_at && (
                                <View style={styles.infoBanner}>
                                    <Ionicons name="information-circle-outline" size={20} color={Colors[colorScheme].warning} />
                                    <Text style={styles.infoBannerText}>
                                        {t('detail.notStarted')}
                                    </Text>
                                </View>
                            )}

                            <Card style={styles.resultCard}>
                                {/* Score Inputs */}
                                <View style={styles.scoreRow}>
                                    <View style={styles.scoreInput}>
                                        <Text style={styles.scoreLabel}>{t('common.home')}</Text>
                                        <TextInput
                                            style={styles.scoreField}
                                            value={homeScore}
                                            onChangeText={setHomeScore}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor={Colors[colorScheme].textTertiary}
                                            maxLength={2}
                                        />
                                    </View>
                                    <Text style={styles.scoreSeparator}>-</Text>
                                    <View style={styles.scoreInput}>
                                        <Text style={styles.scoreLabel}>{t('common.away')}</Text>
                                        <TextInput
                                            style={styles.scoreField}
                                            value={awayScore}
                                            onChangeText={setAwayScore}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor={Colors[colorScheme].textTertiary}
                                            maxLength={2}
                                        />
                                    </View>
                                </View>

                                {/* Extra Result Fields */}
                                <Input
                                    label={t('detail.manOfMatch')}
                                    placeholder={t('detail.playerName')}
                                    value={manOfMatch}
                                    onChangeText={setManOfMatch}
                                    icon="trophy-outline"
                                />

                                <Input
                                    label={t('detail.goalScorers')}
                                    placeholder={t('detail.goalScorersPlaceholder')}
                                    value={goalScorers}
                                    onChangeText={setGoalScorers}
                                    icon="football-outline"
                                    multiline
                                    numberOfLines={2}
                                />

                                <View style={styles.notesWrapper}>
                                    <Text style={styles.notesLabel}>{t('detail.matchNotes')}</Text>
                                    <TextInput
                                        style={styles.notesInput}
                                        value={resultNotes}
                                        onChangeText={setResultNotes}
                                        placeholder={t('detail.matchNotesPlaceholder')}
                                        placeholderTextColor={Colors[colorScheme].textTertiary}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                <Button
                                    title={t('detail.saveResult')}
                                    onPress={handleSave}
                                    loading={saving}
                                />

                                {slot.result_saved_at && (
                                    <Text style={styles.lastSaved}>
                                        {t('detail.lastSaved')}: {new Date(slot.result_saved_at).toLocaleDateString('en-GB', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </Text>
                                )}
                            </Card>
                        </>
                    )}

                    {/* Status messages for non-booked slots */}
                    {slot.status === 'OPEN' && (
                        <Card style={styles.messageCard}>
                            <Ionicons name="hourglass-outline" size={32} color={Colors[colorScheme].primary} />
                            <Text style={styles.messageTitle}>{t('detail.awaitingBooking')}</Text>
                            <Text style={styles.messageSubtext}>{t('detail.awaitingBookingDesc')}</Text>
                        </Card>
                    )}
                    {slot.status === 'REJECTED' && (
                        <Card style={styles.messageCard}>
                            <Ionicons name="close-circle-outline" size={32} color={Colors[colorScheme].error} />
                            <Text style={styles.messageTitle}>{t('detail.slotRejected')}</Text>
                            <Text style={styles.messageSubtext}>{t('detail.slotRejectedDesc')}</Text>
                        </Card>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

function InfoRow({ icon, label, value, colorScheme, last }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    colorScheme: 'light' | 'dark';
    last?: boolean;
}) {
    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
            paddingVertical: 10,
            borderBottomWidth: last ? 0 : 1,
            borderBottomColor: Colors[colorScheme].border,
        }}>
            <Ionicons name={icon} size={20} color={Colors[colorScheme].primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: Colors[colorScheme].textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                    {label}
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '500', color: Colors[colorScheme].text }}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors[colorScheme].background,
    },
    center: {
        flex: 1,
        backgroundColor: Colors[colorScheme].background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: Colors[colorScheme].error,
        marginTop: 12,
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },

    // Scoreboard header
    scoreboard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colorScheme === 'dark' ? '#0A1F12' : '#1A2E1A',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 16,
    },
    teamSide: {
        flex: 1,
    },
    teamLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    teamName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    scoreCenter: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    scoreDisplay: {
        fontSize: 28,
        fontWeight: '800',
        color: '#4ADE80',
        letterSpacing: 2,
    },
    scoreSubtext: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    formatDisplay: {
        fontSize: 22,
        fontWeight: '800',
        color: '#4ADE80',
        letterSpacing: 1,
    },
    ageDisplay: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },

    // Status strip
    statusStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Info card
    infoCard: {
        padding: 16,
        marginBottom: 4,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors[colorScheme].text,
        marginTop: 16,
        marginBottom: 8,
    },

    // Result form
    resultCard: {
        padding: 20,
        marginBottom: 16,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
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
        marginTop: 24,
    },
    notesWrapper: {
        marginBottom: 16,
    },
    notesLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors[colorScheme].textSecondary,
        marginBottom: 8,
        letterSpacing: 0.3,
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
        backgroundColor: Colors[colorScheme].card,
    },
    lastSaved: {
        fontSize: 12,
        color: Colors[colorScheme].textTertiary,
        textAlign: 'center',
        marginTop: 12,
    },

    // Info banner
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(251,191,36,0.08)',
        borderColor: 'rgba(251,191,36,0.3)',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        color: Colors[colorScheme].text,
        lineHeight: 18,
    },

    // Message cards
    messageCard: {
        padding: 32,
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    messageTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors[colorScheme].text,
    },
    messageSubtext: {
        fontSize: 13,
        color: Colors[colorScheme].textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
});
