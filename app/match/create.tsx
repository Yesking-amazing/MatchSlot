import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { generateApprovalLink } from '@/lib/shareLink';
import { saveMyMatchId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { AgeGroup, MatchFormat } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as MailComposer from 'expo-mail-composer';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Helper for the selection rows
function SelectionRow({ icon, label, rightElement, onPress }: any) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <View style={styles.selectionRow}>
                <View style={styles.selectionLeft}>
                    <Ionicons name={icon} size={24} color={Colors.light.text} style={styles.selectionIcon} />
                    <Text style={styles.selectionLabel}>{label}</Text>
                </View>
                {rightElement}
            </View>
        </TouchableOpacity>
    );
}

interface TimeSlot {
    id: string;
    date: Date;
    startTime: Date;
    endTime: Date;
}

export default function CreateMatchScreen() {
    const { user } = useAuth();

    // Host Info - pre-filled from logged-in user
    const [hostName, setHostName] = useState('');
    const [hostClub, setHostClub] = useState('');
    const [hostContact, setHostContact] = useState('');

    // Match Details
    const [ageGroup, setAgeGroup] = useState<AgeGroup>('U12');
    const [format, setFormat] = useState<MatchFormat>('11v11');
    const [duration, setDuration] = useState(90); // minutes
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [approverEmail, setApproverEmail] = useState('');

    // Time Slots
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

    // Modals
    const [showAgeGroupPicker, setShowAgeGroupPicker] = useState(false);
    const [showFormatPicker, setShowFormatPicker] = useState(false);
    const [showDurationPicker, setShowDurationPicker] = useState(false);
    const [showDateTimePicker, setShowDateTimePicker] = useState(false);
    const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
    const [tempDate, setTempDate] = useState(new Date());
    const [tempStartTime, setTempStartTime] = useState(new Date());
    const [tempEndTime, setTempEndTime] = useState(new Date());
    const [dateTimePickerMode, setDateTimePickerMode] = useState<'date' | 'start' | 'end'>('date');

    const [loading, setLoading] = useState(false);

    const ageGroups: AgeGroup[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Open'];
    const formats: MatchFormat[] = ['5v5', '7v7', '9v9', '11v11'];
    const durations = [60, 70, 80, 90, 100, 120];

    // Pre-fill user info from logged-in user
    useEffect(() => {
        if (user) {
            // Set email from authenticated user
            setHostContact(user.email || '');
            // Set name from user metadata if available
            const metadata = user.user_metadata;
            if (metadata?.name) {
                setHostName(metadata.name);
            }
        }
    }, [user]);

    // Add new time slot
    const addTimeSlot = () => {
        const now = new Date();
        const start = new Date(now);
        start.setHours(10, 0, 0, 0);
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + duration);

        setTempDate(now);
        setTempStartTime(start);
        setTempEndTime(end);
        setEditingSlotId(null);
        setDateTimePickerMode('date');
        setShowDateTimePicker(true);
    };

    const saveTimeSlot = () => {
        const newSlot: TimeSlot = {
            id: editingSlotId || Date.now().toString(),
            date: tempDate,
            startTime: tempStartTime,
            endTime: tempEndTime,
        };

        if (editingSlotId) {
            setTimeSlots(prev => prev.map(slot => slot.id === editingSlotId ? newSlot : slot));
        } else {
            setTimeSlots(prev => [...prev, newSlot]);
        }

        setShowDateTimePicker(false);
        setEditingSlotId(null);
    };

    const removeTimeSlot = (id: string) => {
        setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    };

    const handleCreate = async () => {
        // Validation
        if (!hostName.trim()) {
            Alert.alert('Required', 'Please enter your name');
            return;
        }
        if (!location.trim()) {
            Alert.alert('Required', 'Please enter a location');
            return;
        }
        if (timeSlots.length === 0) {
            Alert.alert('Required', 'Please add at least one time slot');
            return;
        }
        if (!approverEmail.trim()) {
            Alert.alert('Required', 'Please enter an approver email');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(approverEmail)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            // Generate unique share token
            const shareToken = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

            // 1. Create Match Offer
            const { data: offerData, error: offerError } = await supabase
                .from('match_offers')
                .insert({
                    host_name: hostName,
                    host_club: hostClub || null,
                    host_contact: hostContact || null,
                    age_group: ageGroup,
                    format: format,
                    duration: duration,
                    location: location,
                    notes: notes || null,
                    share_token: shareToken,
                    approver_email: approverEmail,
                    status: 'PENDING_APPROVAL',
                })
                .select()
                .single();

            if (offerError) throw offerError;

            // 2. Create Time Slots
            if (offerData) {
                // Save locally to "My Matches"
                await saveMyMatchId(offerData.id);

                const slotsToInsert = timeSlots.map(slot => {
                    // Combine date with start/end times
                    const startDateTime = new Date(slot.date);
                    startDateTime.setHours(slot.startTime.getHours(), slot.startTime.getMinutes(), 0, 0);

                    const endDateTime = new Date(slot.date);
                    endDateTime.setHours(slot.endTime.getHours(), slot.endTime.getMinutes(), 0, 0);

                    return {
                        match_offer_id: offerData.id,
                        start_time: startDateTime.toISOString(),
                        end_time: endDateTime.toISOString(),
                        status: 'OPEN',
                    };
                });

                const { error: slotsError } = await supabase.from('slots').insert(slotsToInsert);
                if (slotsError) throw slotsError;

                // 3. Create Approval Request for the offer itself
                const approvalToken = `offer-approval-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                const { error: approvalError } = await supabase
                    .from('approvals')
                    .insert({
                        slot_id: null, // No slot yet - this is for the offer
                        match_offer_id: offerData.id,
                        approval_token: approvalToken,
                        approver_email: approverEmail,
                        status: 'PENDING',
                    });

                if (approvalError) throw approvalError;

                // 4. Send email to approver
                const approvalLink = generateApprovalLink(approvalToken);
                const isAvailable = await MailComposer.isAvailableAsync();

                const slotsText = timeSlots.map(slot => {
                    const dateStr = slot.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
                    const startStr = slot.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    return `- ${dateStr} at ${startStr}`;
                }).join('\n');

                if (isAvailable) {
                    await MailComposer.composeAsync({
                        recipients: [approverEmail],
                        subject: `Match Offer Approval Required - ${ageGroup} ${format}`,
                        body: `Hello,\n\n${hostName}${hostClub ? ` (${hostClub})` : ''} has created a match offer that requires your approval before it can be shared with other coaches.\n\nMatch Details:\n- Age Group: ${ageGroup}\n- Format: ${format}\n- Duration: ${duration} minutes\n- Location: ${location}\n\nAvailable Time Slots:\n${slotsText}\n\nPlease review and approve this offer:\n${approvalLink}\n\nOnce approved, the host can share the link with other coaches.\n\nThanks,\nMatchSlot App`,
                    });
                }
            }

            Alert.alert(
                'Approval Required',
                'Your match offer has been created! An approval request has been sent to your approver. The share link will be available once approved.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (e: any) {
            console.error('Create match error:', e);
            console.error('Error details:', JSON.stringify(e, null, 2));
            Alert.alert(
                'Error Creating Match',
                e.message || 'Unknown error occurred. Check your database connection.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
    };

    const formatTimeSlot = (slot: TimeSlot) => {
        const dateStr = slot.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const startStr = slot.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const endStr = slot.endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} • ${startStr} - ${endStr}`;
    };

    return (
        <>
            <Stack.Screen options={{
                title: 'Create Match Offer',
                headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                headerBackTitleVisible: false,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: Colors.light.background }
            }} />

            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    {/* Host Information */}
                    <Text style={styles.sectionHeader}>Your Details</Text>
                    <Input
                        placeholder="Your Name *"
                        value={hostName}
                        onChangeText={setHostName}
                    />
                    <Input
                        placeholder="Your Club"
                        value={hostClub}
                        onChangeText={setHostClub}
                    />
                    <Input
                        placeholder="Contact (Email/Phone)"
                        value={hostContact}
                        onChangeText={setHostContact}
                    />

                    {/* Match Details */}
                    <Text style={styles.sectionHeader}>Match Details</Text>
                    <View style={styles.section}>
                        {/* Age Group */}
                        <Card style={styles.rowCard}>
                            <SelectionRow
                                icon="people-outline"
                                label={`Age Group: ${ageGroup}`}
                                rightElement={
                                    <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                                }
                                onPress={() => setShowAgeGroupPicker(true)}
                            />
                        </Card>

                        {/* Format */}
                        <Card style={styles.rowCard}>
                            <SelectionRow
                                icon="football-outline"
                                label={`Format: ${format}`}
                                rightElement={
                                    <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                                }
                                onPress={() => setShowFormatPicker(true)}
                            />
                        </Card>

                        {/* Duration */}
                        <Card style={styles.rowCard}>
                            <SelectionRow
                                icon="timer-outline"
                                label={`Duration: ${duration} minutes`}
                                rightElement={
                                    <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
                                }
                                onPress={() => setShowDurationPicker(true)}
                            />
                        </Card>

                        <Input
                            placeholder="Location *"
                            value={location}
                            onChangeText={setLocation}
                        />

                        {/* Approver Email */}
                        <Input
                            placeholder="Approver Email *"
                            value={approverEmail}
                            onChangeText={setApproverEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        {/* Notes */}
                        <Input
                            placeholder="Additional Notes (optional)"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />
                    </View>

                    {/* Time Slots */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionHeader}>Available Time Slots *</Text>
                        <TouchableOpacity onPress={addTimeSlot}>
                            <Ionicons name="add-circle" size={28} color={Colors.light.primary} />
                        </TouchableOpacity>
                    </View>

                    {timeSlots.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No time slots added yet</Text>
                            <Text style={styles.emptySubtext}>Tap the + button to add a time slot</Text>
                        </Card>
                    ) : (
                        timeSlots.map(slot => (
                            <Card key={slot.id} style={styles.slotCard}>
                                <View style={styles.slotContent}>
                                    <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
                                    <Text style={styles.slotText}>{formatTimeSlot(slot)}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeTimeSlot(slot.id)}>
                                    <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
                                </TouchableOpacity>
                            </Card>
                        ))
                    )}

                </ScrollView>

                <View style={styles.footer}>
                    <Button title="Create Match Offer" onPress={handleCreate} loading={loading} />
                </View>
            </View>

            {/* Age Group Picker Modal */}
            <Modal visible={showAgeGroupPicker} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAgeGroupPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Age Group</Text>
                        {ageGroups.map(ag => (
                            <TouchableOpacity
                                key={ag}
                                style={styles.modalOption}
                                onPress={() => {
                                    setAgeGroup(ag);
                                    setShowAgeGroupPicker(false);
                                }}
                            >
                                <Text style={[styles.modalOptionText, ageGroup === ag && styles.modalOptionTextSelected]}>
                                    {ag}
                                </Text>
                                {ageGroup === ag && <Ionicons name="checkmark" size={24} color={Colors.light.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Format Picker Modal */}
            <Modal visible={showFormatPicker} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFormatPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Format</Text>
                        {formats.map(f => (
                            <TouchableOpacity
                                key={f}
                                style={styles.modalOption}
                                onPress={() => {
                                    setFormat(f);
                                    setShowFormatPicker(false);
                                }}
                            >
                                <Text style={[styles.modalOptionText, format === f && styles.modalOptionTextSelected]}>
                                    {f}
                                </Text>
                                {format === f && <Ionicons name="checkmark" size={24} color={Colors.light.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Duration Picker Modal */}
            <Modal visible={showDurationPicker} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDurationPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Duration</Text>
                        {durations.map(d => (
                            <TouchableOpacity
                                key={d}
                                style={styles.modalOption}
                                onPress={() => {
                                    setDuration(d);
                                    setShowDurationPicker(false);
                                }}
                            >
                                <Text style={[styles.modalOptionText, duration === d && styles.modalOptionTextSelected]}>
                                    {d} minutes
                                </Text>
                                {duration === d && <Ionicons name="checkmark" size={24} color={Colors.light.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Date/Time Picker Modal */}
            <Modal visible={showDateTimePicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.dateTimeModalContent}>
                        <View style={styles.dateTimeModalHeader}>
                            <Text style={styles.modalTitle}>Add Time Slot</Text>
                            <TouchableOpacity onPress={() => setShowDateTimePicker(false)}>
                                <Ionicons name="close" size={28} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.dateTimeScrollView} showsVerticalScrollIndicator={false}>
                            {/* Preview Card */}
                            <Card style={styles.previewCard}>
                                <Text style={styles.previewLabel}>Your Time Slot</Text>
                                <Text style={styles.previewDate}>
                                    {tempDate.toLocaleDateString('en-GB', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </Text>
                                <Text style={styles.previewTime}>
                                    {tempStartTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                    {' - '}
                                    {tempEndTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <View style={styles.previewDurationRow}>
                                    <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
                                    <Text style={styles.previewDuration}>
                                        {duration} minutes
                                    </Text>
                                </View>
                            </Card>

                            {/* Date Picker */}
                            <View style={styles.dateTimeSection}>
                                <Text style={styles.dateTimeLabel}>📅 Select Date</Text>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) setTempDate(selectedDate);
                                    }}
                                    minimumDate={new Date()}
                                />
                            </View>

                            {/* Start Time Picker */}
                            <View style={styles.dateTimeSection}>
                                <Text style={styles.dateTimeLabel}>🕐 Select Start Time</Text>
                                <Text style={styles.dateTimeHint}>
                                    End time will be {duration} minutes after start time
                                </Text>
                                <DateTimePicker
                                    value={tempStartTime}
                                    mode="time"
                                    display="spinner"
                                    onChange={(event, selectedTime) => {
                                        if (selectedTime) {
                                            setTempStartTime(selectedTime);
                                            // Auto-calculate end time
                                            const end = new Date(selectedTime);
                                            end.setMinutes(end.getMinutes() + duration);
                                            setTempEndTime(end);
                                        }
                                    }}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.dateTimeModalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => setShowDateTimePicker(false)}
                            >
                                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary]}
                                onPress={saveTimeSlot}
                            >
                                <Text style={styles.modalButtonTextPrimary}>Add Slot</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 16,
        gap: 12,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 12,
        color: Colors.light.text,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 12,
    },
    rowCard: {
        marginBottom: 0,
        padding: 0,
        justifyContent: 'center',
    },
    selectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        minHeight: 60,
    },
    selectionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectionIcon: {
        color: Colors.light.text,
    },
    selectionLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.light.text,
    },

    // Time Slots
    slotCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginBottom: 12,
    },
    slotContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    slotText: {
        fontSize: 15,
        color: Colors.light.text,
    },
    emptyCard: {
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.light.textSecondary,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: Colors.light.text,
    },
    // Date/Time Modal Styles
    dateTimeModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        height: '80%',
    },
    dateTimeModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    dateTimeScrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    dateTimeModalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        backgroundColor: '#fff',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    modalOptionText: {
        fontSize: 17,
        color: Colors.light.text,
    },
    modalOptionTextSelected: {
        color: Colors.light.primary,
        fontWeight: '600',
    },
    dateTimeSection: {
        marginBottom: 24,
        marginTop: 16,
    },
    dateTimeLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: Colors.light.text,
        textAlign: 'center',
    },
    dateTimeHint: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    previewCard: {
        padding: 16,
        marginTop: 16,
        marginBottom: 8,
        backgroundColor: '#F0F9FF',
        borderColor: Colors.light.primary,
        borderWidth: 1,
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 12,
        color: Colors.light.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    previewDate: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 4,
    },
    previewTime: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.primary,
        marginBottom: 8,
    },
    previewDurationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    previewDuration: {
        fontSize: 13,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonPrimary: {
        backgroundColor: Colors.light.primary,
    },
    modalButtonSecondary: {
        backgroundColor: Colors.light.background,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    modalButtonTextPrimary: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonTextSecondary: {
        color: Colors.light.text,
        fontSize: 16,
        fontWeight: '600',
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: Colors.light.background,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
});
