import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HomeSkeleton } from '@/components/ui/SkeletonLoader';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getMyMatchIds } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardStats {
  totalOffers: number;
  activeOffers: number;
  bookedSlots: number;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const styles = getStyles(colorScheme);
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalOffers: 0, activeOffers: 0, bookedSlots: 0 });
  const [upcomingSlots, setUpcomingSlots] = useState<any[]>([]);
  const [recentOffers, setRecentOffers] = useState<MatchOfferWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const loadDashboard = async () => {
    try {
      if (!user) { setLoading(false); setRefreshing(false); return; }
      const myMatchIds = await getMyMatchIds(user.id);

      if (myMatchIds.length === 0) {
        setStats({ totalOffers: 0, activeOffers: 0, bookedSlots: 0 });
        setUpcomingSlots([]);
        setRecentOffers([]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return Colors[colorScheme].success;
      case 'PENDING_APPROVAL': return Colors[colorScheme].warning;
      case 'BOOKED': return Colors[colorScheme].primary;
      case 'CLOSED': return Colors[colorScheme].textSecondary;
      default: return Colors[colorScheme].textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Open';
      case 'PENDING_APPROVAL': return 'Pending';
      case 'BOOKED': return 'Booked';
      case 'CLOSED': return 'Closed';
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors[colorScheme].primary} />
        }
      >
        {/* ── Hero Band ── */}
        <View style={styles.heroBand}>
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
            <Text style={styles.greeting}>{getGreeting()}, Coach</Text>
            <Text style={styles.subtitle}>Here's what's happening</Text>
          </Animated.View>

          {/* Stats Row — Redesigned with large numbers */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(27,139,78,0.15)' }]}>
                <Ionicons name="football" size={18} color={Colors[colorScheme].primary} />
              </View>
              <Text style={styles.statValue}>{stats.totalOffers}</Text>
              <Text style={styles.statLabel}>Matches Created</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                <Ionicons name="pulse" size={18} color={Colors[colorScheme].warning} />
              </View>
              <Text style={styles.statValue}>{stats.activeOffers}</Text>
              <Text style={styles.statLabel}>Open Now</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <Ionicons name="checkmark-circle" size={18} color={Colors[colorScheme].success} />
              </View>
              <Text style={styles.statValue}>{stats.bookedSlots}</Text>
              <Text style={styles.statLabel}>Confirmed</Text>
            </View>
          </Animated.View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <SectionTitle label="Quick Actions" colorScheme={colorScheme} />
            <View style={styles.actionsRow}>
              <AnimatedPressable style={styles.actionCard} onPress={() => router.push('/match/create')} scaleTo={0.93}>
                <View style={styles.actionIconCircle}>
                  <Ionicons name="add" size={26} color="#fff" />
                </View>
                <Text style={styles.actionText}>Create Offer</Text>
                <Text style={styles.actionSubtext}>New match slot</Text>
              </AnimatedPressable>

              <AnimatedPressable style={styles.actionCard} onPress={() => router.push('/(tabs)/manage')} scaleTo={0.93}>
                <View style={styles.actionIconCircle}>
                  <Ionicons name="list" size={26} color="#fff" />
                </View>
                <Text style={styles.actionText}>My Matches</Text>
                <Text style={styles.actionSubtext}>View & manage</Text>
              </AnimatedPressable>
            </View>
          </Animated.View>

          {/* Upcoming Matches */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <SectionTitle
              label="Upcoming Matches"
              colorScheme={colorScheme}
              count={upcomingSlots.length > 0 ? upcomingSlots.length : undefined}
              onSeeAll={upcomingSlots.length > 0 ? () => router.push('/(tabs)/manage') : undefined}
            />
          </Animated.View>

          {upcomingSlots.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={36} color={Colors[colorScheme].primary} />
              </View>
              <Text style={styles.emptyText}>No upcoming matches</Text>
              <Text style={styles.emptySubtext}>Create a match offer and share it with other coaches to schedule your next game</Text>
              <Button
                title="Create Your First Match"
                onPress={() => router.push('/match/create')}
                variant="secondary"
                style={{ marginTop: 8 }}
              />
            </Card>
          ) : (
            upcomingSlots.map((slot, index) => {
              const { date, time } = formatDateTime(slot.start_time);
              const endTime = formatDateTime(slot.end_time).time;
              const matchInfo = slot.match_offers;
              return (
                <Animated.View key={slot.id} entering={FadeInUp.delay(400 + index * 100).springify()}>
                  <Card style={styles.upcomingCard}>
                    <View style={styles.upcomingRow}>
                      <View style={styles.upcomingDateBadge}>
                        <Text style={styles.upcomingDateText}>{date}</Text>
                      </View>
                      <View style={styles.upcomingInfo}>
                        <Text style={styles.upcomingTitle}>{matchInfo?.age_group} • {matchInfo?.format}</Text>
                        <View style={styles.upcomingMeta}>
                          <Ionicons name="time-outline" size={14} color={Colors[colorScheme].textSecondary} />
                          <Text style={styles.upcomingMetaText}>{time} – {endTime}</Text>
                        </View>
                        <View style={styles.upcomingMeta}>
                          <Ionicons name="location-outline" size={14} color={Colors[colorScheme].textSecondary} />
                          <Text style={styles.upcomingMetaText} numberOfLines={1}>{matchInfo?.location}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(slot.status) }]} />
                    </View>
                  </Card>
                </Animated.View>
              );
            })
          )}

          {/* Recent Activity */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <SectionTitle
              label="Recent Activity"
              colorScheme={colorScheme}
              count={recentOffers.length > 0 ? recentOffers.length : undefined}
              onSeeAll={recentOffers.length > 0 ? () => router.push('/(tabs)/manage') : undefined}
            />
          </Animated.View>

          {recentOffers.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="time-outline" size={36} color={Colors[colorScheme].primary} />
              </View>
              <Text style={styles.emptyText}>No recent activity</Text>
              <Text style={styles.emptySubtext}>Your match offers and booking activity will appear here</Text>
            </Card>
          ) : (
            recentOffers.map((offer, index) => (
              <Animated.View key={offer.id} entering={FadeInUp.delay(500 + index * 100).springify()}>
                <Card style={styles.activityCard}>
                  <View style={styles.activityRow}>
                    <View style={styles.activityLeft}>
                      <Text style={styles.activityTitle}>{offer.age_group} • {offer.format}</Text>
                      <Text style={styles.activityLocation}>{offer.location}</Text>
                      <Text style={styles.activitySlots}>
                        {offer.slots.length} {offer.slots.length === 1 ? 'slot' : 'slots'}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, {
                      backgroundColor:
                        offer.status === 'OPEN' ? 'rgba(34,197,94,0.12)' :
                        offer.status === 'PENDING_APPROVAL' ? 'rgba(251,191,36,0.12)' :
                        'rgba(168,162,158,0.08)',
                    }]}>
                      <Text style={[styles.statusBadgeText, {
                        color:
                          offer.status === 'OPEN' ? Colors[colorScheme].success :
                          offer.status === 'PENDING_APPROVAL' ? Colors[colorScheme].warning :
                          Colors[colorScheme].textSecondary,
                      }]}>
                        {getStatusLabel(offer.status)}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))
          )}

        </View>
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

// ── Section Title with accent bar, optional count badge, and See All link ──
function SectionTitle({
  label,
  colorScheme,
  count,
  onSeeAll,
}: {
  label: string;
  colorScheme: 'light' | 'dark';
  count?: number;
  onSeeAll?: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
        <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: '#1B8B4E' }} />
        <Text style={{ fontSize: 18, fontWeight: '700', color: Colors[colorScheme].text }}>{label}</Text>
        {count !== undefined && (
          <View style={{
            backgroundColor: Colors[colorScheme].secondary,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            minWidth: 24,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors[colorScheme].primary }}>{count}</Text>
          </View>
        )}
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: Colors[colorScheme].primary }}>See all</Text>
        </Pressable>
      )}
    </View>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors[colorScheme].background,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Hero band — tinted indigo wash at the top
  heroBand: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(27,139,78,0.12)' : 'rgba(27,139,78,0.07)',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Header
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors[colorScheme].text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors[colorScheme].textSecondary,
    marginTop: 4,
  },

  // Stats — Redesigned with large numbers
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? 'rgba(27,139,78,0.2)' : 'rgba(27,139,78,0.1)',
    shadowColor: '#1B8B4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: colorScheme === 'dark' ? 0.2 : 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors[colorScheme].text,
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors[colorScheme].textSecondary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors[colorScheme].card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#1B8B4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: colorScheme === 'dark' ? 0.2 : 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  actionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#1B8B4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors[colorScheme].text,
  },
  actionSubtext: {
    fontSize: 12,
    color: Colors[colorScheme].textTertiary,
    marginTop: -4,
  },

  // Upcoming
  upcomingCard: {
    padding: 14,
    marginBottom: 10,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upcomingDateBadge: {
    backgroundColor: Colors[colorScheme].secondary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 72,
  },
  upcomingDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors[colorScheme].primary,
    textAlign: 'center',
  },
  upcomingInfo: {
    flex: 1,
    gap: 3,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors[colorScheme].text,
  },
  upcomingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingMetaText: {
    fontSize: 13,
    color: Colors[colorScheme].textSecondary,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Activity
  activityCard: {
    padding: 14,
    marginBottom: 10,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityLeft: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors[colorScheme].text,
  },
  activityLocation: {
    fontSize: 13,
    color: Colors[colorScheme].textSecondary,
  },
  activitySlots: {
    fontSize: 12,
    color: Colors[colorScheme].textTertiary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Empty states — Enhanced
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors[colorScheme].secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors[colorScheme].text,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors[colorScheme].textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
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
