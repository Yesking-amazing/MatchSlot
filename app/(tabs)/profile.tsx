import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Crest } from '@/components/ui/Crest';
import { Input } from '@/components/ui/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { getSavedLanguage, setAppLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import {
    Building2,
    Check,
    ChevronRight,
    FileText,
    Globe,
    LogOut,
    MessageSquare,
    Pencil,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
    const styles = getStyles(colorScheme);
    const { user } = useAuth();
    const [clubName, setClubName] = useState('');
    const [savedClubName, setSavedClubName] = useState('');
    const [editingClub, setEditingClub] = useState(false);
    const [currentLang, setCurrentLang] = useState<string | null>(null);
    const [showLangPicker, setShowLangPicker] = useState(false);

    const LANGUAGES = [
        { code: null, label: t('profile.languageSystem') },
        { code: 'en', label: t('profile.languageEnglish') },
        { code: 'de', label: t('profile.languageGerman') },
        { code: 'fr', label: t('profile.languageFrench') },
        { code: 'it', label: t('profile.languageItalian') },
    ];

    const userEmail = user?.email ?? null;

    useEffect(() => {
        if (user?.user_metadata?.club_name) {
            setClubName(user.user_metadata.club_name);
            setSavedClubName(user.user_metadata.club_name);
        }
        getSavedLanguage().then(setCurrentLang);
    }, [user]);

    const handleLanguageChange = async (code: string | null) => {
        await setAppLanguage(code);
        setCurrentLang(code);
        setShowLangPicker(false);
    };

    const currentLangLabel = LANGUAGES.find(l => l.code === currentLang)?.label ?? t('profile.languageSystem');

    const handleSaveClubName = async () => {
        if (!user) return;
        const trimmed = clubName.trim();
        await supabase.auth.updateUser({ data: { club_name: trimmed } });
        setSavedClubName(trimmed);
        setEditingClub(false);
    };

    const handleLogout = async () => {
        Alert.alert(t('profile.logOut'), t('profile.logOutConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('profile.logOut'),
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) Alert.alert(t('common.error'), error.message);
                    else router.replace('/(auth)/login');
                },
            },
        ]);
    };

    const handleFeedback = () => Linking.openURL('mailto:support@matchslot.app?subject=MatchSlot%20Feedback');
    const handlePrivacy = () => Linking.openURL('https://matchslot.app/privacy');

    const SettingsRow = ({ icon, label, value, rightElement, onPress, first = false, destructive = false }: any) => (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [
                styles.settingsRow,
                !first && styles.settingsRowDivider,
                pressed && onPress && { backgroundColor: c.primaryTint },
            ]}
        >
            <View style={styles.settingsRowLeft}>
                {icon}
                <Text style={[styles.settingsLabel, destructive && styles.settingsLabelDestructive]}>{label}</Text>
            </View>
            <View style={styles.settingsRowRight}>
                {value != null && <Text style={styles.settingsValue} numberOfLines={1}>{value}</Text>}
                {rightElement ?? (onPress && !destructive && (
                    <ChevronRight size={16} color={c.textFaint} strokeWidth={2} />
                ))}
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <Text style={styles.title}>{t('profile.title')}</Text>
                </View>

                {/* Hero Card */}
                <Card style={styles.heroCard} padding={18}>
                    <View style={styles.heroInner}>
                        <Crest name={savedClubName || 'Coach'} size={52} shape="circle" />
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>Coach</Text>
                            <Text style={styles.profileEmail} numberOfLines={1}>{userEmail || t('common.loading')}</Text>
                        </View>
                    </View>
                </Card>

                {/* Club Name Section */}
                <View style={styles.section}>
                    <Text style={styles.kicker}>{t('profile.clubInfo')}</Text>
                    <Card style={styles.settingsCard} padding={0}>
                        {editingClub ? (
                            <View style={styles.editClubRow}>
                                <View style={styles.editClubInput}>
                                    <Input
                                        placeholder={t('profile.enterClubName')}
                                        value={clubName}
                                        onChangeText={setClubName}
                                        autoFocus
                                    />
                                </View>
                                <View style={styles.editClubButtons}>
                                    <View style={styles.editClubButton}>
                                        <Button
                                            title={t('common.cancel')}
                                            variant="secondary"
                                            onPress={() => {
                                                setClubName(savedClubName);
                                                setEditingClub(false);
                                            }}
                                        />
                                    </View>
                                    <View style={styles.editClubButton}>
                                        <Button title={t('common.save')} onPress={handleSaveClubName} />
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <SettingsRow
                                first
                                icon={<Building2 size={18} color={c.primary} strokeWidth={2} />}
                                label={savedClubName || t('profile.addClubName')}
                                onPress={() => setEditingClub(true)}
                                rightElement={<Pencil size={16} color={c.textFaint} strokeWidth={2} />}
                            />
                        )}
                    </Card>
                </View>

                {/* Language Picker */}
                <View style={styles.section}>
                    <Text style={styles.kicker}>{t('profile.language')}</Text>
                    <Card style={styles.settingsCard} padding={0}>
                        <SettingsRow
                            first
                            icon={<Globe size={18} color={c.primary} strokeWidth={2} />}
                            label={t('profile.language')}
                            value={currentLangLabel}
                            onPress={() => setShowLangPicker(true)}
                        />
                    </Card>
                </View>

                {/* Support & feedback */}
                <View style={styles.section}>
                    <Text style={styles.kicker}>{t('profile.supportFeedback')}</Text>
                    <Card style={styles.settingsCard} padding={0}>
                        <SettingsRow
                            first
                            icon={<MessageSquare size={18} color={c.primary} strokeWidth={2} />}
                            label={t('profile.sendFeedback')}
                            onPress={handleFeedback}
                        />
                        <SettingsRow
                            icon={<FileText size={18} color={c.primary} strokeWidth={2} />}
                            label={t('profile.privacyPolicy')}
                            onPress={handlePrivacy}
                        />
                    </Card>
                </View>

                {/* Account */}
                <View style={styles.section}>
                    <Text style={styles.kicker}>{t('profile.account')}</Text>
                    <Card style={styles.settingsCard} padding={0}>
                        <SettingsRow
                            first
                            icon={<LogOut size={18} color={c.error} strokeWidth={2} />}
                            label={t('profile.logOut')}
                            onPress={handleLogout}
                            destructive
                        />
                    </Card>
                </View>

                <Text style={styles.versionText}>MatchSlot v1.9.1</Text>
            </ScrollView>

            {/* Language Picker Modal */}
            <Modal visible={showLangPicker} transparent animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={() => setShowLangPicker(false)}>
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
                        {LANGUAGES.map((lang, i) => {
                            const active = currentLang === lang.code;
                            return (
                                <Pressable
                                    key={lang.code ?? 'system'}
                                    style={({ pressed }) => [
                                        styles.langOption,
                                        i > 0 && styles.langOptionDivider,
                                        pressed && { backgroundColor: c.primaryTint },
                                    ]}
                                    onPress={() => handleLanguageChange(lang.code)}
                                >
                                    <Text style={[styles.langOptionText, active && styles.langOptionActive]}>
                                        {lang.label}
                                    </Text>
                                    {active && <Check size={18} color={c.primary} strokeWidth={2.5} />}
                                </Pressable>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
    const c = Colors[colorScheme];
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: c.background,
        },
        scrollContent: {
            padding: 20,
            paddingBottom: 40,
        },
        header: {
            marginBottom: 20,
        },
        title: {
            fontFamily: Fonts.display,
            fontSize: 26,
            fontWeight: '800',
            color: c.text,
            letterSpacing: -0.8,
        },

        // Hero card
        heroCard: {
            marginBottom: 24,
        },
        heroInner: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
        },
        profileInfo: {
            flex: 1,
            gap: 3,
        },
        profileName: {
            fontFamily: Fonts.display,
            fontSize: 18,
            fontWeight: '800',
            color: c.text,
            letterSpacing: -0.4,
        },
        profileEmail: {
            fontFamily: Fonts.body,
            fontSize: 13,
            color: c.textMuted,
        },

        // Sections
        section: {
            marginBottom: 22,
        },
        kicker: {
            fontFamily: Fonts.body,
            fontSize: 11,
            fontWeight: '700',
            color: c.textMuted,
            letterSpacing: 1.5,
            marginBottom: 10,
            marginLeft: 4,
            textTransform: 'uppercase',
        },
        settingsCard: {
            overflow: 'hidden',
            marginBottom: 0,
        },
        settingsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            minHeight: 52,
        },
        settingsRowDivider: {
            borderTopWidth: 1,
            borderTopColor: c.divider,
        },
        settingsRowLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flexShrink: 1,
        },
        settingsRowRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flexShrink: 1,
            marginLeft: 12,
        },
        settingsLabel: {
            fontFamily: Fonts.body,
            fontSize: 14,
            fontWeight: '600',
            color: c.text,
            flexShrink: 1,
        },
        settingsLabelDestructive: {
            color: c.error,
        },
        settingsValue: {
            fontFamily: Fonts.body,
            fontSize: 13.5,
            fontWeight: '700',
            color: c.textMuted,
            flexShrink: 1,
        },

        // Club name editing
        editClubRow: {
            padding: 16,
            gap: 12,
        },
        editClubInput: {
            marginBottom: -16, // offset Input wrapper's marginBottom
        },
        editClubButtons: {
            flexDirection: 'row',
            gap: 10,
        },
        editClubButton: {
            flex: 1,
        },

        // Language modal
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            backgroundColor: c.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 34,
            borderTopWidth: 1,
            borderColor: c.border,
        },
        modalHandle: {
            alignSelf: 'center',
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: c.divider,
            marginBottom: 14,
        },
        modalTitle: {
            fontFamily: Fonts.display,
            fontSize: 18,
            fontWeight: '800',
            textAlign: 'center',
            color: c.text,
            letterSpacing: -0.4,
            marginBottom: 8,
        },
        langOption: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 16,
            paddingHorizontal: 4,
        },
        langOptionDivider: {
            borderTopWidth: 1,
            borderTopColor: c.dividerFine,
        },
        langOptionText: {
            fontFamily: Fonts.body,
            fontSize: 15,
            fontWeight: '500',
            color: c.text,
        },
        langOptionActive: {
            color: c.primary,
            fontWeight: '700',
        },

        versionText: {
            fontFamily: Fonts.body,
            textAlign: 'center',
            fontSize: 11.5,
            color: c.textFaint,
            marginTop: 8,
        },
    });
};
