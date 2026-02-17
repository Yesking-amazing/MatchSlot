import { AppBanner } from '@/components/ui/AppBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { generateShareableLink } from '@/lib/shareLink';
import { supabase } from '@/lib/supabase';
import { Approval, MatchOffer, Slot } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
    confirmStyle?: 'default' | 'destructive';
    onConfirm: () => void;
    onCancel: () => void;
}

function ConfirmModal({ visible, title, message, confirmText, confirmStyle, onConfirm, onCancel }: ConfirmModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <Text style={modalStyles.title}>{title}</Text>
                    <Text style={modalStyles.message}>{message}</Text>
                    <View style={modalStyles.buttonRow}>
                        <Pressable style={modalStyles.cancelButton} onPress={onCancel}>
                            <Text style={modalStyles.cancelText}>Cancel</Text>
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
    onClose: () => void;
}

function AlertModal({ visible, title, message, onClose }: AlertModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <Text style={modalStyles.title}>{title}</Text>
                    <Text style={modalStyles.message}>{message}</Text>
                    <View style={modalStyles.buttonRow}>
                        <Pressable style={modalStyles.confirmButton} onPress={onClose}>
                            <Text style={modalStyles.confirmText}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: Colors.light.backgroundAlt,
        borderRadius: 16,
        padding: 24,
        maxWidth: 340,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        minWidth: 80,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        color: Colors.light.text,
    },
    confirmButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        backgroundColor: Colors.light.primary,
        minWidth: 80,
    },
    confirmText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        color: '#fff',
    },
    destructiveButton: {
        backgroundColor: Colors.light.error,
    },
    destructiveText: {
        color: '#fff',
    },
});

export default function ApprovalScreen() {
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
        confirmStyle?: 'default' | 'destructive';
        onConfirm: () => void;
    } | null>(null);
    const [alertModal, setAlertModal] = useState<{
        visible: boolean;
        title: string;
        message: string;
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
        confirmStyle?: 'default' | 'destructive';
        onConfirm: () => void;
    }) => {
        setConfirmModal({
            visible: true,
            ...config,
        });
    };

    const showAlert = (title: string, message: string, onClose?: () => void) => {
        setAlertModal({ visible: true, title, message, onClose });
    };

    const handleApproveSlot = (slot: Slot) => {
        showConfirm({
            title: 'Approve This Slot',
            message: `Are you sure you want to approve "${formatDateTime(slot.start_time)}"? This will confirm this time slot for the match.`,
            confirmText: 'Approve',
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

                    showAlert('Approved!', `The slot "${formatDateTime(slot.start_time)}" has been approved.`);
                } catch (e: any) {
                    console.error(e);
                    showAlert('Error', 'Failed to approve slot: ' + e.message);
                } finally {
                    setProcessing(null);
                }
            },
        });
    };

    const handleRejectSlot = (slot: Slot) => {
        showConfirm({
            title: 'Reject This Slot',
            message: `Are you sure you want to reject "${formatDateTime(slot.start_time)}"? This time slot will not be available for booking.`,
            confirmText: 'Reject',
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

                    showAlert('Rejected', `The slot "${formatDateTime(slot.start_time)}" has been rejected.`);
                } catch (e: any) {
                    console.error(e);
                    showAlert('Error', 'Failed to reject slot: ' + e.message);
                } finally {
                    setProcessing(null);
                }
            },
        });
    };

    const handleApproveAll = () => {
        const pendingSlots = slots.filter(s => slotStatuses[s.id] === 'PENDING');
        if (pendingSlots.length === 0) {
            showAlert('No Pending Slots', 'All slots have already been processed.');
            return;
        }

        showConfirm({
            title: 'Approve All Slots',
            message: `This will approve all ${pendingSlots.length} pending slot(s). Continue?`,
            confirmText: 'Approve All',
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

                    showAlert('All Approved!', `All ${pendingSlots.length} slot(s) have been approved. The match offer is now ready to share.`,
                        async () => {
                            if (shareLink) {
                                await Clipboard.setStringAsync(shareLink);
                                showAlert('Link Copied!', 'Share link copied to clipboard.');
                            }
                        }
                    );
                } catch (e: any) {
                    console.error(e);
                    showAlert('Error', 'Failed to approve slots: ' + e.message);
                } finally {
                    setProcessing(null);
                }
            },
        });
    };

    const handleRejectAll = () => {
        const pendingSlots = slots.filter(s => slotStatuses[s.id] === 'PENDING');
        if (pendingSlots.length === 0) {
            showAlert('No Pending Slots', 'All slots have already been processed.');
            return;
        }

        showConfirm({
            title: 'Reject All Slots',
            message: `This will reject all ${pendingSlots.length} pending slot(s) and cancel the match offer. Continue?`,
            confirmText: 'Reject All',
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

                    showAlert('All Rejected', 'All slots have been rejected. The match offer has been cancelled.',
                        () => router.push('/')
                    );
                } catch (e: any) {
                    console.error(e);
                    showAlert('Error', 'Failed to reject slots: ' + e.message);
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

    const getSlotStatusColor = (slotId: string) => {
        const status = slotStatuses[slotId];
        if (status === 'APPROVED') return Colors.light.success;
        if (status === 'REJECTED') return Colors.light.error;
        return Colors.light.primary;
    };

    const getSlotStatusIcon = (slotId: string) => {
        const status = slotStatuses[slotId];
        if (status === 'APPROVED') return 'checkmark-circle';
        if (status === 'REJECTED') return 'close-circle';
        return 'time-outline';
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
        );
    }

    if (!approval || !offer) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
                <Text style={styles.errorTitle}>Not Found</Text>
                <Text style={styles.errorSubtitle}>This approval request does not exist or has expired.</Text>
            </View>
        );
    }

    const pendingCount = slots.filter(s => slotStatuses[s.id] === 'PENDING').length;
    const approvedCount = slots.filter(s => slotStatuses[s.id] === 'APPROVED').length;
    const rejectedCount = slots.filter(s => slotStatuses[s.id] === 'REJECTED').length;

    return (
        <>
            <Stack.Screen options={{
                title: 'Approve Match Slots',
                headerTitleStyle: { fontWeight: '700', fontSize: 18, color: Colors.light.text },
                headerShadowVisible: false,
                headerStyle: { backgroundColor: Colors.light.background },
                headerTintColor: Colors.light.text,
            }} />

            <AppBanner deepLink={`matchslot://approve/${token}`} />

            {/* Confirmation Modal */}
            {confirmModal && (
                <ConfirmModal
                    visible={confirmModal.visible}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmText={confirmModal.confirmText}
                    confirmStyle={confirmModal.confirmStyle}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                />
            )}

            {/* Alert Modal */}
            {alertModal && (
                <AlertModal
                    visible={alertModal.visible}
                    title={alertModal.title}
                    message={alertModal.message}
                    onClose={() => {
                        const onCloseCallback = alertModal.onClose;
                        setAlertModal(null);
                        if (onCloseCallback) onCloseCallback();
                    }}
                />
            )}

            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <Card style={styles.headerCard}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="shield-checkmark" size={40} color={Colors.light.primary} />
                        </View>
                        <Text style={styles.headerTitle}>Match Slot Approval</Text>
                        <Text style={styles.headerSubtitle}>
                            Review and approve or reject each time slot individually.
                            You can also use the bulk actions at the bottom.
                        </Text>
                    </Card>

                    {/* Status Summary */}
                    <View style={styles.statusSummary}>
                        <View style={styles.statusBadge}>
                            <Text style={[styles.statusCount, { color: Colors.light.primary }]}>{pendingCount}</Text>
                            <Text style={styles.statusLabel}>Pending</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={[styles.statusCount, { color: Colors.light.success }]}>{approvedCount}</Text>
                            <Text style={styles.statusLabel}>Approved</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={[styles.statusCount, { color: Colors.light.error }]}>{rejectedCount}</Text>
                            <Text style={styles.statusLabel}>Rejected</Text>
                        </View>
                    </View>

                    {/* Host Details */}
                    <Text style={styles.sectionTitle}>Host Coach</Text>
                    <Card style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Ionicons name="person" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Name</Text>
                                <Text style={styles.detailValue}>
                                    {offer.host_name}
                                    {offer.host_club && ` (${offer.host_club})`}
                                </Text>
                            </View>
                        </View>
                    </Card>

                    {/* Match Details */}
                    <Text style={styles.sectionTitle}>Match Details</Text>
                    <Card style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Ionicons name="football" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Match Type</Text>
                                <Text style={styles.detailValue}>
                                    {offer.age_group} • {offer.format}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="location" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Location</Text>
                                <Text style={styles.detailValue}>{offer.location}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <Ionicons name="timer" size={24} color={Colors.light.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailLabel}>Duration</Text>
                                <Text style={styles.detailValue}>{offer.duration} minutes</Text>
                            </View>
                        </View>
                    </Card>

                    {/* Time Slots with Individual Approve/Reject Buttons */}
                    <Text style={styles.sectionTitle}>Time Slots</Text>
                    {slots.map((slot) => {
                        const status = slotStatuses[slot.id];
                        const isProcessing = processing === slot.id || processing === 'all';

                        return (
                            <Card key={slot.id} style={[
                                styles.slotCard,
                                status === 'APPROVED' && styles.slotApproved,
                                status === 'REJECTED' && styles.slotRejected,
                            ]}>
                                <View style={styles.slotHeader}>
                                    <Ionicons
                                        name={getSlotStatusIcon(slot.id) as any}
                                        size={24}
                                        color={getSlotStatusColor(slot.id)}
                                    />
                                    <View style={styles.slotInfo}>
                                        <Text style={styles.slotText}>{formatDateTime(slot.start_time)}</Text>
                                        <Text style={[styles.slotStatus, { color: getSlotStatusColor(slot.id) }]}>
                                            {status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Pending'}
                                        </Text>
                                    </View>
                                </View>

                                {status === 'PENDING' && (
                                    <View style={styles.slotActions}>
                                        {isProcessing ? (
                                            <ActivityIndicator size="small" color={Colors.light.primary} />
                                        ) : (
                                            <>
                                                <Pressable
                                                    style={styles.rejectSlotButton}
                                                    onPress={() => handleRejectSlot(slot)}
                                                >
                                                    <Ionicons name="close" size={18} color="#fff" />
                                                    <Text style={styles.slotButtonText}>Deny</Text>
                                                </Pressable>
                                                <Pressable
                                                    style={styles.approveSlotButton}
                                                    onPress={() => handleApproveSlot(slot)}
                                                >
                                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                                    <Text style={styles.slotButtonText}>Approve</Text>
                                                </Pressable>
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
                            title="Reject All"
                            onPress={handleRejectAll}
                            loading={processing === 'all'}
                            style={styles.rejectButton}
                        />
                        <Button
                            title="Approve All"
                            onPress={handleApproveAll}
                            loading={processing === 'all'}
                            style={styles.approveButton}
                        />
                    </View>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.light.text,
        marginTop: 16,
        textAlign: 'center',
    },
    errorSubtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    headerCard: {
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: Colors.light.secondary,
        borderColor: Colors.light.primary,
        borderWidth: 1,
    },
    headerIcon: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    statusSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        paddingVertical: 16,
        backgroundColor: Colors.light.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    statusBadge: {
        alignItems: 'center',
    },
    statusCount: {
        fontSize: 24,
        fontWeight: '700',
    },
    statusLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
        marginTop: 8,
        marginBottom: 12,
    },
    detailsCard: {
        padding: 16,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginBottom: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '500',
    },
    slotCard: {
        padding: 16,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    slotApproved: {
        borderColor: Colors.light.success,
        backgroundColor: 'rgba(16,185,129,0.08)',
    },
    slotRejected: {
        borderColor: Colors.light.error,
        backgroundColor: 'rgba(248,113,113,0.08)',
    },
    slotHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    slotInfo: {
        flex: 1,
    },
    slotText: {
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '600',
    },
    slotStatus: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    slotActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    approveSlotButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.light.success,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    rejectSlotButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.light.error,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    slotButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        backgroundColor: Colors.light.background,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: Colors.light.error,
    },
    approveButton: {
        flex: 1,
        backgroundColor: Colors.light.success,
    },
});
