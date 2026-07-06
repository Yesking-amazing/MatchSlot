import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Crest } from '@/components/ui/Crest';
import { Input } from '@/components/ui/Input';
import { StatusChip, slotStatusKind } from '@/components/ui/StatusChip';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { addMatchToCalendar } from '@/lib/calendarUtils';
import { scheduleMatchReminders } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { MatchOffer, Slot } from '@/types/database';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, ArrowLeft, Award, CalendarDays, CalendarPlus, CheckCircle, Clock, Hourglass, MapPin, Timer, User, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SlotDetailScreen() {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    const styles = getStyles(scheme);
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
            weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
        });
    };
    const formatTime = (dateStr: string) =>
        new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const formatShortDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();

    const isMatchPast = slot ? new Date(slot.end_time) < new Date() : false;
    const isUpcoming = slot ? new Date(slot.start_time) > new Date() : false;
    const canEdit = slot?.status === 'BOOKED';

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
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    if (!slot || !offer) {
        return (
            <View style={styles.center}>
                <AlertCircle size={56} color={c.error} strokeWidth={2} />
                <Text style={styles.errorText}>{t('detail.slotNotFound')}</Text>
            </View>
        );
    }

    const played = !!slot.result_saved_at;
    const guestName = slot.guest_club || slot.guest_name;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backCircle} onPress={() => router.back()} hitSlop={8}>
                    <ArrowLeft size={18} color={c.text} strokeWidth={2} />
                </Pressable>
                <Text style={styles.headerTitle}>{t('detail.title')}</Text>
                <View style={{ width: 34 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Fixture card */}
                    <View style={styles.fixture}>
                        <Text style={styles.fixtureKicker}>{offer.age_group} · {offer.format}</Text>
                        <View style={styles.fixtureRow}>
                            <View style={styles.fixtureTeam}>
                                <Crest name={offer.host_club || offer.host_name} size={50} shape="circle" />
                                <Text style={styles.fixtureTeamName} numberOfLines={1}>{offer.host_club || offer.host_name}</Text>
                                <Text style={styles.fixtureSide}>{t('detail.host')}</Text>
                            </View>

                            <View style={styles.fixtureCenter}>
                                {played ? (
                                    <>
                                        <View style={styles.scoreRowDisplay}>
                                            <Text style={styles.scoreNum}>{slot.home_score ?? 0}</Text>
                                            <Text style={styles.scoreDash}>–</Text>
                                            <Text style={styles.scoreNum}>{slot.away_score ?? 0}</Text>
                                        </View>
                                        <Text style={styles.fixtureSub}>{t('detail.fullTime')}</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.kickoff}>{formatTime(slot.start_time)}</Text>
                                        <Text style={styles.fixtureSub}>{formatShortDate(slot.start_time)}</Text>
                                    </>
                                )}
                            </View>

                            <View style={styles.fixtureTeam}>
                                <Crest name={guestName} size={50} shape="circle" muted={!guestName} />
                                <Text style={styles.fixtureTeamName} numberOfLines={1}>{guestName || t('detail.tbd')}</Text>
                                <Text style={styles.fixtureSide}>{t('detail.guest')}</Text>
                            </View>
                        </View>

                        <View style={styles.fixturePill}>
                            <StatusChip kind={slotStatusKind(slot.status)} label={statusLabel(slot.status, t)} />
                        </View>
                    </View>

                    {/* Info list */}
                    <Card radius={16} padding={4} style={{ marginTop: 4 }}>
                        <InfoRow Icon={CalendarDays} label={t('detail.dateTime')} value={formatDateTime(slot.start_time)} scheme={scheme} first />
                        <InfoRow Icon={Clock} label={t('detail.kickoff')} value={`${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`} scheme={scheme} />
                        <InfoRow Icon={MapPin} label={t('detail.location')} value={offer.location} scheme={scheme} />
                        <InfoRow Icon={Timer} label={t('detail.duration')} value={`${offer.duration} ${t('common.minutes')}`} scheme={scheme} />
                        <InfoRow Icon={User} label={t('detail.host')} value={offer.host_club || offer.host_name} scheme={scheme} last />
                    </Card>

                    {/* Add to calendar */}
                    {slot.status === 'BOOKED' && isUpcoming && (
                        <Button
                            title={t('calendar.addToCalendar')}
                            onPress={handleAddToCalendar}
                            variant="secondary"
                            icon={<CalendarPlus size={16} color={c.primary} strokeWidth={2} />}
                            style={{ marginBottom: 4, marginTop: 8 }}
                        />
                    )}

                    {/* Guest team info */}
                    {slot.guest_name && (
                        <>
                            <Text style={styles.kicker}>{t('detail.guestTeam')}</Text>
                            <Card radius={16} padding={4}>
                                <InfoRow Icon={User} label={t('detail.coach')} value={slot.guest_name} scheme={scheme} first />
                                <InfoRow Icon={Award} label={t('detail.club')} value={slot.guest_club || '-'} scheme={scheme} />
                                <InfoRow Icon={MapPin} label={t('detail.contact')} value={slot.guest_contact || '-'} scheme={scheme} last={!slot.guest_notes} />
                                {slot.guest_notes ? <InfoRow Icon={AlertCircle} label={t('detail.notes')} value={slot.guest_notes} scheme={scheme} last /> : null}
                            </Card>
                        </>
                    )}

                    {/* Result record / form */}
                    {canEdit && (
                        <>
                            <Text style={styles.kicker}>
                                {played ? t('detail.editResult') : isMatchPast ? t('detail.addResult') : t('detail.matchResult')}
                            </Text>

                            {!isMatchPast && !played && (
                                <View style={styles.infoBanner}>
                                    <Hourglass size={16} color={c.warningText} strokeWidth={2} />
                                    <Text style={styles.infoBannerText}>{t('detail.notStarted')}</Text>
                                </View>
                            )}

                            <Card radius={16} padding={18} style={{ marginBottom: 16 }}>
                                <View style={styles.scoreRow}>
                                    <View style={styles.scoreInput}>
                                        <Text style={styles.scoreFieldLabel}>{t('common.home')}</Text>
                                        <TextInput
                                            style={styles.scoreField}
                                            value={homeScore}
                                            onChangeText={setHomeScore}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor={c.textTertiary}
                                            maxLength={2}
                                        />
                                    </View>
                                    <Text style={styles.scoreSeparator}>–</Text>
                                    <View style={styles.scoreInput}>
                                        <Text style={styles.scoreFieldLabel}>{t('common.away')}</Text>
                                        <TextInput
                                            style={styles.scoreField}
                                            value={awayScore}
                                            onChangeText={setAwayScore}
                                            keyboardType="number-pad"
                                            placeholder="0"
                                            placeholderTextColor={c.textTertiary}
                                            maxLength={2}
                                        />
                                    </View>
                                </View>

                                <Input
                                    label={t('detail.manOfMatch')}
                                    placeholder={t('detail.playerName')}
                                    value={manOfMatch}
                                    onChangeText={setManOfMatch}
                                    icon={<Award size={16} color={c.accent} strokeWidth={2} />}
                                />

                                <Input
                                    label={t('detail.goalScorers')}
                                    placeholder={t('detail.goalScorersPlaceholder')}
                                    value={goalScorers}
                                    onChangeText={setGoalScorers}
                                    icon={<CheckCircle size={16} color={c.success} strokeWidth={2} />}
                                    multiline
                                    numberOfLines={2}
                                />

                                <Input
                                    label={t('detail.matchNotes')}
                                    placeholder={t('detail.matchNotesPlaceholder')}
                                    value={resultNotes}
                                    onChangeText={setResultNotes}
                                    multiline
                                    numberOfLines={3}
                                />

                                <Button title={t('detail.saveResult')} onPress={handleSave} loading={saving} />

                                {played && (
                                    <Text style={styles.lastSaved}>
                                        {t('detail.lastSaved')}: {new Date(slot.result_saved_at!).toLocaleDateString('en-GB', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                        })}
                                    </Text>
                                )}
                            </Card>
                        </>
                    )}

                    {/* Non-booked status messages */}
                    {slot.status === 'OPEN' && (
                        <Card radius={16} padding={28} style={styles.messageCard}>
                            <Hourglass size={30} color={c.primary} strokeWidth={2} />
                            <Text style={styles.messageTitle}>{t('detail.awaitingBooking')}</Text>
                            <Text style={styles.messageSubtext}>{t('detail.awaitingBookingDesc')}</Text>
                        </Card>
                    )}
                    {slot.status === 'REJECTED' && (
                        <Card radius={16} padding={28} style={styles.messageCard}>
                            <XCircle size={30} color={c.error} strokeWidth={2} />
                            <Text style={styles.messageTitle}>{t('detail.slotRejected')}</Text>
                            <Text style={styles.messageSubtext}>{t('detail.slotRejectedDesc')}</Text>
                        </Card>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function statusLabel(status: string, t: any): string {
    switch (status) {
        case 'OPEN': return t('detail.openForBooking');
        case 'HELD': return t('manage.held');
        case 'PENDING_APPROVAL': return t('offer.pendingApproval');
        case 'BOOKED': return t('manage.booked');
        case 'REJECTED': return t('offer.notAvailable');
        default: return status;
    }
}

function InfoRow({ Icon, label, value, scheme, first, last }: {
    Icon: any; label: string; value: string; scheme: 'light' | 'dark'; first?: boolean; last?: boolean;
}) {
    const c = Colors[scheme];
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingVertical: 12, paddingHorizontal: 14,
            borderTopWidth: first ? 0 : 1, borderTopColor: c.divider,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon size={16} color={c.textMuted} strokeWidth={2} />
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, fontWeight: '500', color: c.textMuted }}>{label}</Text>
            </View>
            <Text style={{ fontFamily: Fonts.body, fontSize: 13.5, fontWeight: '700', color: c.text, flexShrink: 1, textAlign: 'right', marginLeft: 12 }} numberOfLines={2}>
                {value}
            </Text>
        </View>
    );
}

const getStyles = (scheme: 'light' | 'dark') => {
    const c = Colors[scheme];
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        center: { flex: 1, backgroundColor: c.background, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 12 },
        errorText: { fontFamily: Fonts.body, fontSize: 15, fontWeight: '600', color: c.error },

        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingVertical: 10,
        },
        backCircle: {
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
            alignItems: 'center', justifyContent: 'center',
        },
        headerTitle: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 18, letterSpacing: -0.4, color: c.text },

        scroll: { paddingHorizontal: 20, paddingBottom: 40 },

        // Fixture card
        fixture: {
            backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
            borderRadius: 20, paddingVertical: 22, paddingHorizontal: 18, marginBottom: 12,
        },
        fixtureKicker: {
            fontFamily: Fonts.body, fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
            textTransform: 'uppercase', color: c.textMuted, textAlign: 'center', marginBottom: 18,
        },
        fixtureRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
        fixtureTeam: { flex: 1, alignItems: 'center', gap: 8 },
        fixtureTeamName: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '700', color: c.text, textAlign: 'center' },
        fixtureSide: { fontFamily: Fonts.body, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: c.textFaint },
        fixtureCenter: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, minWidth: 96, paddingTop: 6 },
        kickoff: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 30, letterSpacing: -1, color: c.text },
        fixtureSub: { fontFamily: Fonts.body, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: c.textFaint, marginTop: 3 },
        scoreRowDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        scoreNum: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 38, letterSpacing: -1, color: c.text },
        scoreDash: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 30, color: scheme === 'dark' ? c.accent : c.accent },
        fixturePill: { alignItems: 'center', marginTop: 18 },

        kicker: {
            fontFamily: Fonts.body, fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
            textTransform: 'uppercase', color: c.textMuted, marginTop: 18, marginBottom: 10,
        },

        // Result form
        scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 20 },
        scoreInput: { alignItems: 'center', gap: 8 },
        scoreFieldLabel: { fontFamily: Fonts.body, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: c.textMuted },
        scoreField: {
            width: 76, height: 68, fontFamily: Fonts.display, fontSize: 34, fontWeight: '800', textAlign: 'center',
            color: c.text, borderWidth: 1, borderColor: c.divider, borderRadius: 14, backgroundColor: c.surfaceSunk,
        },
        scoreSeparator: { fontFamily: Fonts.display, fontSize: 28, fontWeight: '800', color: c.textFaint, marginTop: 20 },
        lastSaved: { fontFamily: Fonts.body, fontSize: 12, color: c.textFaint, textAlign: 'center', marginTop: 12 },

        infoBanner: {
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: 'rgba(232,168,58,0.12)', borderColor: 'rgba(232,168,58,0.3)',
            borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12,
        },
        infoBannerText: { flex: 1, fontFamily: Fonts.body, fontSize: 12.5, color: c.text, lineHeight: 17 },

        messageCard: { alignItems: 'center', gap: 8, marginTop: 8 },
        messageTitle: { fontFamily: Fonts.body, fontSize: 15, fontWeight: '700', color: c.text, marginTop: 4 },
        messageSubtext: { fontFamily: Fonts.body, fontSize: 12.5, color: c.textMuted, textAlign: 'center', lineHeight: 18 },
    });
};
