import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormationChip } from '@/components/ui/FormationChip';
import { useToast } from '@/components/ui/Toast';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AGE_GROUPS, MATCH_DURATIONS, MATCH_FORMATS } from '@/constants/AppConfig';
import { useAuth } from '@/contexts/AuthContext';
import { fmtDate, fmtTimeRange, getDayAbbr, getMonthAbbr } from '@/lib/dateUtils';
import { generateApprovalLink } from '@/lib/shareLink';
import { getClubName, saveClubName, saveMyMatchId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { AgeGroup, MatchFormat } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import { Stack, router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface WizardSlot {
    id: string;
    start: string;
}

export default function CreateMatchScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const t = Colors[colorScheme];
    const { user } = useAuth();
    const { showToast } = useToast();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [hostName, setHostName] = useState('');
    const [hostClub, setHostClub] = useState('');
    const [hostContact, setHostContact] = useState('');

    const [ageGroup, setAgeGroup] = useState<AgeGroup>('U14');
    const [format, setFormat] = useState<MatchFormat>('9v9');
    const [duration, setDuration] = useState(80);
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [approverEmail, setApproverEmail] = useState('');
    const [slots, setSlots] = useState<WizardSlot[]>([]);

    const steps = ['Details', 'Time slots', 'Review'];

    useEffect(() => {
        if (user) {
            setHostContact(user.email || '');
            if (user.user_metadata?.name) setHostName(user.user_metadata.name);
            getClubName(user.id).then(saved => { if (saved) setHostClub(saved); });
        }
    }, [user]);

    const canContinue = (() => {
        if (step === 0) return !!location.trim();
        if (step === 1) return slots.length > 0;
        if (step === 2) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(approverEmail);
        return true;
    })();

    const next = () => {
        if (step < 2) setStep(step + 1);
        else handleCreate();
    };

    const back = () => {
        if (step > 0) setStep(step - 1);
        else router.back();
    };

    const addSlot = (dateStr: string, timeStr: string) => {
        const iso = `${dateStr}T${timeStr}:00`;
        const newSlot: WizardSlot = { id: `new-${Date.now()}`, start: iso };
        setSlots(prev => [...prev, newSlot].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
        setShowPicker(false);
    };

    const removeSlot = (id: string) => {
        setSlots(prev => prev.filter(s => s.id !== id));
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            if (hostClub.trim() && user) {
                await saveClubName(user.id, hostClub.trim());
            }

            const shareToken = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

            const { data: offerData, error: offerError } = await supabase
                .from('match_offers')
                .insert({
                    host_name: hostName,
                    host_club: hostClub || null,
                    host_contact: hostContact || null,
                    age_group: ageGroup,
                    format,
                    duration,
                    location,
                    notes: notes || null,
                    share_token: shareToken,
                    approver_email: approverEmail,
                    status: 'PENDING_APPROVAL',
                })
                .select()
                .single();

            if (offerError) throw offerError;

            if (offerData) {
                await saveMyMatchId(user!.id, offerData.id);

                const slotsToInsert = slots.map(slot => {
                    const startDt = new Date(slot.start);
                    const endDt = new Date(startDt.getTime() + duration * 60000);
                    return {
                        match_offer_id: offerData.id,
                        start_time: startDt.toISOString(),
                        end_time: endDt.toISOString(),
                        status: 'PENDING_APPROVAL',
                    };
                });

                const { error: slotsError } = await supabase.from('slots').insert(slotsToInsert);
                if (slotsError) throw slotsError;

                const approvalToken = `offer-approval-${Date.now()}-${Math.random().toString(36).substring(7)}`;
                const { error: approvalError } = await supabase
                    .from('approvals')
                    .insert({
                        slot_id: null,
                        match_offer_id: offerData.id,
                        approval_token: approvalToken,
                        approver_email: approverEmail,
                        status: 'PENDING',
                    });
                if (approvalError) throw approvalError;

                const approvalLink = generateApprovalLink(approvalToken);
                const isAvailable = await MailComposer.isAvailableAsync();

                const slotsText = slots.map(slot => {
                    return `- ${fmtDate(slot.start)} at ${slot.start.split('T')[1]?.substring(0, 5)}`;
                }).join('\n');

                if (isAvailable) {
                    await MailComposer.composeAsync({
                        recipients: [approverEmail],
                        subject: `Match Offer Approval Required - ${ageGroup} ${format}`,
                        body: `Hello,\n\n${hostName}${hostClub ? ` (${hostClub})` : ''} has created a match offer that requires your approval.\n\nMatch Details:\n- Age Group: ${ageGroup}\n- Format: ${format}\n- Duration: ${duration} minutes\n- Location: ${location}\n\nAvailable Time Slots:\n${slotsText}\n\nPlease review and approve:\n${approvalLink}\n\nThanks,\nMatchSlot App`,
                    });
                }
            }

            setShowSuccess(true);
        } catch (e: any) {
            Alert.alert('Error Creating Match', e.message || 'Unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[ss.container, { backgroundColor: t.background }]}>
                <WizardHeader step={step} onBack={back} t={t} />
                <Stepper step={step} steps={steps} t={t} />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}
                >
                    <ScrollView
                        contentContainerStyle={ss.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {step === 0 && (
                            <StepDetails
                                t={t} colorScheme={colorScheme}
                                ageGroup={ageGroup} setAgeGroup={setAgeGroup}
                                format={format} setFormat={setFormat}
                                duration={duration} setDuration={setDuration}
                                location={location} setLocation={setLocation}
                                notes={notes} setNotes={setNotes}
                            />
                        )}
                        {step === 1 && (
                            <StepSlots
                                t={t} colorScheme={colorScheme}
                                slots={slots} duration={duration}
                                onRemove={removeSlot}
                                onAddPress={() => setShowPicker(true)}
                            />
                        )}
                        {step === 2 && (
                            <StepReview
                                t={t} colorScheme={colorScheme}
                                ageGroup={ageGroup} format={format} duration={duration}
                                location={location} notes={notes} slots={slots}
                                approverEmail={approverEmail} setApproverEmail={setApproverEmail}
                            />
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>

                <View style={[ss.footer, { backgroundColor: t.background }]}>
                    <Button
                        title={step === 0 ? 'Next: time slots' : step === 1 ? 'Next: review' : 'Send for approval'}
                        icon={step === 2 ? 'sparkles-outline' : undefined}
                        onPress={canContinue ? next : undefined}
                        disabled={!canContinue}
                        loading={loading}
                    />
                </View>
            </View>

            {showPicker && (
                <DateTimePickerSheet
                    t={t} colorScheme={colorScheme}
                    onAdd={addSlot}
                    onClose={() => setShowPicker(false)}
                />
            )}

            {showSuccess && (
                <SuccessOverlay
                    t={t}
                    ageGroup={ageGroup} format={format} duration={duration}
                    location={location} slotCount={slots.length}
                />
            )}
        </>
    );
}

function WizardHeader({ step, onBack, t }: { step: number; onBack: () => void; t: any }) {
    return (
        <View style={ss.header}>
            <AnimatedPressable onPress={onBack} style={[ss.headerBtn, { backgroundColor: t.secondary }]}>
                <Ionicons name={step === 0 ? 'close-outline' : 'chevron-back-outline'} size={18} color={t.primary} />
            </AnimatedPressable>
            <View style={ss.headerCenter}>
                <Text style={[ss.headerEyebrow, { color: t.textTertiary }]}>
                    STEP {step + 1} OF 3
                </Text>
                <Text style={[ss.headerTitle, { color: t.text }]}>New match offer</Text>
            </View>
            <View style={{ width: 36 }} />
        </View>
    );
}

function Stepper({ step, steps, t }: { step: number; steps: string[]; t: any }) {
    return (
        <View style={ss.stepper}>
            {steps.map((label, i) => {
                const done = i < step;
                const active = i === step;
                const color = done || active ? t.primary : t.cardBorder;
                return (
                    <React.Fragment key={i}>
                        <View style={ss.stepperItem}>
                            <View style={[ss.stepperCircle, {
                                backgroundColor: done || active ? t.primary : 'transparent',
                                borderColor: color,
                            }]}>
                                {done ? (
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                ) : (
                                    <Text style={[ss.stepperNum, {
                                        color: active ? '#fff' : t.textTertiary,
                                    }]}>{i + 1}</Text>
                                )}
                            </View>
                            <Text style={[ss.stepperLabel, {
                                color: active ? t.text : t.textTertiary,
                                fontWeight: active ? '700' : '500',
                            }]}>{label}</Text>
                        </View>
                        {i < steps.length - 1 && (
                            <View style={[ss.stepperLine, {
                                backgroundColor: done ? t.primary : t.cardBorder,
                            }]} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

function FieldLabel({ label, t }: { label: string; t: any }) {
    return (
        <Text style={[ss.fieldLabel, { color: t.textSecondary }]}>{label}</Text>
    );
}

function StepDetails({ t, colorScheme, ageGroup, setAgeGroup, format, setFormat, duration, setDuration, location, setLocation, notes, setNotes }: any) {
    return (
        <Animated.View entering={FadeIn.duration(240)}>
            <FieldLabel label="AGE GROUP" t={t} />
            <View style={ss.chipRow}>
                {(AGE_GROUPS as readonly string[]).map(ag => {
                    const sel = ag === ageGroup;
                    return (
                        <AnimatedPressable key={ag} onPress={() => setAgeGroup(ag)} scaleTo={0.95}>
                            <View style={[ss.chip, {
                                backgroundColor: sel ? t.primary : t.card,
                                borderColor: sel ? t.primary : t.cardBorder,
                            }]}>
                                <Text style={[ss.chipText, {
                                    color: sel ? (colorScheme === 'dark' ? '#06140C' : '#FFFFFF') : t.text,
                                    fontWeight: sel ? '700' : '500',
                                }]}>{ag}</Text>
                            </View>
                        </AnimatedPressable>
                    );
                })}
            </View>

            <FieldLabel label="FORMAT" t={t} />
            <View style={ss.formatGrid}>
                {(MATCH_FORMATS as readonly string[]).map(f => {
                    const sel = f === format;
                    const players = f === '5v5' ? 10 : f === '7v7' ? 14 : f === '9v9' ? 18 : 22;
                    return (
                        <AnimatedPressable key={f} onPress={() => setFormat(f)} scaleTo={0.97}
                            style={{ width: '48%' }}>
                            <View style={[ss.formatCard, {
                                backgroundColor: sel ? t.primaryLight : t.card,
                                borderColor: sel ? t.primary : t.cardBorder,
                            }]}>
                                <FormationChip format={f} size="md" />
                                <View>
                                    <Text style={[ss.formatLabel, { color: t.text }]}>{f}</Text>
                                    <Text style={{ fontSize: 11, color: t.textSecondary }}>{players} players</Text>
                                </View>
                            </View>
                        </AnimatedPressable>
                    );
                })}
            </View>

            <FieldLabel label="DURATION" t={t} />
            <View style={ss.chipRow}>
                {(MATCH_DURATIONS as readonly number[]).map(d => {
                    const sel = d === duration;
                    return (
                        <AnimatedPressable key={d} onPress={() => setDuration(d)} scaleTo={0.95}>
                            <View style={[ss.chip, {
                                backgroundColor: sel ? t.primary : t.card,
                                borderColor: sel ? t.primary : t.cardBorder,
                            }]}>
                                <Text style={[ss.chipText, {
                                    color: sel ? (colorScheme === 'dark' ? '#06140C' : '#FFFFFF') : t.text,
                                    fontWeight: sel ? '700' : '500',
                                }]}>
                                    {d}<Text style={{ fontSize: 11, opacity: 0.65 }}> min</Text>
                                </Text>
                            </View>
                        </AnimatedPressable>
                    );
                })}
            </View>

            <FieldLabel label="VENUE / PITCH" t={t} />
            <View style={[ss.inputRow, { backgroundColor: t.inputBg, borderColor: t.cardBorder }]}>
                <Ionicons name="location-outline" size={18} color={t.textSecondary} />
                <TextInput
                    style={[ss.inputText, { color: t.text }]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g. Riverside Park · Pitch 3"
                    placeholderTextColor={t.textTertiary}
                />
            </View>

            <FieldLabel label="NOTES (OPTIONAL)" t={t} />
            <View style={[ss.inputRow, { backgroundColor: t.inputBg, borderColor: t.cardBorder, alignItems: 'flex-start', minHeight: 90, paddingVertical: 12 }]}>
                <Ionicons name="document-text-outline" size={18} color={t.textSecondary} style={{ marginTop: 2 }} />
                <TextInput
                    style={[ss.inputText, { color: t.text, minHeight: 64, textAlignVertical: 'top' }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Anything guests should know — parking, kit, etc."
                    placeholderTextColor={t.textTertiary}
                    multiline
                />
            </View>
        </Animated.View>
    );
}

function StepSlots({ t, colorScheme, slots, duration, onRemove, onAddPress }: any) {
    return (
        <Animated.View entering={FadeIn.duration(240)}>
            <FieldLabel label="AVAILABLE TIME SLOTS" t={t} />
            <Text style={{ fontSize: 12.5, color: t.textSecondary, marginBottom: 14 }}>
                Add the dates & times you can host. Guest coaches will pick one.
            </Text>

            {slots.length === 0 ? (
                <View style={[ss.emptyState, { borderColor: t.cardBorder, backgroundColor: t.card }]}>
                    <View style={[ss.emptyIcon, { backgroundColor: t.secondary }]}>
                        <Ionicons name="calendar-outline" size={22} color={t.primary} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>No slots yet</Text>
                    <Text style={{ fontSize: 12.5, color: t.textSecondary, textAlign: 'center' }}>
                        Tap below to add your first available time.
                    </Text>
                </View>
            ) : (
                <View style={{ gap: 8, marginBottom: 14 }}>
                    {slots.map((s: WizardSlot, idx: number) => (
                        <View key={s.id} style={[ss.slotRow, { backgroundColor: t.card, borderColor: t.divider }]}>
                            <View style={[ss.slotIndex, { backgroundColor: t.secondary }]}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: t.primary }}>
                                    {String(idx + 1).padStart(2, '0')}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>
                                    {fmtDate(s.start)}
                                </Text>
                                <Text style={{ fontSize: 12, color: t.textSecondary }}>
                                    {fmtTimeRange(s.start, duration)}
                                </Text>
                            </View>
                            <AnimatedPressable onPress={() => onRemove(s.id)}>
                                <View style={[ss.trashBtn, { backgroundColor: t.error + '15' }]}>
                                    <Ionicons name="trash-outline" size={15} color={t.error} />
                                </View>
                            </AnimatedPressable>
                        </View>
                    ))}
                </View>
            )}

            <AnimatedPressable onPress={onAddPress}>
                <View style={[ss.addSlotBtn, { borderColor: t.primary + '80', backgroundColor: t.primaryLight }]}>
                    <Ionicons name="add-outline" size={18} color={t.primary} />
                    <Text style={{ fontSize: 14.5, fontWeight: '700', color: t.primary }}>Add a time slot</Text>
                </View>
            </AnimatedPressable>
        </Animated.View>
    );
}

function StepReview({ t, colorScheme, ageGroup, format, duration, location, notes, slots, approverEmail, setApproverEmail }: any) {
    return (
        <Animated.View entering={FadeIn.duration(240)}>
            <Card style={{ padding: 16, marginBottom: 14 }}>
                <Text style={[ss.eyebrow, { color: t.primary }]}>MATCH SUMMARY</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <FormationChip format={format} size="md" />
                    <View>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, letterSpacing: -0.4 }}>
                            {ageGroup} · {format}
                        </Text>
                        <Text style={{ fontSize: 13, color: t.textSecondary }}>{duration} minutes</Text>
                    </View>
                </View>
                <ReviewRow icon="location-outline" label="Venue" value={location || '—'} t={t} />
                {notes ? <ReviewRow icon="document-text-outline" label="Notes" value={notes} t={t} /> : null}
            </Card>

            <Card style={{ padding: 16, marginBottom: 14 }}>
                <Text style={[ss.eyebrow, { color: t.primary }]}>
                    {slots.length} TIME SLOT{slots.length !== 1 ? 'S' : ''}
                </Text>
                {slots.map((s: WizardSlot, i: number) => (
                    <View key={s.id} style={[ss.reviewSlotRow, i > 0 && { borderTopWidth: 1, borderTopColor: t.divider }]}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: t.primary, width: 24 }}>
                            {String(i + 1).padStart(2, '0')}
                        </Text>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: t.text }}>{fmtDate(s.start)}</Text>
                            <Text style={{ fontSize: 12, color: t.textSecondary }}>{fmtTimeRange(s.start, duration)}</Text>
                        </View>
                    </View>
                ))}
            </Card>

            <FieldLabel label="APPROVER EMAIL" t={t} />
            <View style={[ss.inputRow, { backgroundColor: t.inputBg, borderColor: t.cardBorder }]}>
                <Ionicons name="mail-outline" size={18} color={t.textSecondary} />
                <TextInput
                    style={[ss.inputText, { color: t.text }]}
                    value={approverEmail}
                    onChangeText={setApproverEmail}
                    placeholder="approver@yourclub.com"
                    placeholderTextColor={t.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={[ss.infoBanner, { backgroundColor: t.info + '10', borderColor: t.info + '30' }]}>
                <Ionicons name="shield-outline" size={18} color={t.info} />
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: t.text, marginBottom: 2 }}>
                        Pre-approval keeps your slots safe
                    </Text>
                    <Text style={{ fontSize: 12, color: t.textSecondary, lineHeight: 17 }}>
                        Your approver will get an email to review each time slot. Your offer goes live once they sign off.
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
}

function ReviewRow({ icon, label, value, t }: { icon: any; label: string; value: string; t: any }) {
    return (
        <View style={ss.reviewRowContainer}>
            <Ionicons name={icon} size={16} color={t.textSecondary} />
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: t.textTertiary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {label}
                </Text>
                <Text style={{ fontSize: 14, color: t.text, marginTop: 2 }}>{value}</Text>
            </View>
        </View>
    );
}

function DateTimePickerSheet({ t, colorScheme, onAdd, onClose }: { t: any; colorScheme: string; onAdd: (d: string, t: string) => void; onClose: () => void }) {
    const today = new Date();
    const dates = Array.from({ length: 21 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i + 7);
        return d;
    });
    const times = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    const [selectedDate, setSelectedDate] = useState(dates[0]);
    const [selectedTime, setSelectedTime] = useState('10:00');

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    return (
        <Modal transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={ss.sheetOverlay} onPress={onClose}>
                <Pressable style={[ss.sheet, { backgroundColor: t.background }]} onPress={e => e.stopPropagation()}>
                    <View style={[ss.sheetHandle, { backgroundColor: t.cardBorder }]} />
                    <Text style={[ss.sheetTitle, { color: t.text }]}>Pick a date & time</Text>

                    <FieldLabel label="DATE" t={t} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2, paddingBottom: 6 }}>
                            {dates.map(d => {
                                const sel = d.getTime() === selectedDate.getTime();
                                return (
                                    <AnimatedPressable key={d.toISOString()} onPress={() => setSelectedDate(d)} scaleTo={0.92}>
                                        <View style={[ss.dateChip, {
                                            backgroundColor: sel ? t.primary : t.card,
                                            borderColor: sel ? t.primary : t.cardBorder,
                                        }]}>
                                            <Text style={[ss.dateChipDay, {
                                                color: sel ? (colorScheme === 'dark' ? '#06140C' : '#FFFFFF') : t.text,
                                            }]}>{getDayAbbr(d).slice(0, 3)}</Text>
                                            <Text style={[ss.dateChipNum, {
                                                color: sel ? (colorScheme === 'dark' ? '#06140C' : '#FFFFFF') : t.text,
                                            }]}>{d.getDate()}</Text>
                                            <Text style={[ss.dateChipMonth, {
                                                color: sel ? (colorScheme === 'dark' ? '#06140C' : '#FFFFFF') : t.text,
                                                opacity: sel ? 1 : 0.7,
                                            }]}>{getMonthAbbr(d)}</Text>
                                        </View>
                                    </AnimatedPressable>
                                );
                            })}
                        </View>
                    </ScrollView>

                    <FieldLabel label="KICK-OFF TIME" t={t} />
                    <View style={ss.timeGrid}>
                        {times.map(tm => {
                            const sel = tm === selectedTime;
                            return (
                                <AnimatedPressable key={tm} onPress={() => setSelectedTime(tm)} scaleTo={0.94}
                                    style={{ width: '18%' }}>
                                    <View style={[ss.timeChip, {
                                        backgroundColor: sel ? t.primary : t.card,
                                        borderColor: sel ? t.primary : t.cardBorder,
                                    }]}>
                                        <Text style={{
                                            fontSize: 13.5, fontWeight: '600', textAlign: 'center',
                                            color: sel ? (colorScheme === 'dark' ? '#06140C' : '#FFFFFF') : t.text,
                                        }}>{tm}</Text>
                                    </View>
                                </AnimatedPressable>
                            );
                        })}
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <Button title="Add slot" icon="checkmark-outline" onPress={() => onAdd(dateStr, selectedTime)} />
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function SuccessOverlay({ t, ageGroup, format, duration, location, slotCount }: any) {
    const scaleAnim = useSharedValue(0.2);
    const ringScale = useSharedValue(0.6);
    const ringOpacity = useSharedValue(0.6);

    useEffect(() => {
        scaleAnim.value = withSpring(1, { damping: 12, stiffness: 150 });
        ringScale.value = withTiming(2, { duration: 1100 });
        ringOpacity.value = withTiming(0, { duration: 1100 });
    }, []);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleAnim.value }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ringScale.value }],
        opacity: ringOpacity.value,
    }));

    return (
        <View style={[ss.successOverlay, { backgroundColor: t.background }]}>
            <View style={ss.successContent}>
                <View style={ss.successIconWrap}>
                    <Animated.View style={[ss.successRing, { backgroundColor: t.primary }, ringStyle]} />
                    <Animated.View style={[ss.successIcon, { backgroundColor: t.primary }, iconStyle]}>
                        <Ionicons name="sparkles-outline" size={36} color="#fff" />
                    </Animated.View>
                </View>
                <Text style={[ss.eyebrow, { color: t.primary, marginTop: 24 }]}>FIXTURE CREATED</Text>
                <Text style={[ss.successTitle, { color: t.text }]}>Sent for approval</Text>
                <Text style={[ss.successBody, { color: t.textSecondary }]}>
                    We've emailed your approver to review the {slotCount} time slot{slotCount !== 1 ? 's' : ''}. You'll get a notification once they sign off.
                </Text>

                <Card style={{ padding: 16, marginTop: 24, width: '100%' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <FormationChip format={format} size="sm" />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{ageGroup} · {format}</Text>
                            <Text style={{ fontSize: 12, color: t.textSecondary }}>{location} · {slotCount} slots · {duration} min</Text>
                        </View>
                    </View>
                </Card>

                <View style={{ marginTop: 24, width: '100%' }}>
                    <Button
                        title="View in My Matches"
                        icon="arrow-forward-outline"
                        onPress={() => router.replace('/(tabs)/manage')}
                    />
                </View>
            </View>
        </View>
    );
}

const ss = StyleSheet.create({
    container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 54 : 30 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
    headerBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingBottom: 14 },
    stepperItem: { alignItems: 'center', gap: 6 },
    stepperCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    stepperNum: { fontSize: 11, fontWeight: '700' },
    stepperLabel: { fontSize: 10.5 },
    stepperLine: { flex: 1, height: 2, borderRadius: 1, marginTop: -14 },
    fieldLabel: { fontSize: 11.5, fontWeight: '600', letterSpacing: 0.3, marginBottom: 6, marginTop: 16 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
    chipText: { fontSize: 14 },
    formatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    formatCard: { borderRadius: 14, padding: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 10 },
    formatLabel: { fontSize: 15, fontWeight: '700' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 48, borderRadius: 14, borderWidth: 1 },
    inputText: { flex: 1, fontSize: 15 },
    emptyState: { borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', padding: 28, alignItems: 'center', gap: 8 },
    emptyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    slotRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
    slotIndex: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    trashBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    addSlotBtn: { padding: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    eyebrow: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
    reviewSlotRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    reviewRowContainer: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 8 },
    infoBanner: { padding: 14, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
    footer: { padding: 16, paddingBottom: 24 },
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 32, maxHeight: '78%' },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
    sheetTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 14 },
    dateChip: { minWidth: 56, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    dateChipDay: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
    dateChipNum: { fontSize: 18, fontWeight: '800', lineHeight: 22, marginTop: 2 },
    dateChipMonth: { fontSize: 10, fontWeight: '600', marginTop: 2 },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeChip: { paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
    successOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: 'center', alignItems: 'center' },
    successContent: { alignItems: 'center', paddingHorizontal: 24, maxWidth: 340 },
    successIconWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
    successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    successRing: { position: 'absolute', width: 80, height: 80, borderRadius: 40 },
    successTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center', marginTop: 4 },
    successBody: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 8, maxWidth: 300 },
});
