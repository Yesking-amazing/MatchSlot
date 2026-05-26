import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { DateBlock } from '@/components/ui/DateBlock';
import { FormatBlock } from '@/components/ui/FormatBlock';
import { ManageSkeleton } from '@/components/ui/SkeletonLoader';
import { StatusDot, statusColor } from '@/components/ui/StatusDot';
import { StatusPill } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { fmtDate, fmtTime, fmtTimeRange } from '@/lib/dateUtils';
import { copyLinkToClipboard, generateShareableLink } from '@/lib/shareLink';
import { getMyMatchIds, removeMyMatchId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { MatchOfferWithSlots, Slot } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const FILTERS = ['All', 'Open', 'Booked', 'Pending', 'Closed'] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(m: MatchOfferWithSlots, f: Filter): boolean {
  switch (f) {
    case 'All':
      return true;
    case 'Open':
      return m.status === 'OPEN';
    case 'Booked':
      return m.slots.some((s) => s.status === 'BOOKED');
    case 'Pending':
      return m.status === 'PENDING_APPROVAL';
    case 'Closed':
      return m.status === 'CLOSED';
  }
}

function filterCount(offers: MatchOfferWithSlots[], f: Filter): number {
  return offers.filter((m) => matchesFilter(m, f)).length;
}

function getMatchTitle(m: MatchOfferWithSlots): string {
  const booked = m.slots.find((s) => s.status === 'BOOKED');
  if (booked) return `vs ${booked.guest_club || 'TBC'}`;
  if (m.status === 'PENDING_APPROVAL') return 'Awaiting approval';
  if (m.status === 'CANCELLED') return 'Cancelled offer';
  const openCount = m.slots.filter((s) => s.status === 'OPEN').length;
  return `${openCount} time slot${openCount !== 1 ? 's' : ''} open`;
}

function slotDescription(s: Slot, duration: number): string {
  switch (s.status) {
    case 'BOOKED':
      return [s.guest_club, s.guest_contact].filter(Boolean).join(' · ');
    case 'HELD':
      return 'Held — 15-min hold';
    case 'OPEN':
      return `Available · ${duration} min`;
    case 'REJECTED':
      return 'Released after sibling booked';
    case 'PENDING_APPROVAL':
      return 'Awaiting approver decision';
    default:
      return s.status;
  }
}

function isPlayed(s: Slot): boolean {
  return s.status === 'BOOKED' && new Date(s.end_time) < new Date();
}

function hasResult(s: Slot): boolean {
  return s.home_score != null && s.away_score != null;
}

function awaitingResult(m: MatchOfferWithSlots): boolean {
  return m.slots.some((s) => isPlayed(s) && !hasResult(s));
}

function allConfirmed(m: MatchOfferWithSlots): boolean {
  const booked = m.slots.filter((s) => s.status === 'BOOKED');
  return booked.length > 0 && booked.every((s) => hasResult(s));
}

// --------------- Chevron ---------------

function RotatingChevron({ expanded, color }: { expanded: boolean; color: string }) {
  const rotation = useSharedValue(expanded ? 1 : 0);
  React.useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, { duration: 240 });
  }, [expanded]);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));
  return (
    <Animated.View style={animStyle}>
      <Ionicons name="chevron-down" size={18} color={color} />
    </Animated.View>
  );
}

// --------------- Share Modal ---------------

interface ShareModalProps {
  match: MatchOfferWithSlots | null;
  onClose: () => void;
}

function ShareModal({ match, onClose }: ShareModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const t = Colors[colorScheme];
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (!match) return null;
  const link = generateShareableLink(match.share_token);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    toast.showToast('Link copied', 'checkmark-outline');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({ message: link });
    } catch (_) {}
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={shareStyles.backdrop} onPress={onClose}>
        <Pressable style={[shareStyles.sheet, { backgroundColor: t.background }]} onPress={() => {}}>
          <View style={[shareStyles.handle, { backgroundColor: t.cardBorder }]} />

          <View style={[shareStyles.iconWrap, { backgroundColor: t.primaryLight }]}>
            <Ionicons name="share-social-outline" size={24} color={t.primary} />
          </View>

          <Text style={[shareStyles.title, { color: t.text }]}>Share with guest coaches</Text>
          <Text style={[shareStyles.body, { color: t.textSecondary }]}>
            Anyone with this link can pick a slot. The first to book wins.
          </Text>

          <View style={[shareStyles.linkRow, { backgroundColor: t.card, borderColor: t.primary + '4D' }]}>
            <Ionicons name="share-social-outline" size={16} color={t.primary} />
            <Text style={[shareStyles.linkText, { color: t.text }]} numberOfLines={1}>
              {link}
            </Text>
            <Pressable
              style={[shareStyles.copyBtn, { backgroundColor: copied ? t.success : t.primary }]}
              onPress={handleCopy}
            >
              <Ionicons name={copied ? 'checkmark-outline' : 'copy-outline'} size={13} color={colorScheme === 'dark' ? '#06140C' : '#FFFFFF'} />
              <Text style={[shareStyles.copyText, { color: colorScheme === 'dark' ? '#06140C' : '#FFFFFF' }]}>
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
          </View>

          <Button title="Share via..." icon="share-social-outline" onPress={handleNativeShare} style={{ marginTop: 14 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const shareStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 28,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  body: {
    fontSize: 13.5,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 10,
    width: '100%',
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});

// --------------- Result Modal ---------------

interface ResultModalProps {
  data: { match: MatchOfferWithSlots; slot: Slot } | null;
  onClose: () => void;
  onSave: (slotId: string, homeScore: number, awayScore: number, notes: string) => void;
}

function ResultModal({ data, onClose, onSave }: ResultModalProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const t = Colors[colorScheme];
  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (data) {
      setHome(data.slot.home_score ?? 0);
      setAway(data.slot.away_score ?? 0);
      setNotes(data.slot.result_notes || '');
    }
  }, [data]);

  if (!data) return null;
  const { match, slot } = data;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={shareStyles.backdrop} onPress={onClose}>
        <Pressable style={[shareStyles.sheet, { backgroundColor: t.background }]} onPress={() => {}}>
          <View style={[shareStyles.handle, { backgroundColor: t.cardBorder }]} />

          <Text style={[resultStyles.eyebrow, { color: t.primary }]}>FULL TIME</Text>
          <Text style={[resultStyles.title, { color: t.text }]}>
            {match.host_club || 'Home'} vs {slot.guest_club || 'Away'}
          </Text>
          <Text style={[resultStyles.sub, { color: t.textSecondary }]}>
            {match.age_group} · {match.format} · {fmtDate(slot.start_time)}
          </Text>

          <View style={[resultStyles.scoreboard, { backgroundColor: t.scoreboardBg }]}>
            <ScoreInput label="HOME" value={home} onChange={setHome} t={t} />
            <Text style={resultStyles.colon}>:</Text>
            <ScoreInput label="AWAY" value={away} onChange={setAway} t={t} />
          </View>

          <Text style={[resultStyles.notesLabel, { color: t.text }]}>Match notes</Text>
          <TextInput
            style={[resultStyles.textarea, { backgroundColor: t.inputBg, borderColor: t.cardBorder, color: t.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            placeholderTextColor={t.textTertiary}
            multiline
          />

          <Button
            title="Save result"
            icon="checkmark-outline"
            onPress={() => onSave(slot.id, home, away, notes)}
            style={{ marginTop: 14, width: '100%' }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  t: (typeof Colors)['light'];
}) {
  return (
    <View style={resultStyles.scoreCol}>
      <Text style={[resultStyles.scoreLabel, { color: t.primary }]}>{label}</Text>
      <Pressable
        style={[resultStyles.scoreBtn, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
        onPress={() => onChange(Math.max(0, value - 1))}
      >
        <Ionicons name="remove" size={14} color="#FFFFFF" />
      </Pressable>
      <Text style={[resultStyles.scoreValue, { color: t.primary }]}>{value}</Text>
      <Pressable
        style={[resultStyles.scoreBtn, { backgroundColor: t.primary }]}
        onPress={() => onChange(Math.min(99, value + 1))}
      >
        <Ionicons name="add" size={14} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const resultStyles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  scoreboard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    width: '100%',
    gap: 16,
    marginBottom: 18,
  },
  scoreCol: {
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: 'SpaceMono',
  },
  scoreBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'SpaceMono',
  },
  colon: {
    fontSize: 32,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.40)',
    marginTop: 28,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  textarea: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});

// --------------- Main Screen ---------------

export default function ManageScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const t = Colors[colorScheme];
  const { user } = useAuth();
  const toast = useToast();
  const { focusMatch, focusSlot } = useLocalSearchParams<{
    focusMatch?: string;
    focusSlot?: string;
  }>();

  const [offers, setOffers] = useState<MatchOfferWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<MatchOfferWithSlots | null>(null);
  const [resultModal, setResultModal] = useState<{ match: MatchOfferWithSlots; slot: Slot } | null>(null);

  const loadOffers = async () => {
    try {
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const myMatchIds = await getMyMatchIds(user.id);
      if (myMatchIds.length === 0) {
        setOffers([]);
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

      if (offersData) {
        const offersWithSlots = await Promise.all(
          offersData.map(async (offer) => {
            const { data: slotsData, error: slotsError } = await supabase
              .from('slots')
              .select('*')
              .eq('match_offer_id', offer.id)
              .order('start_time', { ascending: true });

            if (slotsError) throw slotsError;
            return { ...offer, slots: slotsData || [] };
          }),
        );
        setOffers(offersWithSlots);

        if (!expandedId) {
          setExpandedId(focusMatch || offersWithSlots[0]?.id || null);
        }
      }
    } catch (e: any) {
      console.error('Load offers error:', e);
      Alert.alert('Error Loading Matches', e.message || 'Failed to connect to database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOffers();
    }, []),
  );

  const filtered = useMemo(() => offers.filter((m) => matchesFilter(m, filter)), [offers, filter]);

  const offerCount = offers.length;
  const confirmedCount = offers.filter((m) => m.slots.some((s) => s.status === 'BOOKED')).length;

  const onRefresh = () => {
    setRefreshing(true);
    loadOffers();
  };

  const handleDeleteOffer = async (offerId: string) => {
    Alert.alert('Delete Offer', 'Are you sure you want to delete this offer? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('match_offers').delete().eq('id', offerId);
            if (error) throw error;
            await removeMyMatchId(user!.id, offerId);
            toast.showToast('Offer deleted', 'trash-outline');
            loadOffers();
          } catch (e: any) {
            Alert.alert('Error', 'Failed to delete offer: ' + e.message);
          }
        },
      },
    ]);
  };

  const handleSaveResult = async (slotId: string, homeScore: number, awayScore: number, notes: string) => {
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
      setResultModal(null);
      toast.showToast('Result saved', 'checkmark-outline');
      loadOffers();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save result: ' + e.message);
    }
  };

  // ---- Render ----

  if (loading) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: t.background }]} edges={['top']}>
        <ManageSkeleton />
      </SafeAreaView>
    );
  }

  const bookedSlot = (m: MatchOfferWithSlots) => m.slots.find((sl) => sl.status === 'BOOKED');

  return (
    <SafeAreaView style={[s.container, { backgroundColor: t.background }]} edges={['top']}>
      <ShareModal match={shareModal} onClose={() => setShareModal(null)} />
      <ResultModal data={resultModal} onClose={() => setResultModal(null)} onSave={handleSaveResult} />

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: t.text }]}>My matches</Text>
          <Text style={[s.headerSub, { color: t.textSecondary }]}>
            {offerCount} offer{offerCount !== 1 ? 's' : ''} · {confirmedCount} confirmed
          </Text>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipScroll}
          style={s.chipBar}
        >
          {FILTERS.map((f) => {
            const selected = filter === f;
            const count = filterCount(offers, f);
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  s.chip,
                  {
                    backgroundColor: selected ? t.primary : t.card,
                    borderWidth: selected ? 0 : 1,
                    borderColor: selected ? undefined : t.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    s.chipText,
                    {
                      color: selected ? (colorScheme === 'dark' ? '#06140C' : '#FFFFFF') : t.text,
                      fontWeight: selected ? '700' : '500',
                    },
                  ]}
                >
                  {f}
                  <Text style={{ opacity: 0.6, fontWeight: '600' }}> {count}</Text>
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Cards */}
        {filtered.length === 0 ? (
          <View
            style={[
              s.emptyCard,
              { borderColor: t.cardBorder, backgroundColor: t.card },
            ]}
          >
            <View style={[s.emptyIcon, { backgroundColor: t.secondary }]}>
              <Ionicons name="football-outline" size={22} color={t.primary} />
            </View>
            <Text style={[s.emptyTitle, { color: t.text }]}>No matches yet</Text>
            <Text style={[s.emptySub, { color: t.textSecondary }]}>Tap + to create your first offer.</Text>
          </View>
        ) : (
          filtered.map((match) => {
            const expanded = expandedId === match.id;
            const bSlot = bookedSlot(match);

            return (
              <View
                key={match.id}
                style={[
                  s.card,
                  {
                    backgroundColor: t.card,
                    borderColor: t.cardBorder,
                    shadowColor: t.shadow,
                  },
                ]}
              >
                {/* Collapsed header */}
                <AnimatedPressable
                  style={s.cardHeader}
                  scaleTo={0.99}
                  onPress={() => setExpandedId(expanded ? null : match.id)}
                >
                  {/* Left block */}
                  {bSlot ? (
                    <DateBlock iso={bSlot.start_time} />
                  ) : (
                    <FormatBlock format={match.format} />
                  )}

                  {/* Middle */}
                  <View style={s.cardMiddle}>
                    <Text style={[s.eyebrow, { color: t.textSecondary }]}>
                      {match.age_group} · {match.format}
                    </Text>
                    <Text style={[s.cardTitle, { color: t.text }]} numberOfLines={1}>
                      {getMatchTitle(match)}
                    </Text>
                    <View style={s.locationRow}>
                      <Ionicons name="pin-outline" size={11} color={t.textSecondary} />
                      <Text style={[s.locationText, { color: t.textSecondary }]} numberOfLines={1}>
                        {match.location}
                      </Text>
                    </View>
                  </View>

                  {/* Right */}
                  <View style={s.cardRight}>
                    <StatusPill status={match.status} />
                    <RotatingChevron expanded={expanded} color={t.textSecondary} />
                  </View>
                </AnimatedPressable>

                {/* Expanded body */}
                {expanded && (
                  <Animated.View entering={FadeInDown.duration(280)}>
                    {/* Slot rows */}
                    {match.slots.map((slot, i) => (
                      <View
                        key={slot.id}
                        style={[
                          s.slotRow,
                          i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.divider },
                        ]}
                      >
                        <StatusDot status={slot.status as any} size={8} />
                        <View style={s.slotInfo}>
                          <Text style={[s.slotDateTime, { color: t.text }]}>
                            {fmtDate(slot.start_time)} · {fmtTime(slot.start_time)}
                          </Text>
                          <Text style={[s.slotDesc, { color: t.textSecondary }]}>
                            {slotDescription(slot, match.duration)}
                          </Text>
                          {hasResult(slot) && (
                            <View style={[s.resultBadge, { backgroundColor: t.success + '26' }]}>
                              <Ionicons name="trophy-outline" size={11} color={t.success} />
                              <Text style={[s.resultText, { color: t.success }]}>
                                FT {slot.home_score} — {slot.away_score}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Right side of slot row */}
                        {isPlayed(slot) && !hasResult(slot) ? (
                          <Pressable
                            style={[s.saveBtn, { backgroundColor: t.warning + '38', borderColor: t.warning }]}
                            onPress={() => setResultModal({ match, slot })}
                          >
                            <Ionicons name="trophy-outline" size={13} color={t.warning} />
                            <Text style={[s.saveBtnText, { color: t.warning }]}>Save</Text>
                          </Pressable>
                        ) : slot.status === 'OPEN' ? (
                          <Text style={[s.openLabel, { color: t.success }]}>OPEN</Text>
                        ) : null}
                      </View>
                    ))}

                    {/* Action bar */}
                    <View style={[s.actionBar, { borderTopColor: t.divider }]}>
                      {match.status === 'OPEN' && (
                        <>
                          <Button
                            title="Share link"
                            icon="share-social-outline"
                            onPress={() => setShareModal(match)}
                            style={s.actionBtnFlex}
                          />
                          <DeleteButton t={t} onPress={() => handleDeleteOffer(match.id)} />
                        </>
                      )}

                      {match.status === 'PENDING_APPROVAL' && (
                        <>
                          <View style={[s.warningPill, { backgroundColor: t.warning + '26', borderColor: t.warning }]}>
                            <Ionicons name="bell-outline" size={16} color={t.warning} />
                            <Text style={[s.warningPillText, { color: t.warning }]}>
                              Waiting for {match.approver_email}
                            </Text>
                          </View>
                          <DeleteButton t={t} onPress={() => handleDeleteOffer(match.id)} />
                        </>
                      )}

                      {match.status === 'CLOSED' && awaitingResult(match) && (
                        <>
                          <Button
                            title="Save result"
                            icon="trophy-outline"
                            onPress={() => {
                              const slot = match.slots.find((sl) => isPlayed(sl) && !hasResult(sl));
                              if (slot) setResultModal({ match, slot });
                            }}
                            style={s.actionBtnFlex}
                          />
                          <DeleteButton t={t} onPress={() => handleDeleteOffer(match.id)} />
                        </>
                      )}

                      {match.status === 'CLOSED' && !awaitingResult(match) && (
                        <>
                          <View style={[s.confirmedPill, { backgroundColor: t.secondary }]}>
                            <Ionicons name="checkmark-outline" size={16} color={t.success} />
                            <Text style={[s.confirmedPillText, { color: t.text }]}>Match confirmed</Text>
                          </View>
                          <DeleteButton t={t} onPress={() => handleDeleteOffer(match.id)} />
                        </>
                      )}

                      {match.status === 'CANCELLED' && (
                        <DeleteButton t={t} onPress={() => handleDeleteOffer(match.id)} />
                      )}
                    </View>
                  </Animated.View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <AnimatedPressable
        style={[s.fab, { backgroundColor: t.primary, shadowColor: t.glow }]}
        onPress={() => router.push('/match/create')}
        scaleTo={0.9}
      >
        <Ionicons name="add-outline" size={28} color={colorScheme === 'dark' ? '#06140C' : '#FFFFFF'} style={{ strokeWidth: 2.6 } as any} />
      </AnimatedPressable>
    </SafeAreaView>
  );
}

// --------------- Delete Button ---------------

function DeleteButton({ t, onPress }: { t: (typeof Colors)['light']; onPress: () => void }) {
  return (
    <Pressable style={[s.deleteBtn, { backgroundColor: t.error + '1A', borderColor: t.error + '4D' }]} onPress={onPress}>
      <Ionicons name="trash-outline" size={16} color={t.error} />
    </Pressable>
  );
}

// --------------- Styles ---------------

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 160,
  },

  // Header
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },

  // Filter chips
  chipBar: {
    flexGrow: 0,
  },
  chipScroll: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
  },

  // Card
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  cardMiddle: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11.5,
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },

  // Slot rows
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  slotInfo: {
    flex: 1,
  },
  slotDateTime: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  slotDesc: {
    fontSize: 11.5,
    marginTop: 1,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  openLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionBtnFlex: {
    flex: 1,
    height: 42,
  },
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  warningPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  confirmedPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  confirmedPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Empty state
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 28,
    marginHorizontal: 14,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 90,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
});
