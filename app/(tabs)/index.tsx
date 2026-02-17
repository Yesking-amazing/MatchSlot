import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { getMyMatchIds } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DashboardStats {
  totalOffers: number;
  activeOffers: number;
  bookedSlots: number;
}

export default function HomeScreen() {
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
      const myMatchIds = await getMyMatchIds();

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
      case 'OPEN': return Colors.light.success;
      case 'PENDING_APPROVAL': return Colors.light.warning;
      case 'BOOKED': return Colors.light.primary;
      case 'CLOSED': return Colors.light.textSecondary;
      default: return Colors.light.textSecondary;
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
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}, Coach ⚽</Text>
          <Text style={styles.subtitle}>Your match activity at a glance</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16,185,129,0.25)' }]}>
              <Ionicons name="football" size={18} color={Colors.light.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.totalOffers}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={[styles.statCard, styles.statCardAmber]}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(251,191,36,0.2)' }]}>
              <Ionicons name="pulse" size={18} color={Colors.light.warning} />
            </View>
            <Text style={styles.statNumber}>{stats.activeOffers}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={[styles.statCard, styles.statCardBlue]}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(96,165,250,0.2)' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#60A5FA" />
            </View>
            <Text style={styles.statNumber}>{stats.bookedSlots}</Text>
            <Text style={styles.statLabel}>Booked</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/match/create')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="add-circle" size={28} color={Colors.light.primary} />
            </View>
            <Text style={styles.actionText}>Create Offer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/manage')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="list" size={28} color={Colors.light.primary} />
            </View>
            <Text style={styles.actionText}>My Matches</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Matches */}
        <Text style={styles.sectionTitle}>Upcoming Matches</Text>
        {upcomingSlots.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>No upcoming matches</Text>
            <Text style={styles.emptySubtext}>Create a match offer to get started</Text>
          </Card>
        ) : (
          upcomingSlots.map((slot) => {
            const { date, time } = formatDateTime(slot.start_time);
            const endTime = formatDateTime(slot.end_time).time;
            const matchInfo = slot.match_offers;

            return (
              <Card key={slot.id} style={styles.upcomingCard}>
                <View style={styles.upcomingRow}>
                  <View style={styles.upcomingDateBadge}>
                    <Text style={styles.upcomingDateText}>{date}</Text>
                  </View>
                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingTitle}>
                      {matchInfo?.age_group} • {matchInfo?.format}
                    </Text>
                    <View style={styles.upcomingMeta}>
                      <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.upcomingMetaText}>{time} - {endTime}</Text>
                    </View>
                    <View style={styles.upcomingMeta}>
                      <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.upcomingMetaText} numberOfLines={1}>
                        {matchInfo?.location}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(slot.status) }]} />
                </View>
              </Card>
            );
          })
        )}

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentOffers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="time-outline" size={32} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>No recent activity</Text>
          </Card>
        ) : (
          recentOffers.map((offer) => (
            <Card key={offer.id} style={styles.activityCard}>
              <View style={styles.activityRow}>
                <View style={styles.activityLeft}>
                  <Text style={styles.activityTitle}>
                    {offer.age_group} • {offer.format}
                  </Text>
                  <Text style={styles.activityLocation}>
                    <Ionicons name="location-outline" size={12} color={Colors.light.textSecondary} /> {offer.location}
                  </Text>
                  <Text style={styles.activitySlots}>
                    {offer.slots.length} {offer.slots.length === 1 ? 'slot' : 'slots'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: offer.status === 'OPEN' ? 'rgba(52,211,153,0.15)' :
                    offer.status === 'PENDING_APPROVAL' ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)'
                }]}>
                  <Text style={[styles.statusBadgeText, {
                    color: offer.status === 'OPEN' ? Colors.light.success :
                      offer.status === 'PENDING_APPROVAL' ? Colors.light.warning : Colors.light.textSecondary
                  }]}>
                    {getStatusLabel(offer.status)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    marginBottom: 28,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  statCardGreen: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.15)',
  },
  statCardAmber: {
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderColor: 'rgba(251,191,36,0.12)',
  },
  statCardBlue: {
    backgroundColor: 'rgba(96,165,250,0.06)',
    borderColor: 'rgba(96,165,250,0.12)',
  },
  statIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
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
    backgroundColor: Colors.light.secondary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  upcomingDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
    textAlign: 'center',
  },
  upcomingInfo: {
    flex: 1,
    gap: 3,
  },
  upcomingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  upcomingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingMetaText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
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
    color: Colors.light.text,
  },
  activityLocation: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  activitySlots: {
    fontSize: 12,
    color: Colors.light.textTertiary,
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

  // Empty states
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.light.textTertiary,
  },

});
