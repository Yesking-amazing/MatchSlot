import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { HomeSkeleton } from '@/components/ui/SkeletonLoader';
import { StatusDot } from '@/components/ui/StatusDot';
import { StatusPill } from '@/components/ui/StatusPill';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { fmtDate, fmtTime, getGreeting, getMonthAbbr } from '@/lib/dateUtils';
import { getMyMatchIds } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardStats {
  totalOffers: number;
  activeOffers: number;
  bookedSlots: number;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const t = Colors[colorScheme];
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ totalOffers: 0, activeOffers: 0, bookedSlots: 0 });
  const [upcomingSlots, setUpcomingSlots] = useState<any[]>([]);
  const [recentOffers, setRecentOffers] = useState<MatchOfferWithSlots[]>([]);
  const [pendingResults, setPendingResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const coachName = user?.user_metadata?.name || 'Coach';

  const loadDashboard = async () => {
    try {
      if (!user) { setLoading(false); setRefreshing(false); return; }
      const myMatchIds = await getMyMatchIds(user.id);

      if (myMatchIds.length === 0) {
        setStats({ totalOffers: 0, activeOffers: 0, bookedSlots: 0 });
        setUpcomingSlots([]);
        setRecentOffers([]);
        setPendingResults([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const { data: offersData, error: offersError } = await supabase
        .from('match_offers')
        .select('*')
        .in('id', myMatchIds)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      const { data: allSlots, error: slotsError } = await supabase
        .from('slots')
        .select('*, match_offers!inner(age_group, format, location, host_name)')
        .in('match_offer_id', myMatchIds)
        .order('start_time', { ascending: true });

      if (slotsError) throw slotsError;

      const offers = offersData || [];
      const slots = allSlots || [];

      const activeOffers = offers.filter(o => o.status === 'OPEN' || o.status === 'PENDING_APPROVAL').length;
      const bookedSlots = slots.filter(s => s.status === 'BOOKED').length;

      setStats({ totalOffers: offers.length, activeOffers, bookedSlots });

      const now = new Date().toISOString();

      const upcoming = slots
        .filter(s => s.start_time > now && s.status === 'BOOKED')
        .slice(0, 3);
      setUpcomingSlots(upcoming);

      const pending = slots.filter(
        s => s.status === 'BOOKED' && s.start_time < now && s.home_score == null
      );
      setPendingResults(pending);

      const recentWithSlots = offers.slice(0, 4).map(offer => ({
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
        <HomeSkeleton />
      </SafeAreaView>
    );
  }

  const openNow = stats.activeOffers;
  const baseDelay = pendingResults.length > 0 ? 100 : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />
        }
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ paddingTop: 12 }}>
          <Text style={styles.greetingLabel(t)}>
            {getGreeting()},
          </Text>
          <Text style={styles.greetingName(t)}>
            Coach {coachName}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsRow}>
          <StatCard icon="football-outline" color={t.primary} value={stats.totalOffers} label="TOTAL" t={t} />
          <StatCard icon="flag-outline" color={t.success} value={stats.activeOffers} label="OPEN" t={t} />
          <StatCard icon="checkmark-outline" color={t.info} value={stats.bookedSlots} label="CONFIRMED" t={t} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <SectionHeader title="Quick actions" />
          <View style={styles.quickActionsRow}>
            <AnimatedPressable
              scaleTo={0.97}
              onPress={() => router.push('/match/create')}
              style={styles.quickActionHighlighted(t)}
            >
              <View style={styles.quickActionIconHighlighted}>
                <Ionicons name="add-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.quickActionTitleHighlighted}>New offer</Text>
              <Text style={styles.quickActionSubHighlighted}>Share a link with guest coaches</Text>
            </AnimatedPressable>

            <AnimatedPressable
              scaleTo={0.97}
              onPress={() => router.push('/(tabs)/manage')}
              style={styles.quickActionNeutral(t)}
            >
              <View style={styles.quickActionIconNeutral(t)}>
                <Ionicons name="list-outline" size={20} color={t.text} />
              </View>
              <Text style={styles.quickActionTitleNeutral(t)}>My matches</Text>
              <Text style={styles.quickActionSubNeutral(t)}>
                {stats.totalOffers} total · {openNow} open
              </Text>
            </AnimatedPressable>
          </View>
        </Animated.View>

        {pendingResults.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <SectionHeader title="Save a result" />
            {pendingResults.map((slot) => {
              const matchInfo = slot.match_offers;
              return (
                <AnimatedPressable
                  key={slot.id}
                  scaleTo={0.97}
                  onPress={() => router.push('/(tabs)/manage')}
                  style={styles.pendingResultCard(t)}
                >
                  <View style={styles.pendingResultIcon(t)}>
                    <Ionicons name="trophy-outline" size={18} color={t.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: t.text }}>
                      How did the match go?
                    </Text>
                    <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 1 }}>
                      vs {slot.guest_club || 'TBD'} · {fmtDate(slot.start_time)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={t.textTertiary} />
                </AnimatedPressable>
              );
            })}
            <View style={{ height: 14 }} />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(300 + baseDelay).springify()}>
          <SectionHeader
            title="Upcoming matches"
            action={upcomingSlots.length > 0 ? 'See all →' : undefined}
            onAction={upcomingSlots.length > 0 ? () => router.push('/(tabs)/manage') : undefined}
          />
          {upcomingSlots.length === 0 ? (
            <View style={styles.emptyState(t)}>
              <Ionicons name="calendar-outline" size={32} color={t.textTertiary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>
                No matches scheduled
              </Text>
              <Text style={{ fontSize: 13, color: t.textSecondary, textAlign: 'center' }}>
                Create an offer to share with guest clubs.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginBottom: 24 }}>
              {upcomingSlots.map((slot) => {
                const matchInfo = slot.match_offers;
                const d = new Date(slot.start_time);
                return (
                  <AnimatedPressable
                    key={slot.id}
                    scaleTo={0.97}
                    onPress={() => router.push('/(tabs)/manage')}
                    style={styles.upcomingCard(t)}
                  >
                    <View style={styles.dateBlock(t)}>
                      <Text style={styles.dateBlockMonth(t)}>{getMonthAbbr(d)}</Text>
                      <Text style={styles.dateBlockDay(t)}>{d.getDate()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontSize: 15.5, fontWeight: '700', color: t.text }}>
                        vs {slot.guest_club || 'TBD'}
                      </Text>
                      <Text style={{ fontSize: 12.5, color: t.textSecondary, marginTop: 2 }}>
                        {matchInfo?.age_group} · {matchInfo?.format} · {fmtTime(slot.start_time)}
                      </Text>
                      {matchInfo?.location && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <Ionicons name="pin" size={11} color={t.textSecondary} />
                          <Text numberOfLines={1} style={{ fontSize: 12, color: t.textSecondary }}>
                            {matchInfo.location}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={t.textTertiary} />
                  </AnimatedPressable>
                );
              })}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400 + baseDelay).springify()}>
          <SectionHeader title="Recent activity" />
          {recentOffers.length > 0 ? (
            <Card style={{ overflow: 'hidden' as const }}>
              {recentOffers.slice(0, 4).map((offer, index) => {
                const bookedSlot = offer.slots.find(s => s.status === 'BOOKED');
                return (
                  <AnimatedPressable
                    key={offer.id}
                    scaleTo={0.97}
                    onPress={() => router.push('/(tabs)/manage')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 16,
                      gap: 12,
                      borderBottomWidth: index < Math.min(recentOffers.length, 4) - 1
                        ? StyleSheet.hairlineWidth
                        : 0,
                      borderBottomColor: t.divider,
                    }}
                  >
                    <StatusDot status={offer.status as any} size={9} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>
                        {offer.age_group} {offer.format} · {offer.slots.length} slot{offer.slots.length !== 1 ? 's' : ''}
                      </Text>
                      <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 1 }} numberOfLines={1}>
                        {bookedSlot ? `Booked by ${bookedSlot.guest_club || 'a guest'}` : offer.location}
                      </Text>
                    </View>
                    <StatusPill status={offer.status} />
                  </AnimatedPressable>
                );
              })}
            </Card>
          ) : (
            <View style={styles.emptyState(t)}>
              <Ionicons name="time-outline" size={28} color={t.textTertiary} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.textSecondary }}>
                No recent activity
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <AnimatedPressable
        scaleTo={0.9}
        onPress={() => router.push('/match/create')}
        style={styles.fab(t)}
      >
        <Ionicons name="add-outline" size={28} color="#fff" />
      </AnimatedPressable>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  color,
  value,
  label,
  t,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  value: number;
  label: string;
  t: typeof Colors.light;
}) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 16,
      paddingTop: 12,
      paddingHorizontal: 12,
      paddingBottom: 10,
      borderWidth: 1,
      borderColor: t.divider,
      borderTopWidth: 3,
      borderTopColor: color,
      minHeight: 88,
      shadowColor: t.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <View style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        backgroundColor: `${color}1A`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
      }}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: t.text }}>{value}</Text>
      <Text style={{
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.6,
        color: t.textSecondary,
        textTransform: 'uppercase',
        marginTop: 2,
      }}>
        {label}
      </Text>
    </View>
  );
}

const styles = {
  greetingLabel: (t: typeof Colors.light) => ({
    fontSize: 14,
    fontWeight: '500' as const,
    color: t.textSecondary,
  }),
  greetingName: (t: typeof Colors.light) => ({
    fontSize: 30,
    fontWeight: '800' as const,
    color: t.text,
    letterSpacing: -0.6,
    marginBottom: 16,
  }),
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 24,
  },
  quickActionsRow: {
    flexDirection: 'row' as const,
    gap: 14,
    marginBottom: 24,
  },
  quickActionHighlighted: (t: typeof Colors.light) => ({
    flex: 1,
    backgroundColor: t.primary,
    borderRadius: 18,
    padding: 16,
    minHeight: 108,
    shadowColor: t.glow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  }),
  quickActionIconHighlighted: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  quickActionTitleHighlighted: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  quickActionSubHighlighted: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  quickActionNeutral: (t: typeof Colors.light) => ({
    flex: 1,
    backgroundColor: t.card,
    borderRadius: 18,
    padding: 16,
    minHeight: 108,
    borderWidth: 1,
    borderColor: t.divider,
  }),
  quickActionIconNeutral: (t: typeof Colors.light) => ({
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: t.divider,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  }),
  quickActionTitleNeutral: (t: typeof Colors.light) => ({
    fontSize: 16,
    fontWeight: '700' as const,
    color: t.text,
  }),
  quickActionSubNeutral: (t: typeof Colors.light) => ({
    fontSize: 12.5,
    color: t.textSecondary,
    marginTop: 2,
  }),
  pendingResultCard: (t: typeof Colors.light) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: `${t.warning}1A`,
    borderWidth: 1,
    borderColor: `${t.warning}66`,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  }),
  pendingResultIcon: (t: typeof Colors.light) => ({
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${t.warning}21`,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }),
  emptyState: (t: typeof Colors.light) => ({
    borderWidth: 1.5,
    borderStyle: 'dashed' as const,
    borderColor: t.divider,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 24,
  }),
  upcomingCard: (t: typeof Colors.light) => ({
    backgroundColor: t.card,
    borderRadius: 18,
    padding: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: t.divider,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    shadowColor: t.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  }),
  dateBlock: (t: typeof Colors.light) => ({
    width: 48,
    height: 54,
    backgroundColor: t.primaryLight,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }),
  dateBlockMonth: (t: typeof Colors.light) => ({
    fontSize: 10,
    fontWeight: '700' as const,
    color: t.primaryDark,
    textTransform: 'uppercase' as const,
  }),
  dateBlockDay: (t: typeof Colors.light) => ({
    fontSize: 22,
    fontWeight: '800' as const,
    color: t.primaryDark,
    lineHeight: 26,
  }),
  fab: (t: typeof Colors.light) => ({
    position: 'absolute' as const,
    right: 18,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: t.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: t.glow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  }),
};
