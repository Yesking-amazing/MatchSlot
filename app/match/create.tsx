import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { generateApprovalLink } from '@/lib/shareLink';
import { getClubName, saveClubName, saveMyMatchId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { AgeGroup, MatchFormat } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as MailComposer from 'expo-mail-composer';
import { Stack, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Helper for the selection rows
function SelectionRow({ icon, label, rightElement, onPress }: any) {
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <View style={styles.selectionRow}>
                <View style={styles.selectionLeft}>
                    <Ionicons name={icon} size={24} color={Colors[colorScheme].text} style={styles.selectionIcon} />
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
    const colorScheme = useColorScheme() ?? 'light';
    const styles = getStyles(colorScheme);
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

    const ageGroups: AgeGroup[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Seniors', '1st Team', 'Reserve', 'Open'];
    const formats: MatchFormat[] = ['5v5', '7v7', '9v9', '11v11'];
    const durations = [60, 70, 80, 90, 100, 120];

    // Pre-fill user info from logged-in user and saved club name
    useEffect(() => {
        if (user) {
            setHostContact(user.email || '');
            const metadata = user.user_metadata;
            if (metadata?.name) {
                setHostName(metadata.name);
            }
        }
        // Load saved club name
        if (user) {
            getClubName(user.id).then(saved => {
                if (saved) setHostClub(saved);
            });
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
            // Save club name for future use
            if (hostClub.trim() && user) {
                await saveClubName(user.id, hostClub.trim());
            }

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
                await saveMyMatchId(user!.id, offerData.id);

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
                        status: 'PENDING_APPROVAL',
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
                headerBackTitle: 'Back',
                headerTitleStyle: { fontWeight: '700', fontSize: 18, color: Colors[colorScheme].text },
                headerShadowVisible: false,
                headerStyle: { backgroundColor: Colors[colorScheme].background },
                headerTintColor: Colors[colorScheme].text,
            }} />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

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
                                    <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme].textSecondary} />
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
                                    <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme].textSecondary} />
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
                                    <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme].textSecondary} />
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
                            <Ionicons name="add-circle" size={28} color={Colors[colorScheme].primary} />
                        </TouchableOpacity>
                    </View>

                    {timeSlots.length === 0 ? (
                        <View style={styles.emptyBoard}>
                            <View style={styles.emptyBoardInner}>
                                <View style={styles.emptyBoardLine} />
                                <View style={styles.emptyBoardLine} />
                                <View style={styles.emptyBoardLine} />
                            </View>
                            <Text style={styles.emptyText}>No time slots pinned</Text>
                            <Text style={styles.emptySubtext}>Tap + to pin a slot to the board</Text>
                        </View>
                    ) : (
                        timeSlots.map((slot, index) => (
                            <View key={slot.id} style={styles.slotPin}>
                                <View style={styles.slotPinDot} />
                                <View style={styles.slotPinContent}>
                                    <Text style={styles.slotPinNumber}>#{index + 1}</Text>
                                    <Text style={styles.slotPinText}>{formatTimeSlot(slot)}</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeTimeSlot(slot.id)} style={styles.slotPinDelete}>
                                    <Ionicons name="close-circle" size={22} color={Colors[colorScheme].error} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}

                </ScrollView>

                <View style={styles.footer}>
                    <Button title="Create Match Offer" onPress={handleCreate} loading={loading} />
                </View>
            </KeyboardAvoidingView>

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
                                {ageGroup === ag && <Ionicons name="checkmark" size={24} color={Colors[colorScheme].primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Format Picker Modal — Tactical Board */}
            <Modal visible={showFormatPicker} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFormatPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Format</Text>
                        <Text style={styles.tacticalSubtitle}>Choose your pitch size</Text>
                        <View style={styles.tacticalGrid}>
                            {formats.map(f => {
                                const isSelected = format === f;
                                const playerCount = parseInt(f.split('v')[0]);
                                return (
                                    <TouchableOpacity
                                        key={f}
                                        style={[styles.tacticalCard, isSelected && styles.tacticalCardSelected]}
                                        onPress={() => {
                                            setFormat(f);
                                            setShowFormatPicker(false);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        {/* Mini Pitch */}
                                        <View style={[styles.miniPitch, isSelected && styles.miniPitchSelected]}>
                                            {/* Center line */}
                                            <View style={styles.pitchCenterLine} />
                                            {/* Center circle */}
                                            <View style={styles.pitchCenterCircle} />
                                            {/* Player dots - left side */}
                                            {Array.from({ length: Math.min(playerCount, 6) }).map((_, i) => (
                                                <View
                                                    key={`l${i}`}
                                                    style={[
                                                        styles.playerDot,
                                                        styles.playerDotHome,
                                                        {
                                                            top: `${15 + (i * (70 / Math.min(playerCount, 6)))}%`,
                                                            left: `${15 + (i % 2) * 15}%`,
                                                        },
                                                    ]}
                                                />
                                            ))}
                                            {/* Player dots - right side */}
                                            {Array.from({ length: Math.min(playerCount, 6) }).map((_, i) => (
                                                <View
                                                    key={`r${i}`}
                                                    style={[
                                                        styles.playerDot,
                                                        styles.playerDotAway,
                                                        {
                                                            top: `${15 + (i * (70 / Math.min(playerCount, 6)))}%`,
                                                            right: `${15 + (i % 2) * 15}%`,
                                                        },
                                                    ]}
                                                />
                                            ))}
                                        </View>
                                        <Text style={[styles.tacticalLabel, isSelected && styles.tacticalLabelSelected]}>
                                            {f}
                                        </Text>
                                        {isSelected && (
                                            <View style={styles.tacticalCheck}>
                                                <Ionicons name="checkmark-circle" size={18} color={Colors[colorScheme].primary} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
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
                                {duration === d && <Ionicons name="checkmark" size={24} color={Colors[colorScheme].primary} />}
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
                                <Ionicons name="close" size={28} color={Colors[colorScheme].text} />
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
                                    <Ionicons name="time-outline" size={16} color={Colors[colorScheme].textSecondary} />
                                    <Text style={styles.previewDuration}>
                                        {duration} minutes
                                    </Text>
                                </View>
                            </Card>

                            {/* Date Picker */}
                            <View style={styles.dateTimeSection}>
                                <Text style={styles.dateTimeLabel}>📅 Select Date</Text>
                                {Platform.OS === 'web' ? (
                                    <TextInput
                                        style={styles.webDateInput}
                                        value={tempDate.toISOString().split('T')[0]}
                                        onChangeText={(text) => {
                                            const newDate = new Date(text);
                                            if (!isNaN(newDate.getTime())) {
                                                setTempDate(newDate);
                                            }
                                        }}
                                        placeholder="YYYY-MM-DD"
                                    />
                                ) : (
                                    <DateTimePicker
                                        value={tempDate}
                                        mode="date"
                                        display="spinner"
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) setTempDate(selectedDate);
                                        }}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>

                            {/* Start Time Picker */}
                            <View style={styles.dateTimeSection}>
                                <Text style={styles.dateTimeLabel}>🕐 Select Start Time</Text>
                                <Text style={styles.dateTimeHint}>
                                    End time will be {duration} minutes after start time
                                </Text>
                                {Platform.OS === 'web' ? (
                                    <TextInput
                                        style={styles.webDateInput}
                                        value={`${tempStartTime.getHours().toString().padStart(2, '0')}:${tempStartTime.getMinutes().toString().padStart(2, '0')}`}
                                        onChangeText={(text) => {
                                            const parts = text.split(':');
                                            if (parts.length === 2) {
                                                const hours = parseInt(parts[0]);
                                                const minutes = parseInt(parts[1]);
                                                if (!isNaN(hours) && !isNaN(minutes)) {
                                                    const newTime = new Date(tempStartTime);
                                                    newTime.setHours(hours, minutes, 0, 0);
                                                    setTempStartTime(newTime);
                                                    // Auto-calculate end time
                                                    const end = new Date(newTime);
                                                    end.setMinutes(end.getMinutes() + duration);
                                                    setTempEndTime(end);
                                                }
                                            }
                                        }}
                                        placeholder="HH:MM"
                                    />
                                ) : (
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
                                )}
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

const getStyles = (colorScheme: 'light' | 'dark') => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors[colorScheme].background,
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
        color: Colors[colorScheme].text,
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
        color: Colors[colorScheme].text,
    },
    selectionLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors[colorScheme].text,
    },

    // Tactical Board — Format Picker
    tacticalSubtitle: {
        fontSize: 13,
        color: Colors[colorScheme].textSecondary,
        textAlign: 'center',
        marginBottom: 16,
        marginTop: 4,
    },
    tacticalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
        paddingVertical: 8,
    },
    tacticalCard: {
        width: '45%',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        backgroundColor: Colors[colorScheme].card,
        borderWidth: 2,
        borderColor: Colors[colorScheme].border,
    },
    tacticalCardSelected: {
        borderColor: Colors[colorScheme].primary,
        backgroundColor: Colors[colorScheme].primaryLight,
    },
    miniPitch: {
        width: '100%',
        height: 80,
        borderRadius: 8,
        backgroundColor: colorScheme === 'dark' ? '#1A3A24' : '#2D8B4E',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden',
        marginBottom: 8,
    },
    miniPitchSelected: {
        backgroundColor: colorScheme === 'dark' ? '#1E4D2E' : '#1B8B4E',
    },
    pitchCenterLine: {
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    pitchCenterCircle: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
        marginLeft: -10,
        marginTop: -10,
    },
    playerDot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    playerDotHome: {
        backgroundColor: '#FFFFFF',
    },
    playerDotAway: {
        backgroundColor: '#FCD34D',
    },
    tacticalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors[colorScheme].text,
    },
    tacticalLabelSelected: {
        color: Colors[colorScheme].primary,
    },
    tacticalCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
    },

    // Whiteboard Time Slots
    slotPin: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors[colorScheme].card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: Colors[colorScheme].primary,
        shadowColor: Colors[colorScheme].shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 2,
    },
    slotPinDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors[colorScheme].primary,
        marginRight: 12,
    },
    slotPinContent: {
        flex: 1,
    },
    slotPinNumber: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors[colorScheme].textTertiary,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    slotPinText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors[colorScheme].text,
    },
    slotPinDelete: {
        padding: 4,
    },

    // Empty board state
    emptyBoard: {
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        backgroundColor: colorScheme === 'dark' ? 'rgba(74,222,128,0.04)' : 'rgba(27,139,78,0.03)',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: Colors[colorScheme].border,
    },
    emptyBoardInner: {
        width: 60,
        gap: 6,
        marginBottom: 12,
    },
    emptyBoardLine: {
        height: 3,
        borderRadius: 2,
        backgroundColor: Colors[colorScheme].border,
    },
    emptyText: {
        fontSize: 16,
        color: Colors[colorScheme].textSecondary,
        fontWeight: '600',
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors[colorScheme].textTertiary,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors[colorScheme].backgroundAlt,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '70%',
        borderTopWidth: 1,
        borderTopColor: Colors[colorScheme].cardBorder,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: Colors[colorScheme].text,
    },
    // Date/Time Modal Styles
    dateTimeModalContent: {
        backgroundColor: Colors[colorScheme].backgroundAlt,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        height: '80%',
        borderTopWidth: 1,
        borderTopColor: Colors[colorScheme].cardBorder,
    },
    dateTimeModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors[colorScheme].border,
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
        borderTopColor: Colors[colorScheme].border,
        backgroundColor: Colors[colorScheme].backgroundAlt,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors[colorScheme].border,
    },
    modalOptionText: {
        fontSize: 17,
        color: Colors[colorScheme].text,
    },
    modalOptionTextSelected: {
        color: Colors[colorScheme].primary,
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
        color: Colors[colorScheme].text,
        textAlign: 'center',
    },
    dateTimeHint: {
        fontSize: 12,
        color: Colors[colorScheme].textSecondary,
        textAlign: 'center',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    previewCard: {
        padding: 16,
        marginTop: 16,
        marginBottom: 8,
        backgroundColor: Colors[colorScheme].secondary,
        borderColor: Colors[colorScheme].primary,
        borderWidth: 1,
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 12,
        color: Colors[colorScheme].textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    previewDate: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors[colorScheme].text,
        marginBottom: 4,
    },
    previewTime: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors[colorScheme].primary,
        marginBottom: 8,
    },
    previewDurationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    previewDuration: {
        fontSize: 13,
        color: Colors[colorScheme].textSecondary,
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
        borderRadius: 16,
        alignItems: 'center',
    },
    modalButtonPrimary: {
        backgroundColor: Colors[colorScheme].primary,
    },
    modalButtonSecondary: {
        backgroundColor: Colors[colorScheme].background,
        borderWidth: 1,
        borderColor: Colors[colorScheme].border,
    },
    modalButtonTextPrimary: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonTextSecondary: {
        color: Colors[colorScheme].text,
        fontSize: 16,
        fontWeight: '600',
    },
    webDateInput: {
        backgroundColor: Colors[colorScheme].background,
        borderWidth: 2,
        borderColor: Colors[colorScheme].primary,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        color: Colors[colorScheme].text,
        marginTop: 12,
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: Colors[colorScheme].background,
        borderTopWidth: 1,
        borderTopColor: Colors[colorScheme].border,
    },
});
