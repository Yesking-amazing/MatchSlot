import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { ChevronRight, Clock, MapPin, ShieldCheck } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PendingApproval {
    id: string;
    approval_token: string;
    match_offer_id: string;
    status: string;
    created_at: string;
    offer: {
        age_group: string;
        format: string;
        location: string;
        host_name: string;
        host_club: string | null;
        duration: number;
    };
    slot_count: number;
}

export default function ApprovalsScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
    const styles = getStyles(colorScheme);
    const { user } = useAuth();
    const [approvals, setApprovals] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadApprovals = async () => {
        if (!user?.email) { setLoading(false); setRefreshing(false); return; }

        try {
            const { data, error } = await supabase
                .from('approvals')
                .select(`
                    id,
                    approval_token,
                    match_offer_id,
                    status,
                    created_at,
                    match_offers (
                        age_group,
                        format,
                        location,
                        host_name,
                        host_club,
                        duration
                    )
                `)
                .eq('approver_email', user.email.toLowerCase())
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mapped = await Promise.all(data.map(async (row: any) => {
                    const { count } = await supabase
                        .from('slots')
                        .select('id', { count: 'exact', head: true })
                        .eq('match_offer_id', row.match_offer_id)
                        .eq('status', 'PENDING_APPROVAL');

                    return {
                        id: row.id,
                        approval_token: row.approval_token,
                        match_offer_id: row.match_offer_id,
                        status: row.status,
                        created_at: row.created_at,
                        offer: row.match_offers,
                        slot_count: count ?? 0,
                    };
                }));

                setApprovals(mapped);
            }
        } catch (e: any) {
            console.error('Load approvals error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadApprovals(); }, []));

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={c.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadApprovals(); }} tintColor={c.primary} />
                }
            >
                <View style={styles.header}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{t('approvals.title')}</Text>
                        {approvals.length > 0 && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{approvals.length}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.subtitle}>
                        {approvals.length === 0 ? t('approvals.noPending') : t('approvals.pending', { count: approvals.length })}
                    </Text>
                </View>

                {approvals.length === 0 ? (
                    <EmptyState
                        icon={<ShieldCheck size={24} color={c.primary} strokeWidth={2} />}
                        title={t('approvals.allClear')}
                        subtitle={t('approvals.allClearDesc')}
                    />
                ) : (
                    approvals.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.85}
                            onPress={() => router.push(`/approve/${item.approval_token}` as any)}
                        >
                            <Card style={styles.approvalCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.needsPill}>
                                        <Clock size={11} color={c.warningText} strokeWidth={2.5} />
                                        <Text style={styles.needsPillText}>{t('approvals.needsApproval')}</Text>
                                    </View>
                                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                                </View>

                                <Text style={styles.matchTitle}>
                                    {item.offer.age_group} • {item.offer.format}
                                </Text>

                                <View style={styles.detailRow}>
                                    <MapPin size={15} color={c.textMuted} strokeWidth={2} />
                                    <Text style={styles.detailText} numberOfLines={1}>{item.offer.location}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Clock size={15} color={c.textMuted} strokeWidth={2} />
                                    <Text style={styles.detailText}>{item.offer.duration} min • {t('approvals.slotsToReview', { count: item.slot_count })}</Text>
                                </View>

                                <View style={styles.reviewRow}>
                                    <Text style={styles.reviewText}>{t('approvals.tapToReview')}</Text>
                                    <ChevronRight size={16} color={c.primary} strokeWidth={2.5} />
                                </View>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
    const c = Colors[colorScheme];
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: c.background },
        centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
        scrollContent: { padding: 20, paddingBottom: 100 },
        header: { marginBottom: 20 },
        titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
        title: {
            fontFamily: Fonts.display, fontSize: 26, fontWeight: '800',
            letterSpacing: -0.8, color: c.text,
        },
        countBadge: {
            minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 8,
            backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center',
        },
        countText: { fontFamily: Fonts.display, fontSize: 14, fontWeight: '800', color: c.accentInk },
        subtitle: { fontFamily: Fonts.body, fontSize: 13.5, fontWeight: '500', color: c.textMuted },
        approvalCard: { padding: 16 },
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
        needsPill: {
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: 'rgba(232,168,58,0.16)',
            paddingHorizontal: 9, height: 24, borderRadius: 999,
        },
        needsPillText: {
            fontFamily: Fonts.body, fontSize: 11, fontWeight: '700',
            letterSpacing: 0.6, textTransform: 'uppercase', color: c.warningText,
        },
        dateText: { fontFamily: Fonts.body, fontSize: 11.5, fontWeight: '500', color: c.textFaint },
        matchTitle: {
            fontFamily: Fonts.display, fontSize: 17, fontWeight: '800',
            letterSpacing: -0.3, color: c.text, marginBottom: 10,
        },
        detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
        detailText: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '500', color: c.textMuted, flex: 1 },
        reviewRow: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
            gap: 4, marginTop: 12, paddingTop: 12,
            borderTopWidth: 1, borderTopColor: c.divider,
        },
        reviewText: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '700', color: c.primary },
    });
};
