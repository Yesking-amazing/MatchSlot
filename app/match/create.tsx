import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { PickerGroup, PickerRow } from '@/components/ui/PickerRow';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { generateApprovalLink } from '@/lib/shareLink';
import { supabase } from '@/lib/supabase';
import { AgeGroup, MatchFormat } from '@/types/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as MailComposer from 'expo-mail-composer';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowLeft,
    Building2,
    CalendarPlus,
    Check,
    Clock,
    Mail,
    MapPin,
    Plus,
    Send,
    Trash2,
    User,
    X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TimeSlot {
    id: string;
    date: Date;
    startTime: Date;
    endTime: Date;
}

export default function CreateMatchScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
    const styles = getStyles(colorScheme);
    const { t } = useTranslation();
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

    // Pre-fill user info from logged-in user
    useEffect(() => {
        if (user) {
            setHostContact(user.email || '');
            const metadata = user.user_metadata;
            if (metadata?.name) {
                setHostName(metadata.name);
            }
            // Load club name from user metadata (syncs across devices)
            if (metadata?.club_name) {
                setHostClub(metadata.club_name);
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
            Alert.alert(t('common.required'), t('create.enterName'));
            return;
        }
        if (!location.trim()) {
            Alert.alert(t('common.required'), t('create.enterLocation'));
            return;
        }
        if (timeSlots.length === 0) {
            Alert.alert(t('common.required'), t('create.addAtLeastOneSlot'));
            return;
        }
        if (!approverEmail.trim()) {
            Alert.alert(t('common.required'), t('create.enterApproverEmail'));
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(approverEmail)) {
            Alert.alert(t('create.invalidEmail'), t('create.invalidEmail'));
            return;
        }

        setLoading(true);
        try {
            // Save club name to user metadata (syncs across devices)
            if (hostClub.trim() && user) {
                await supabase.auth.updateUser({ data: { club_name: hostClub.trim() } });
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
                    created_by: user!.id,
                })
                .select()
                .single();

            if (offerError) throw offerError;

            // 2. Create Time Slots
            if (offerData) {
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
                t('create.approvalRequired'),
                t('create.approvalSent'),
                [{ text: t('common.ok'), onPress: () => router.back() }]
            );
        } catch (e: any) {
            console.error('Create match error:', e);
            console.error('Error details:', JSON.stringify(e, null, 2));
            Alert.alert(
                t('create.createError'),
                e.message || t('create.unknownError'),
                [{ text: t('common.ok') }]
            );
        } finally {
            setLoading(false);
        }
    };

    const formatTimeSlot = (slot: TimeSlot) => {
        const dateStr = slot.date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        const startStr = slot.startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return `${dateStr} · ${startStr}`;
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.safe} edges={['top']}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable
                            onPress={() => router.back()}
                            style={({ pressed }) => [
                                styles.backCircle,
                                pressed && { backgroundColor: c.primaryTint },
                            ]}
                            hitSlop={8}
                        >
                            <ArrowLeft size={18} color={c.text} strokeWidth={2} />
                        </Pressable>
                        <Text style={styles.headerTitle}>{t('create.title')}</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                        {/* Host Information */}
                        <Text style={styles.kicker}>{t('create.yourDetails')}</Text>
                        <Input
                            placeholder={t('create.yourName')}
                            value={hostName}
                            onChangeText={setHostName}
                            icon={<User size={17} color={c.textFaint} strokeWidth={2} />}
                        />
                        <Input
                            placeholder={t('create.yourClub')}
                            value={hostClub}
                            onChangeText={setHostClub}
                            icon={<Building2 size={17} color={c.textFaint} strokeWidth={2} />}
                        />
                        <Input
                            placeholder={t('create.contact')}
                            value={hostContact}
                            onChangeText={setHostContact}
                            icon={<Mail size={17} color={c.textFaint} strokeWidth={2} />}
                        />

                        {/* Match Details */}
                        <Text style={[styles.kicker, styles.kickerSpaced]}>{t('create.matchDetails')}</Text>
                        <PickerGroup style={styles.pickerGroup}>
                            <PickerRow
                                first
                                label={t('create.ageGroup')}
                                value={ageGroup}
                                onPress={() => setShowAgeGroupPicker(true)}
                            />
                            <PickerRow
                                label={t('create.format')}
                                value={format}
                                onPress={() => setShowFormatPicker(true)}
                            />
                            <PickerRow
                                label={t('create.duration')}
                                value={`${duration} ${t('common.minutes')}`}
                                onPress={() => setShowDurationPicker(true)}
                            />
                        </PickerGroup>

                        <Input
                            placeholder={t('create.location')}
                            value={location}
                            onChangeText={setLocation}
                            icon={<MapPin size={17} color={c.textFaint} strokeWidth={2} />}
                        />

                        {/* Approver Email */}
                        <Input
                            placeholder={t('create.approverEmail')}
                            value={approverEmail}
                            onChangeText={setApproverEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            icon={<Mail size={17} color={c.textFaint} strokeWidth={2} />}
                        />

                        {/* Notes */}
                        <Input
                            placeholder={t('create.additionalNotes')}
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />

                        {/* Time Slots */}
                        <View style={styles.slotsHeaderRow}>
                            <Text style={styles.kicker}>{t('create.availableSlots')}</Text>
                            <TouchableOpacity onPress={addTimeSlot} style={styles.addAffordance} activeOpacity={0.7}>
                                <Plus size={16} color={c.primary} strokeWidth={2.4} />
                                <Text style={styles.addAffordanceText}>{t('create.addSlot')}</Text>
                            </TouchableOpacity>
                        </View>

                        {timeSlots.length === 0 ? (
                            <EmptyState
                                icon={<CalendarPlus size={24} color={c.primary} strokeWidth={2} />}
                                title={t('create.noSlots')}
                                subtitle={t('create.tapToAdd')}
                            />
                        ) : (
                            <View style={styles.slotList}>
                                {timeSlots.map((slot, index) => (
                                    <View key={slot.id} style={styles.slotRow}>
                                        <View style={styles.slotNumber}>
                                            <Text style={styles.slotNumberText}>{index + 1}</Text>
                                        </View>
                                        <Text style={styles.slotText} numberOfLines={1}>{formatTimeSlot(slot)}</Text>
                                        <TouchableOpacity onPress={() => removeTimeSlot(slot.id)} style={styles.slotDelete} hitSlop={8}>
                                            <Trash2 size={17} color={c.textFaint} strokeWidth={2} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                    </ScrollView>

                    {/* Sticky CTA over bottom fade */}
                    <View style={styles.footer} pointerEvents="box-none">
                        <LinearGradient
                            colors={[`${c.background}00`, c.background]}
                            style={styles.footerFade}
                            pointerEvents="none"
                        />
                        <View style={styles.footerInner}>
                            <Button
                                title={t('create.title')}
                                onPress={handleCreate}
                                loading={loading}
                                icon={<Send size={16} color={c.primaryInk} strokeWidth={2} />}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Age Group Picker Modal */}
            <Modal visible={showAgeGroupPicker} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAgeGroupPicker(false)}
                >
                    <View style={styles.modalSheet}>
                        <View style={styles.modalGrabber} />
                        <Text style={styles.modalTitle}>{t('create.selectAgeGroup')}</Text>
                        {ageGroups.map(ag => {
                            const selected = ageGroup === ag;
                            return (
                                <TouchableOpacity
                                    key={ag}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        setAgeGroup(ag);
                                        setShowAgeGroupPicker(false);
                                    }}
                                >
                                    <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                                        {ag}
                                    </Text>
                                    {selected && <Check size={20} color={c.primary} strokeWidth={2.4} />}
                                </TouchableOpacity>
                            );
                        })}
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
                    <View style={styles.modalSheet}>
                        <View style={styles.modalGrabber} />
                        <Text style={styles.modalTitle}>{t('create.selectFormat')}</Text>
                        {formats.map(f => {
                            const selected = format === f;
                            return (
                                <TouchableOpacity
                                    key={f}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        setFormat(f);
                                        setShowFormatPicker(false);
                                    }}
                                >
                                    <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                                        {f}
                                    </Text>
                                    {selected && <Check size={20} color={c.primary} strokeWidth={2.4} />}
                                </TouchableOpacity>
                            );
                        })}
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
                    <View style={styles.modalSheet}>
                        <View style={styles.modalGrabber} />
                        <Text style={styles.modalTitle}>{t('create.selectDuration')}</Text>
                        {durations.map(d => {
                            const selected = duration === d;
                            return (
                                <TouchableOpacity
                                    key={d}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        setDuration(d);
                                        setShowDurationPicker(false);
                                    }}
                                >
                                    <Text style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}>
                                        {d} {t('common.minutes')}
                                    </Text>
                                    {selected && <Check size={20} color={c.primary} strokeWidth={2.4} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Date/Time Picker Modal */}
            <Modal visible={showDateTimePicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.dateTimeSheet}>
                        <View style={styles.dateTimeHeader}>
                            <Text style={styles.modalTitle}>{t('create.addTimeSlot')}</Text>
                            <TouchableOpacity onPress={() => setShowDateTimePicker(false)} hitSlop={8}>
                                <X size={22} color={c.textMuted} strokeWidth={2} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.dateTimeScroll} showsVerticalScrollIndicator={false}>
                            {/* Preview Card */}
                            <Card tone="sunk" style={styles.previewCard}>
                                <Text style={styles.previewLabel}>{t('create.yourTimeSlot')}</Text>
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
                                    <Clock size={14} color={c.textMuted} strokeWidth={2} />
                                    <Text style={styles.previewDuration}>
                                        {duration} {t('common.minutes')}
                                    </Text>
                                </View>
                            </Card>

                            {/* Date Picker */}
                            <View style={styles.dateTimeSection}>
                                <Text style={styles.dateTimeLabel}>{t('create.selectDate')}</Text>
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
                                        placeholderTextColor={c.textTertiary}
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
                                <Text style={styles.dateTimeLabel}>{t('create.selectStartTime')}</Text>
                                <Text style={styles.dateTimeHint}>
                                    {t('create.endTimeHint', { minutes: duration })}
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
                                        placeholderTextColor={c.textTertiary}
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

                        <View style={styles.dateTimeFooter}>
                            <View style={styles.dateTimeFooterBtn}>
                                <Button
                                    title={t('common.cancel')}
                                    variant="secondary"
                                    onPress={() => setShowDateTimePicker(false)}
                                />
                            </View>
                            <View style={styles.dateTimeFooterBtn}>
                                <Button
                                    title={t('create.addSlot')}
                                    onPress={saveTimeSlot}
                                    icon={<Plus size={16} color={c.primaryInk} strokeWidth={2.2} />}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
    const c = Colors[colorScheme];
    return StyleSheet.create({
        safe: {
            flex: 1,
            backgroundColor: c.background,
        },
        container: {
            flex: 1,
            backgroundColor: c.background,
        },

        // Header
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 12,
        },
        backCircle: {
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
        },
        headerTitle: {
            fontFamily: Fonts.display,
            fontSize: 18,
            fontWeight: '800',
            letterSpacing: -0.4,
            color: c.text,
        },

        scrollContent: {
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 140,
        },

        // Kicker micro-label
        kicker: {
            fontFamily: Fonts.body,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: c.textMuted,
            marginBottom: 12,
        },
        kickerSpaced: {
            marginTop: 10,
        },

        pickerGroup: {
            marginBottom: 16,
        },

        // Slots header row
        slotsHeaderRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
        },
        addAffordance: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingVertical: 4,
            paddingHorizontal: 4,
            marginBottom: 12,
        },
        addAffordanceText: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '700',
            color: c.primary,
        },

        // Slot rows
        slotList: {
            gap: 10,
        },
        slotRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: c.card,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
        },
        slotNumber: {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: c.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        slotNumberText: {
            fontFamily: Fonts.display,
            fontSize: 13,
            fontWeight: '800',
            color: c.primaryInk,
        },
        slotText: {
            flex: 1,
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '700',
            color: c.text,
        },
        slotDelete: {
            padding: 2,
        },

        // Footer / sticky CTA
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
        },
        footerFade: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: -24,
            bottom: 0,
        },
        footerInner: {
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 20,
            backgroundColor: c.background,
        },

        // Modal — bottom sheet (age / format / duration)
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalSheet: {
            backgroundColor: c.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 32,
            maxHeight: '72%',
            borderTopWidth: 1,
            borderColor: c.border,
        },
        modalGrabber: {
            alignSelf: 'center',
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: c.divider,
            marginBottom: 14,
        },
        modalTitle: {
            fontFamily: Fonts.display,
            fontSize: 18,
            fontWeight: '800',
            letterSpacing: -0.4,
            color: c.text,
            marginBottom: 8,
        },
        modalOption: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: c.divider,
        },
        modalOptionText: {
            fontFamily: Fonts.body,
            fontSize: 15,
            fontWeight: '500',
            color: c.text,
        },
        modalOptionTextSelected: {
            color: c.primary,
            fontWeight: '700',
        },

        // Date/Time modal
        dateTimeSheet: {
            backgroundColor: c.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '82%',
            height: '82%',
            borderTopWidth: 1,
            borderColor: c.border,
        },
        dateTimeHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: c.divider,
        },
        dateTimeScroll: {
            flex: 1,
            paddingHorizontal: 20,
        },
        dateTimeSection: {
            marginTop: 16,
            marginBottom: 20,
        },
        dateTimeLabel: {
            fontFamily: Fonts.body,
            fontSize: 12.5,
            fontWeight: '700',
            color: c.textSecondary,
            textAlign: 'center',
            marginBottom: 10,
        },
        dateTimeHint: {
            fontFamily: Fonts.body,
            fontSize: 11.5,
            fontWeight: '500',
            color: c.textMuted,
            textAlign: 'center',
            marginBottom: 8,
        },
        dateTimeFooter: {
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 24,
            borderTopWidth: 1,
            borderTopColor: c.divider,
            backgroundColor: c.card,
        },
        dateTimeFooterBtn: {
            flex: 1,
        },

        // Preview card inside date/time modal
        previewCard: {
            marginTop: 16,
            marginBottom: 4,
            alignItems: 'center',
        },
        previewLabel: {
            fontFamily: Fonts.body,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: c.textMuted,
            marginBottom: 8,
        },
        previewDate: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '700',
            color: c.text,
            marginBottom: 4,
        },
        previewTime: {
            fontFamily: Fonts.display,
            fontSize: 26,
            fontWeight: '800',
            letterSpacing: -1,
            color: c.primary,
            marginBottom: 8,
        },
        previewDurationRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        previewDuration: {
            fontFamily: Fonts.body,
            fontSize: 12.5,
            fontWeight: '600',
            color: c.textMuted,
        },
        webDateInput: {
            backgroundColor: c.surfaceSunk,
            borderWidth: 1,
            borderColor: c.divider,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            fontFamily: Fonts.body,
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
            color: c.text,
            marginTop: 8,
        },
    });
};
