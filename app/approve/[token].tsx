import { AppBanner } from '@/components/ui/AppBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusChip, StatusKind } from '@/components/ui/StatusChip';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { openInMaps } from '@/lib/mapsUtils';
import { sendPushToUser } from '@/lib/notifications';
import { generateShareableLink } from '@/lib/shareLink';
import { supabase } from '@/lib/supabase';
import { Approval, MatchOffer, Slot } from '@/types/database';
import * as Clipboard from 'expo-clipboard';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, Check, Clock, MapPin, User, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Approval Screen - Handles individual slot approval/denial
 *
 * The approver can approve or deny each slot individually using
 * the buttons next to each slot.
 */

// Web-compatible confirmation modal
interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    confirmStyle?: 'default' | 'destructive';
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmModal({ visible, title, message, confirmText, cancelText, confirmStyle, onConfirm, onCancel, modalStyles }: ConfirmModalProps & { modalStyles: any }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <Text style={modalStyles.title}>{title}</Text>
                    <Text style={modalStyles.message}>{message}</Text>
                    <View style={modalStyles.buttonRow}>
                        <Pressable style={modalStyles.cancelButton} onPress={onCancel}>
                            <Text style={modalStyles.cancelText}>{cancelText || 'Cancel'}</Text>
                        </Pressable>
                        <Pressable
                            style={[modalStyles.confirmButton, confirmStyle === 'destructive' && modalStyles.destructiveButton]}
                            onPress={onConfirm}
                        >
                            <Text style={[modalStyles.confirmText, confirmStyle === 'destructive' && modalStyles.destructiveText]}>
                                {confirmText}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// Simple alert modal
interface AlertModalProps {
    visible: boolean;
    title: string;
    message: string;
    okText?: string;
    onClose: () => void;
}

function AlertModal({ visible, title, message, okText, onClose, modalStyles }: AlertModalProps & { modalStyles: any }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <Text style={modalStyles.title}>{title}</Text>
                    <Text style={modalStyles.message}>{message}</Text>
                    <View style={modalStyles.buttonRow}>
                        <Pressable style={modalStyles.confirmButton} onPress={onClose}>
                            <Text style={modalStyles.confirmText}>{okText || 'OK'}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const getModalStyles = (colorScheme: 'light' | 'dark') => {
    const c = Colors[colorScheme];
    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        container: {
            backgroundColor: c.card,
            borderRadius: 16,
            padding: 24,
            maxWidth: 340,
            width: '100%',
            borderWidth: 1,
            borderColor: c.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 8,
        },
        title: {
            fontFamily: Fonts.display,
            fontSize: 18,
            fontWeight: '800',
            letterSpacing: -0.3,
            color: c.text,
            textAlign: 'center',
            marginBottom: 10,
        },
        message: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '500',
            color: c.textMuted,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 20,
        },
        buttonRow: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
        },
        cancelButton: {
            paddingVertical: 12,
            paddingHorizontal: 22,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: 'transparent',
            minWidth: 96,
        },
        cancelText: {
            fontFamily: Fonts.body,
            fontSize: 14,
            fontWeight: '700',
            textAlign: 'center',
            color: c.textSecondary,
        },
        confirmButton: {
            paddingVertical: 12,
            paddingHorizontal: 22,
            borderRadius: 12,
            backgroundColor: c.primary,
            minWidth: 96,
        },
        confirmText: {
            fontFamily: Fonts.body,
            fontSize: 14,
            fontWeight: '700',
            textAlign: 'center',
            color: c.primaryInk,
        },
        destructiveButton: {
            backgroundColor: c.error,
        },
        destructiveText: {
            color: '#fff',
        },
    });
};

export default function ApprovalScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
    const styles = getStyles(colorScheme);
    const mStyles = getModalStyles(colorScheme);
    const { t } = useTranslation();
    const { token } = useLocalSearchParams<{ token: string }>();
    const [approval, setApproval] = useState<Approval | null>(null);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [offer, setOffer] = useState<MatchOffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null); // Track which slot is being processed

    // Modal states
    const [confirmModal, setConfirmModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        confirmText: string;
        cancelText?: string;
        confirmStyle?: 'default' | 'destructive';
        onConfirm: () => void;
    } | null>(null);
    const [alertModal, setAlertModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
        okText?: string;
        onClose?: () => void;
    } | null>(null);

    // Track slot approval statuses (local state for UI)
    const [slotStatuses, setSlotStatuses] = useState<Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'>>({});

    useEffect(() => {
        loadApprovalDetails();
    }, [token]);

    const loadApprovalDetails = async () => {
        try {
            // Load approval by token
            const { data: approvalData, error: approvalError } = await supabase
                .from('approvals')
                .select('*')
                .eq('approval_token', token)
                .single();

            if (approvalError) throw approvalError;

            if (!approvalData) {
                return;
            }

            // Load offer
            const { data: offerData, error: offerError } = await supabase
                .from('match_offers')
                .select('*')
                .eq('id', approvalData.match_offer_id)
                .single();

            if (offerError) throw offerError;

            // Load slots for this offer
            const { data: slotsData, error: slotsError } = await supabase
                .from('slots')
                .select('*')
                .eq('match_offer_id', approvalData.match_offer_id)
                .order('start_time', { ascending: true });

            if (slotsError) throw slotsError;

            setApproval(approvalData);
            setOffer(offerData);
            setSlots(slotsData || []);

            // Initialize slot statuses from database
            const statuses: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'> = {};
            (slotsData || []).forEach(slot => {
                statuses[slot.id] = (slot.status === 'OPEN' || slot.status === 'BOOKED') ? 'APPROVED' :
                    slot.status === 'REJECTED' ? 'REJECTED' : 'PENDING';
            });
            setSlotStatuses(statuses);
        } catch (e: any) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const showConfirm = (config: {
        title: string;
        message: string;
        confirmText: string;
        cancelText?: string;
        confirmStyle?: 'default' | 'destructive';
        onConfirm: () => void;
    }) => {
        setConfirmModal({
            visible: true,
            ...config,
        });
    };

    const showAlert = (title: string, message: string, onClose?: () => void) => {
        setAlertModal({ visible: true, title, message, okText: t('common.ok'), onClose });
    };

    const handleApproveSlot = (slot: Slot) => {
        showConfirm({
            title: t('approve.approveSlot'),
            message: t('approve.approveSlotDesc', { time: formatDateTime(slot.start_time) }),
            confirmText: t('approve.approve'),
            cancelText: t('common.cancel'),
            onConfirm: async () => {
                setConfirmModal(null);
                setProcessing(slot.id);
                try {
                    // Update slot status to OPEN (so users can book it)
                    const { error: slotError } = await supabase
                        .from('slots')
                        .update({ status: 'OPEN' })
                        .eq('id', slot.id);

                    if (slotError) throw slotError;

                    // Update offer status to OPEN if it was pending
                    if (offer && offer.status === 'PENDING_APPROVAL') {
                        await supabase
                            .from('match_offers')
                            .update({ status: 'OPEN' })
                            .eq('id', offer.id);

                        setOffer(prev => prev ? { ...prev, status: 'OPEN' } : null);
                    }

                    // Update local state
                    setSlotStatuses(prev => ({ ...prev, [slot.id]: 'APPROVED' }));

                    // Notify host
                    if (offer?.host_contact) {
                        await supabase.from('notifications').insert({
                            recipient_email: offer.host_contact,
                            recipient_type: 'HOST',
                            notification_type: 'APPROVED',
                            match_offer_id: offer.id,
                            slot_id: slot.id,
                            subject: 'Slot Approved!',
                            message: `The slot on ${formatDateTime(slot.start_time)} has been approved and is now live.`,
                            sent: false,
                        });
                    }

                    // Push notify host
                    if (offer?.created_by) {
                        await sendPushToUser(offer.created_by, 'Slot Approved ✅', `Your ${offer.age_group} ${offer.format} slot on ${formatDateTime(slot.start_time)} is now live.`);
                    }
                    showAlert(t('approve.approvedLabel') + '!', t('approve.approvedMsg', { time: formatDateTime(slot.start_time) }));
                } catch (e: any) {
                    console.error(e);
                    showAlert(t('common.error'), t('approve.failedApprove') + ': ' + e.message);
                } finally {
                    setProcessing(null);
                }
            },
        });
    };

    const handleRejectSlot = (slot: Slot) => {
        showConfirm({
            title: t('approve.rejectSlot'),
            message: t('approve.rejectSlotDesc', { time: formatDateTime(slot.start_time) }),
            confirmText: t('approve.deny'),
            cancelText: t('common.cancel'),
            confirmStyle: 'destructive',
            onConfirm: async () => {
                setConfirmModal(null);
                setProcessing(slot.id);
                try {
                    // Update slot status to REJECTED
                    const { error: slotError } = await supabase
                        .from('slots')
                        .update({ status: 'REJECTED' })
                        .eq('id', slot.id);

                    if (slotError) throw slotError;

                    // Update local state
                    const newStatuses: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'> = { ...slotStatuses, [slot.id]: 'REJECTED' };
                    setSlotStatuses(newStatuses);

                    // If all slots are rejected, cancel the offer
                    const allRejected = slots.every(s =>
                        s.id === slot.id ? true : newStatuses[s.id] === 'REJECTED'
                    );

                    if (allRejected && offer) {
                        await supabase
                            .from('match_offers')
                            .update({ status: 'CANCELLED' })
                            .eq('id', offer.id);

                        setOffer(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
                    }

                    // Notify host
                    if (offer?.host_contact) {
                        await supabase.from('notifications').insert({
                            recipient_email: offer.host_contact,
                            recipient_type: 'HOST',
                            notification_type: 'REJECTED',
                            match_offer_id: offer.id,
                            slot_id: slot.id,
                            subject: 'Slot Rejected',
                            message: `The slot on ${formatDateTime(slot.start_time)} has been rejected.`,
                            sent: false,
                        });
                    }

                    showAlert(t('approve.rejectedLabel'), t('approve.rejectedMsg', { time: formatDateTime(slot.start_time) }));
                } catch (e: any) {
                    console.error(e);
                    showAlert(t('common.error'), t('approve.failedReject') + ': ' + e.message);
                } finally {
                    setProcessing(null);
                }
            },
        });
    };

    const handleApproveAll = () => {
        const pendingSlots = slots.filter(s => slotStatuses[s.id] === 'PENDING');
        if (pendingSlots.length === 0) {
            showAlert(t('approve.noPending'), t('approve.allProcessed'));
            return;
        }

        showConfirm({
            title: t('approve.approveAll'),
            message: t('approve.approveAllDesc', { count: pendingSlots.length }),
            confirmText: t('approve.approveAll'),
            cancelText: t('common.cancel'),
            onConfirm: async () => {
                setConfirmModal(null);
                setProcessing('all');
                try {
                    // Update all pending slots to OPEN
                    const pendingIds = pendingSlots.map(s => s.id);
                    const { error: slotError } = await supabase
                        .from('slots')
                        .update({ status: 'OPEN' })
                        .in('id', pendingIds);

                    if (slotError) throw slotError;

                    // Update approval status
                    if (approval) {
                        await supabase
                            .from('approvals')
                            .update({
                                status: 'APPROVED',
                                decision_at: new Date().toISOString(),
                            })
                            .eq('id', approval.id);
                    }

                    // Update offer status to OPEN
                    if (offer) {
                        await supabase
                            .from('match_offers')
                            .update({ status: 'OPEN' })
                            .eq('id', offer.id);

                        setOffer(prev => prev ? { ...prev, status: 'OPEN' } : null);
                    }

                    // Update local state
                    const newStatuses: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'> = { ...slotStatuses };
                    pendingIds.forEach(id => { newStatuses[id] = 'APPROVED'; });
                    setSlotStatuses(newStatuses);

                    // Generate share link
                    const shareLink = offer ? generateShareableLink(offer.share_token) : '';

                    // Push notify host
                    if (offer?.created_by) {
                        await sendPushToUser(offer.created_by, 'Match Approved ✅', `All ${pendingSlots.length} slot(s) for your ${offer.age_group} ${offer.format} match are now live.`);
                    }
                    showAlert(t('approve.allApproved'), t('approve.allApprovedDesc', { count: pendingSlots.length }),
                        async () => {
                            if (shareLink) {
                                await Clipboard.setStringAsync(shareLink);
                                showAlert(t('approve.linkCopied'), t('approve.linkCopiedDesc'));
                            }
                        }
                    );
                } catch (e: any) {
                    console.error(e);
                    showAlert(t('common.error'), t('approve.failedApprove') + ': ' + e.message);
                } finally {
                    setProcessing(null);
                }
            },
        });
    };

    const handleRejectAll = () => {
        const pendingSlots = slots.filter(s => slotStatuses[s.id] === 'PENDING');
        if (pendingSlots.length === 0) {
            showAlert(t('approve.noPending'), t('approve.allProcessed'));
            return;
        }

        showConfirm({
            title: t('approve.rejectAll'),
            message: t('approve.rejectAllDesc', { count: pendingSlots.length }),
            confirmText: t('approve.rejectAll'),
            cancelText: t('common.cancel'),
            confirmStyle: 'destructive',
            onConfirm: async () => {
                setConfirmModal(null);
                setProcessing('all');
                try {
                    // Update all pending slots to REJECTED
                    const pendingIds = pendingSlots.map(s => s.id);
                    const { error: slotError } = await supabase
                        .from('slots')
                        .update({ status: 'REJECTED' })
                        .in('id', pendingIds);

                    if (slotError) throw slotError;

                    // Update approval status
                    if (approval) {
                        await supabase
                            .from('approvals')
                            .update({
                                status: 'REJECTED',
                                decision_at: new Date().toISOString(),
                            })
                            .eq('id', approval.id);
                    }

                    // Update offer status to CANCELLED
                    if (offer) {
                        await supabase
                            .from('match_offers')
                            .update({ status: 'CANCELLED' })
                            .eq('id', offer.id);

                        setOffer(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
                    }

                    // Update local state
                    const newStatuses: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED'> = { ...slotStatuses };
                    pendingIds.forEach(id => { newStatuses[id] = 'REJECTED'; });
                    setSlotStatuses(newStatuses);

                    showAlert(t('approve.allRejected'), t('approve.allRejectedDesc'),
                        () => router.push('/')
                    );
                } catch (e: any) {
                    console.error(e);
                    showAlert(t('common.error'), t('approve.failedReject') + ': ' + e.message);
                } finally {
                    setProcessing(null);
                }
            },
        });
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Map local slot status -> semantic StatusChip kind + translated label.
    const slotChip = (status: 'PENDING' | 'APPROVED' | 'REJECTED'): { kind: StatusKind; label: string } => {
        if (status === 'APPROVED') return { kind: 'confirmed', label: t('approve.approvedLabel') };
        if (status === 'REJECTED') return { kind: 'cancelled', label: t('approve.rejectedLabel') };
        return { kind: 'pending', label: t('approve.pendingLabel') };
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    if (!approval || !offer) {
        return (
            <>
                <Stack.Screen options={{
                    title: t('approve.title'),
                    headerTitleStyle: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 18, color: c.text },
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: c.background },
                    headerTintColor: c.text,
                }} />
                <View style={styles.centerContainer}>
                    <EmptyState
                        icon={<AlertCircle size={24} color={c.primary} strokeWidth={2} />}
                        title={t('approve.notFound')}
                        subtitle={t('approve.notFoundDesc')}
                    />
                </View>
            </>
        );
    }

    const pendingCount = slots.filter(s => slotStatuses[s.id] === 'PENDING').length;
    const approvedCount = slots.filter(s => slotStatuses[s.id] === 'APPROVED').length;
    const rejectedCount = slots.filter(s => slotStatuses[s.id] === 'REJECTED').length;

    return (
        <>
            <Stack.Screen options={{
                title: t('approve.title'),
                headerTitleStyle: { fontFamily: Fonts.display, fontWeight: '800', fontSize: 18, color: c.text },
                headerShadowVisible: false,
                headerStyle: { backgroundColor: c.background },
                headerTintColor: c.text,
            }} />

            <AppBanner deepLink={`matchslot://approve/${token}`} />

            {/* Confirmation Modal */}
            {confirmModal && (
                <ConfirmModal
                    visible={confirmModal.visible}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText={confirmModal.confirmText}
                    cancelText={confirmModal.cancelText}
                    confirmStyle={confirmModal.confirmStyle}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                    modalStyles={mStyles}
                />
            )}

            {/* Alert Modal */}
            {alertModal && (
                <AlertModal
                    visible={alertModal.visible}
                    title={alertModal.title}
                    message={alertModal.message}
                    okText={alertModal.okText}
                    onClose={() => {
                        const onCloseCallback = alertModal.onClose;
                        setAlertModal(null);
                        if (onCloseCallback) onCloseCallback();
                    }}
                    modalStyles={mStyles}
                />
            )}

            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.headerBlock}>
                        <Text style={styles.headerTitle}>{offer.age_group} • {offer.format}</Text>
                        <View style={styles.headerLocationRow}>
                            <MapPin size={14} color={c.textMuted} strokeWidth={2} />
                            <Text style={styles.headerLocation} numberOfLines={1}>{offer.location}</Text>
                        </View>
                    </View>

                    {/* Status Summary */}
                    <View style={styles.statusSummary}>
                        <View style={styles.statusBadge}>
                            <Text style={[styles.statusCount, { color: c.warningText }]}>{pendingCount}</Text>
                            <Text style={styles.statusLabel}>{t('approve.pendingLabel')}</Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusBadge}>
                            <Text style={[styles.statusCount, { color: c.success }]}>{approvedCount}</Text>
                            <Text style={styles.statusLabel}>{t('approve.approvedLabel')}</Text>
                        </View>
                        <View style={styles.statusDivider} />
                        <View style={styles.statusBadge}>
                            <Text style={[styles.statusCount, { color: c.error }]}>{rejectedCount}</Text>
                            <Text style={styles.statusLabel}>{t('approve.rejectedLabel')}</Text>
                        </View>
                    </View>

                    {/* Host + Match Details */}
                    <Text style={styles.sectionTitle}>{t('approve.matchDetailsTitle')}</Text>
                    <Card style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <View style={styles.detailLeft}>
                                <User size={16} color={c.textMuted} strokeWidth={2} />
                                <Text style={styles.detailLabel}>{t('approve.hostCoach')}</Text>
                            </View>
                            <Text style={styles.detailValue} numberOfLines={1}>
                                {offer.host_name}{offer.host_club ? ` (${offer.host_club})` : ''}
                            </Text>
                        </View>

                        <View style={styles.rowDivider} />

                        <View style={styles.detailRow}>
                            <View style={styles.detailLeft}>
                                <Clock size={16} color={c.textMuted} strokeWidth={2} />
                                <Text style={styles.detailLabel}>{t('detail.duration')}</Text>
                            </View>
                            <Text style={styles.detailValue}>{offer.duration} {t('common.minutes')}</Text>
                        </View>

                        <View style={styles.rowDivider} />

                        <TouchableOpacity style={styles.detailRow} activeOpacity={0.7} onPress={() => openInMaps(offer.location)}>
                            <View style={styles.detailLeft}>
                                <MapPin size={16} color={c.textMuted} strokeWidth={2} />
                                <Text style={styles.detailLabel}>{t('detail.location')}</Text>
                            </View>
                            <Text style={[styles.detailValue, styles.detailLink]} numberOfLines={1}>{offer.location}</Text>
                        </TouchableOpacity>
                    </Card>

                    {/* Time Slots with Individual Approve/Reject Buttons */}
                    <Text style={styles.sectionTitle}>{t('approve.timeSlots')}</Text>
                    {slots.map((slot) => {
                        const status = slotStatuses[slot.id];
                        const isProcessing = processing === slot.id || processing === 'all';
                        const chip = slotChip(status);

                        return (
                            <Card key={slot.id} style={[styles.slotCard, status !== 'PENDING' && styles.slotResolved]}>
                                <View style={styles.slotHeader}>
                                    <Text style={styles.slotText}>{formatDateTime(slot.start_time)}</Text>
                                    <StatusChip kind={chip.kind} label={chip.label} />
                                </View>

                                {status === 'PENDING' && (
                                    <View style={styles.slotActions}>
                                        {isProcessing ? (
                                            <ActivityIndicator size="small" color={c.primary} />
                                        ) : (
                                            <>
                                                <Button
                                                    title={t('approve.deny')}
                                                    variant="deny"
                                                    icon={<X size={16} color={c.error} strokeWidth={2.5} />}
                                                    onPress={() => handleRejectSlot(slot)}
                                                    style={styles.slotButton}
                                                />
                                                <Button
                                                    title={t('approve.approve')}
                                                    variant="primary"
                                                    icon={<Check size={16} color={c.primaryInk} strokeWidth={2.5} />}
                                                    onPress={() => handleApproveSlot(slot)}
                                                    style={styles.slotButton}
                                                />
                                            </>
                                        )}
                                    </View>
                                )}
                            </Card>
                        );
                    })}
                </ScrollView>

                {/* Bulk Actions Footer */}
                {pendingCount > 0 && (
                    <View style={styles.footer}>
                        <Button
                            title={t('approve.rejectAll')}
                            variant="deny"
                            onPress={handleRejectAll}
                            loading={processing === 'all'}
                            style={styles.footerButton}
                        />
                        <Button
                            title={t('approve.approveAll')}
                            variant="primary"
                            onPress={handleApproveAll}
                            loading={processing === 'all'}
                            style={styles.footerButton}
                        />
                    </View>
                )}
            </View>
        </>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
    const c = Colors[colorScheme];
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.background,
        },
        centerContainer: {
            flex: 1,
            backgroundColor: c.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        scrollContent: {
            padding: 20,
            paddingBottom: 120,
        },
        headerBlock: {
            marginBottom: 18,
        },
        headerTitle: {
            fontFamily: Fonts.display,
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -0.8,
            color: c.text,
            marginBottom: 6,
        },
        headerLocationRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        headerLocation: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '500',
            color: c.textMuted,
            flex: 1,
        },
        statusSummary: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginBottom: 20,
            paddingVertical: 16,
            backgroundColor: c.surfaceSunk,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: c.border,
        },
        statusBadge: {
            flex: 1,
            alignItems: 'center',
        },
        statusDivider: {
            width: 1,
            alignSelf: 'stretch',
            marginVertical: 4,
            backgroundColor: c.divider,
        },
        statusCount: {
            fontFamily: Fonts.display,
            fontSize: 24,
            fontWeight: '800',
            letterSpacing: -0.5,
        },
        statusLabel: {
            fontFamily: Fonts.body,
            fontSize: 11.5,
            fontWeight: '500',
            color: c.textMuted,
            marginTop: 4,
        },
        sectionTitle: {
            fontFamily: Fonts.body,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: c.textMuted,
            marginTop: 6,
            marginBottom: 10,
        },
        detailsCard: {
            padding: 16,
            marginBottom: 20,
        },
        detailRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingVertical: 10,
        },
        detailLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        detailLabel: {
            fontFamily: Fonts.body,
            fontSize: 12.5,
            fontWeight: '600',
            color: c.textSecondary,
        },
        detailValue: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '700',
            color: c.text,
            flexShrink: 1,
            textAlign: 'right',
        },
        detailLink: {
            color: c.primary,
        },
        rowDivider: {
            height: 1,
            backgroundColor: c.divider,
        },
        slotCard: {
            padding: 16,
            marginBottom: 12,
        },
        slotResolved: {
            opacity: 0.72,
        },
        slotHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
        },
        slotText: {
            fontFamily: Fonts.display,
            fontSize: 16,
            fontWeight: '800',
            letterSpacing: -0.3,
            color: c.text,
            flexShrink: 1,
        },
        slotActions: {
            flexDirection: 'row',
            gap: 10,
            marginTop: 14,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: c.divider,
        },
        slotButton: {
            flex: 1,
            height: 46,
            paddingHorizontal: 12,
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            gap: 12,
            padding: 20,
            paddingBottom: 28,
            backgroundColor: c.background,
            borderTopWidth: 1,
            borderTopColor: c.border,
        },
        footerButton: {
            flex: 1,
        },
    });
};
