import { Card } from '@/components/ui/Card';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
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
                    <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadApprovals(); }} tintColor={Colors[colorScheme].primary} />
                }
            >
                <View style={styles.header}>
                    <Text style={styles.title}>{t('approvals.title')}</Text>
                    <Text style={styles.subtitle}>
                        {approvals.length === 0 ? t('approvals.noPending') : t('approvals.pending', { count: approvals.length })}
                    </Text>
                </View>

                {approvals.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="shield-checkmark-outline" size={40} color={Colors[colorScheme].primary} />
                        </View>
                        <Text style={styles.emptyTitle}>{t('approvals.allClear')}</Text>
                        <Text style={styles.emptySubtitle}>
                            {t('approvals.allClearDesc')}
                        </Text>
                    </Card>
                ) : (
                    approvals.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.8}
                            onPress={() => router.push(`/approve/${item.approval_token}` as any)}
                        >
                            <Card style={styles.approvalCard}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.urgentBadge}>
                                        <View style={styles.urgentDot} />
                                        <Text style={styles.urgentText}>{t('approvals.needsApproval')}</Text>
                                    </View>
                                    <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                                </View>

                                <Text style={styles.matchTitle}>
                                    {item.offer.age_group} • {item.offer.format}
                                </Text>

                                <View style={styles.detailRow}>
                                    <Ionicons name="person-outline" size={14} color={Colors[colorScheme].textSecondary} />
                                    <Text style={styles.detailText}>
                                        {item.offer.host_name}{item.offer.host_club ? ` (${item.offer.host_club})` : ''}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Ionicons name="location-outline" size={14} color={Colors[colorScheme].textSecondary} />
                                    <Text style={styles.detailText} numberOfLines={1}>{item.offer.location}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Ionicons name="time-outline" size={14} color={Colors[colorScheme].textSecondary} />
                                    <Text style={styles.detailText}>{item.offer.duration} min • {t('approvals.slotsToReview', { count: item.slot_count })}</Text>
                                </View>

                                <View style={styles.reviewRow}>
                                    <Text style={styles.reviewText}>{t('approvals.tapToReview')}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={Colors[colorScheme].primary} />
                                </View>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors[colorScheme].background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    header: { marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '700', color: Colors[colorScheme].text, marginBottom: 4 },
    subtitle: { fontSize: 15, color: Colors[colorScheme].textSecondary },
    emptyCard: { padding: 32, alignItems: 'center', gap: 8 },
    emptyIconWrap: {
        width: 72, height: 72, borderRadius: 22,
        backgroundColor: Colors[colorScheme].secondary,
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors[colorScheme].text },
    emptySubtitle: {
        fontSize: 13, color: Colors[colorScheme].textTertiary,
        textAlign: 'center', lineHeight: 18, paddingHorizontal: 8,
    },
    approvalCard: {
        padding: 16, marginBottom: 14,
        borderLeftWidth: 3, borderLeftColor: Colors[colorScheme].warning,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    urgentBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(251,191,36,0.12)',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    },
    urgentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors[colorScheme].warning },
    urgentText: { fontSize: 11, fontWeight: '700', color: Colors[colorScheme].warning },
    dateText: { fontSize: 12, color: Colors[colorScheme].textTertiary },
    matchTitle: { fontSize: 17, fontWeight: '700', color: Colors[colorScheme].text, marginBottom: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    detailText: { fontSize: 13, color: Colors[colorScheme].textSecondary, flex: 1 },
    reviewRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
        gap: 4, marginTop: 10, paddingTop: 10,
        borderTopWidth: 1, borderTopColor: Colors[colorScheme].border,
    },
    reviewText: { fontSize: 13, fontWeight: '600', color: Colors[colorScheme].primary },
});
