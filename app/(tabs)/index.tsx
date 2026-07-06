import { Card } from '@/components/ui/Card';
import { Crest } from '@/components/ui/Crest';
import { EmptyState } from '@/components/ui/EmptyState';
import { HomeSkeleton } from '@/components/ui/SkeletonLoader';
import { StatusChip, offerStatusKind, slotStatusKind } from '@/components/ui/StatusChip';
import { Wordmark } from '@/components/ui/Brandmark';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots } from '@/types/database';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Bell, CalendarRange, ClipboardList, Plus } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardStats {
  totalOffers: number;
  activeOffers: number;
  bookedSlots: number;
}

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const styles = getStyles(scheme);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({ totalOffers: 0, activeOffers: 0, bookedSlots: 0 });
  const [upcomingSlots, setUpcomingSlots] = useState<any[]>([]);
  const [recentOffers, setRecentOffers] = useState<MatchOfferWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const loadDashboard = async () => {
    try {
      if (!user) { setLoading(false); setRefreshing(false); return; }

      const { data: offersData, error: offersError } = await supabase
        .from('match_offers')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      const offers = offersData || [];

      if (offers.length === 0) {
        setStats({ totalOffers: 0, activeOffers: 0, bookedSlots: 0 });
        setUpcomingSlots([]);
        setRecentOffers([]);
        return;
      }

      const offerIds = offers.map(o => o.id);

      const { data: allSlots, error: slotsError } = await supabase
        .from('slots')
        .select('*, match_offers!inner(age_group, format, location, host_name)')
        .in('match_offer_id', offerIds)
        .order('start_time', { ascending: true });

      if (slotsError) throw slotsError;

      const slots = allSlots || [];

      const activeOffers = offers.filter(o => o.status === 'OPEN' || o.status === 'PENDING_APPROVAL').length;
      const bookedSlots = slots.filter(s => s.status === 'BOOKED').length;

      setStats({ totalOffers: offers.length, activeOffers, bookedSlots });

      const now = new Date().toISOString();
      const upcoming = slots
        .filter(s => s.start_time > now && (s.status === 'OPEN' || s.status === 'BOOKED' || s.status === 'PENDING_APPROVAL'))
        .slice(0, 3);
      setUpcomingSlots(upcoming);

      const recentWithSlots = offers.slice(0, 3).map(offer => ({
        ...offer,
        slots: slots.filter(s => s.match_offer_id === offer.id),
      }));
      setRecentOffers(recentWithSlots);

    } catch (e: any) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const slotLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return t('offer.available');
      case 'BOOKED': return t('home.confirmed');
      case 'PENDING_APPROVAL': return t('manage.pending');
      default: return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HomeSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        }
      >
        {/* Top bar */}
        <View style={styles.topbar}>
          <Wordmark size={20} />
          <View style={styles.bellCircle}>
            <Bell size={17} color={c.textSecondary} strokeWidth={2} />
          </View>
        </View>

        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(60)} style={styles.greetingWrap}>
          <Text style={styles.greetingSmall}>{getGreeting()},</Text>
          <Text style={styles.greetingBig}>{t('home.coach')}</Text>
        </Animated.View>

        {/* Stat strip */}
        <Animated.View entering={FadeInDown.delay(120)} style={styles.statStrip}>
          <StatCol value={stats.totalOffers} label={t('home.matchesCreated')} scheme={scheme} />
          <View style={styles.statDivider} />
          <StatCol value={stats.activeOffers} label={t('home.openNow')} scheme={scheme} primary />
          <View style={styles.statDivider} />
          <StatCol value={stats.bookedSlots} label={t('home.confirmed')} scheme={scheme} />
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(180)} style={styles.actionsRow}>
          <Pressable style={({ pressed }) => [styles.actionPrimary, pressed && { backgroundColor: c.primaryDark }]} onPress={() => router.push('/match/create')}>
            <View style={styles.actionIconLight}>
              <Plus size={18} color={c.primaryInk} strokeWidth={2.4} />
            </View>
            <Text style={styles.actionPrimaryText}>{t('home.createOffer')}</Text>
            <Text style={styles.actionPrimarySub}>{t('home.newMatchSlot')}</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.actionSecondary, pressed && { backgroundColor: c.primaryTint }]} onPress={() => router.push('/(tabs)/manage')}>
            <View style={[styles.actionIconTint, { backgroundColor: c.primaryTint }]}>
              <ClipboardList size={18} color={c.primary} strokeWidth={2.2} />
            </View>
            <Text style={styles.actionSecondaryText}>{t('home.myMatches')}</Text>
            <Text style={styles.actionSecondarySub}>{t('home.viewManage')}</Text>
          </Pressable>
        </Animated.View>

        {/* Schedule (agenda) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.kicker}>{t('home.upcomingMatches')}</Text>
            {upcomingSlots.length > 0 && (
              <Pressable onPress={() => router.push('/(tabs)/manage')} hitSlop={8}>
                <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
              </Pressable>
            )}
          </View>

          {upcomingSlots.length === 0 ? (
            <EmptyState
              icon={<CalendarRange size={24} color={c.primary} strokeWidth={2} />}
              title={t('home.noUpcoming')}
              subtitle={t('home.noUpcomingDesc')}
            />
          ) : (
            <View style={styles.agenda}>
              {upcomingSlots.map((slot, index) => {
                const { date, time } = formatDateTime(slot.start_time);
                const info = slot.match_offers;
                const confirmed = slot.status === 'BOOKED';
                const pending = slot.status === 'PENDING_APPROVAL';
                return (
                  <Animated.View key={slot.id} entering={FadeInDown.delay(220 + index * 40)} style={styles.agendaRow}>
                    {/* time rail */}
                    <View style={styles.rail}>
                      <Text style={styles.railTime}>{time}</Text>
                      <Text style={styles.railDate}>{date}</Text>
                    </View>
                    <View style={styles.railLineWrap}>
                      <View style={[styles.railLine, { backgroundColor: c.divider }]} />
                      <View style={[
                        styles.railNode,
                        confirmed
                          ? { backgroundColor: c.primary, borderColor: c.primary }
                          : pending
                            ? { backgroundColor: c.background, borderColor: c.warning }
                            : { backgroundColor: c.background, borderColor: c.primary },
                      ]} />
                    </View>
                    {/* content */}
                    <Pressable style={styles.agendaContent} onPress={() => router.push('/(tabs)/manage')}>
                      <Text style={styles.agendaTitle}>{info?.age_group} · {info?.format}</Text>
                      <Text style={styles.agendaMeta} numberOfLines={1}>{info?.location}</Text>
                      <StatusChip kind={slotStatusKind(slot.status)} label={slotLabel(slot.status)} style={{ marginTop: 8 }} />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <Text style={styles.kicker}>{t('home.recentActivity')}</Text>
          {recentOffers.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={24} color={c.primary} strokeWidth={2} />}
              title={t('home.noRecent')}
              subtitle={t('home.noRecentDesc')}
            />
          ) : (
            <View style={{ marginTop: 12 }}>
              {recentOffers.map((offer, index) => (
                <Animated.View key={offer.id} entering={FadeInDown.delay(120 + index * 40)}>
                  <Pressable onPress={() => router.push('/(tabs)/manage')}>
                    <Card radius={14} padding={14} style={styles.activityCard}>
                      <Crest name={offer.host_club || offer.host_name} size={30} shape="square" muted={offer.status === 'CLOSED' || offer.status === 'CANCELLED'} />
                      <View style={styles.activityInfo}>
                        <Text style={styles.activityTitle}>{offer.age_group} · {offer.format}</Text>
                        <Text style={styles.activityMeta} numberOfLines={1}>
                          {offer.slots.length} {offer.slots.length === 1 ? t('common.slot') : t('common.slots')} · {offer.location}
                        </Text>
                      </View>
                      <StatusChip kind={offerStatusKind(offer.status)} label={statusText(offer.status, t)} />
                    </Card>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function statusText(status: string, t: any): string {
  switch (status) {
    case 'OPEN': return t('offer.available');
    case 'PENDING_APPROVAL': return t('manage.pending');
    case 'CLOSED': return t('offer.closed');
    case 'CANCELLED': return t('manage.cancelled');
    default: return status;
  }
}

function StatCol({ value, label, scheme, primary }: { value: number; label: string; scheme: 'light' | 'dark'; primary?: boolean }) {
  const c = Colors[scheme];
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Text style={{ fontFamily: Fonts.display, fontWeight: '800', fontSize: 26, letterSpacing: -0.8, color: primary ? c.primary : c.text }}>
        {value}
      </Text>
      <Text style={{ fontFamily: Fonts.body, fontWeight: '600', fontSize: 11, color: c.textMuted, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

const getStyles = (scheme: 'light' | 'dark') => {
  const c = Colors[scheme];
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    scrollContent: { paddingHorizontal: 22, paddingBottom: 110, paddingTop: 4 },

    topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 40 },
    bellCircle: {
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
      alignItems: 'center', justifyContent: 'center',
    },

    greetingWrap: { marginTop: 16 },
    greetingSmall: { fontFamily: Fonts.body, fontSize: 13.5, fontWeight: '500', color: c.textMuted },
    greetingBig: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 30, letterSpacing: -1, color: c.text, marginTop: 2 },

    statStrip: {
      flexDirection: 'row', alignItems: 'center',
      marginTop: 22, paddingVertical: 18,
      borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.divider,
    },
    statDivider: { width: 1, height: 34, backgroundColor: c.divider },

    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
    actionPrimary: { flex: 1, backgroundColor: c.primary, borderRadius: 16, padding: 14, gap: 2 },
    actionIconLight: {
      width: 34, height: 34, borderRadius: 10, marginBottom: 8,
      backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
    },
    actionPrimaryText: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '700', color: c.primaryInk },
    actionPrimarySub: { fontFamily: Fonts.body, fontSize: 11.5, fontWeight: '500', color: c.primaryInk, opacity: 0.7 },

    actionSecondary: { flex: 1, backgroundColor: c.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: c.border, gap: 2 },
    actionIconTint: { width: 34, height: 34, borderRadius: 10, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
    actionSecondaryText: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '700', color: c.text },
    actionSecondarySub: { fontFamily: Fonts.body, fontSize: 11.5, fontWeight: '500', color: c.textMuted },

    section: { marginTop: 28 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    kicker: { fontFamily: Fonts.body, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: c.textMuted },
    seeAll: { fontFamily: Fonts.body, fontSize: 12.5, fontWeight: '600', color: c.primary },

    agenda: { marginTop: 14 },
    agendaRow: { flexDirection: 'row', alignItems: 'stretch', minHeight: 64 },
    rail: { width: 52, alignItems: 'flex-end', paddingTop: 1 },
    railTime: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 15, letterSpacing: -0.5, color: c.text },
    railDate: { fontFamily: Fonts.body, fontSize: 10, fontWeight: '600', color: c.textFaint, marginTop: 1, textTransform: 'uppercase' },
    railLineWrap: { width: 20, alignItems: 'center' },
    railLine: { position: 'absolute', top: 0, bottom: 0, width: 2 },
    railNode: { width: 11, height: 11, borderRadius: 6, borderWidth: 2.5, marginTop: 5 },
    agendaContent: { flex: 1, paddingBottom: 20 },
    agendaTitle: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '700', color: c.text },
    agendaMeta: { fontFamily: Fonts.body, fontSize: 12, fontWeight: '500', color: c.textMuted, marginTop: 2 },

    activityCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    activityInfo: { flex: 1 },
    activityTitle: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '700', color: c.text },
    activityMeta: { fontFamily: Fonts.body, fontSize: 11.5, fontWeight: '500', color: c.textMuted, marginTop: 2 },
  });
};
