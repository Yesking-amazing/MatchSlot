import { Monogram } from '@/components/ui/Brandmark';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { resetPassword } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import { KeyRound, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function LoginScreen() {
    const { signIn, loading, setResettingPassword } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];

    const [submitting, setSubmitting] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetStep, setResetStep] = useState<'email' | 'code' | 'newpass'>('email');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const handleForgotPassword = async () => {
        if (!resetEmail.trim()) {
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
            return;
        }
        setResetLoading(true);
        try {
            await resetPassword(resetEmail.trim());
            setResetStep('code');
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t('auth.failedSignIn'));
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode.trim()) {
            Alert.alert(t('common.error'), t('auth.enterCodeError'));
            return;
        }
        setResetLoading(true);
        setResettingPassword(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email: resetEmail.trim(),
                token: otpCode.trim(),
                type: 'recovery',
            });
            if (error) throw error;
            setResetStep('newpass');
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t('auth.invalidCode'));
        } finally {
            setResetLoading(false);
        }
    };

    const handleSetNewPassword = async () => {
        if (!newPassword || !confirmNewPassword) {
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert(t('common.error'), t('auth.passwordTooShort'));
            return;
        }
        if (newPassword !== confirmNewPassword) {
            Alert.alert(t('common.error'), t('auth.passwordMismatch'));
            return;
        }
        setResetLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            Alert.alert(t('common.success'), t('auth.passwordUpdatedSignIn'));
            setResettingPassword(false);
            setShowForgot(false);
            setResetStep('email');
            setOtpCode('');
            setNewPassword('');
            setConfirmNewPassword('');
            setResetEmail('');
        } catch (err: any) {
            Alert.alert(t('common.error'), err.message || t('auth.failedSignIn'));
        } finally {
            setResetLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) { setError(t('auth.fillAllFields')); return; }
        setError(null);
        setSubmitting(true);
        try {
            await signIn({ email: email.trim(), password });
            // useProtectedRoute in _layout.tsx handles the redirect once user is set
        } catch (err: any) {
            setError(err.message || t('auth.failedSignIn'));
            setSubmitting(false);
        }
    };

    const closeForgot = () => { setShowForgot(false); setResetStep('email'); setResettingPassword(false); };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: c.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                <View style={styles.header}>
                    <Monogram size={56} />
                    <Text style={[styles.title, { color: c.text }]}>{t('auth.matchslot')}</Text>
                    <Text style={[styles.subtitle, { color: c.textMuted }]}>
                        {t('auth.scheduleMatches')}
                    </Text>
                </View>

                <Card padding={20} style={styles.formCard}>
                    {error && (
                        <View style={[styles.errorContainer, { borderColor: c.errorBorder }]}>
                            <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
                        </View>
                    )}

                    <Input label={t('auth.email')} icon={<Mail size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.emailPlaceholder')}
                        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                        value={email} onChangeText={setEmail} />

                    <Input label={t('auth.password')} icon={<Lock size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.passwordPlaceholder')}
                        secureTextEntry autoCapitalize="none"
                        value={password} onChangeText={setPassword} />

                    <Pressable onPress={() => { setResetEmail(email); setShowForgot(true); }} style={styles.forgotRow}>
                        <Text style={[styles.forgotText, { color: c.primary }]}>{t('auth.forgotPassword')}</Text>
                    </Pressable>

                    <Button title={t('auth.signIn')} onPress={handleLogin} loading={submitting} style={styles.button} />

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: c.textMuted }]}>
                            {t('auth.noAccount')}{' '}
                        </Text>
                        <Link href="/(auth)/register" asChild>
                            <Pressable>
                                <Text style={[styles.linkText, { color: c.primary }]}>{t('auth.signUp')}</Text>
                            </Pressable>
                        </Link>
                    </View>
                </Card>
            </ScrollView>

            <Modal visible={showForgot} transparent animationType="fade" onRequestClose={closeForgot}>
                <Pressable style={styles.modalOverlay} onPress={closeForgot}>
                    <Pressable style={[styles.modalContent, { backgroundColor: c.card, borderColor: c.border }]} onPress={(e) => e.stopPropagation()}>
                        {resetStep === 'email' && (
                            <>
                                <Text style={[styles.modalTitle, { color: c.text }]}>{t('auth.resetPassword')}</Text>
                                <Text style={[styles.modalDesc, { color: c.textMuted }]}>
                                    {t('auth.enterEmailForReset')}
                                </Text>
                                <Input label={t('auth.email')} icon={<Mail size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.emailPlaceholder')}
                                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                                    value={resetEmail} onChangeText={setResetEmail} />
                                <Button title={t('auth.sendResetCode')} onPress={handleForgotPassword} loading={resetLoading} style={{ marginTop: 8 }} />
                            </>
                        )}
                        {resetStep === 'code' && (
                            <>
                                <Text style={[styles.modalTitle, { color: c.text }]}>{t('auth.enterCode')}</Text>
                                <Text style={[styles.modalDesc, { color: c.textMuted }]}>
                                    {t('auth.enterCode')}
                                </Text>
                                <Input label={t('auth.verifyCode')} icon={<KeyRound size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.codePlaceholder')}
                                    autoCapitalize="none" autoCorrect={false}
                                    value={otpCode} onChangeText={setOtpCode} />
                                <Button title={t('auth.verifyCode')} onPress={handleVerifyOtp} loading={resetLoading} style={{ marginTop: 8 }} />
                                <Pressable onPress={() => { setResetStep('email'); setOtpCode(''); }} style={styles.cancelBtn}>
                                    <Text style={[styles.cancelText, { color: c.primary }]}>{t('auth.sendResetCode')}</Text>
                                </Pressable>
                            </>
                        )}
                        {resetStep === 'newpass' && (
                            <>
                                <Text style={[styles.modalTitle, { color: c.text }]}>{t('auth.newPassword')}</Text>
                                <Text style={[styles.modalDesc, { color: c.textMuted }]}>
                                    {t('auth.enterNewPassword')}
                                </Text>
                                <Input label={t('auth.newPassword')} icon={<Lock size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.newPasswordPlaceholder')}
                                    secureTextEntry autoCapitalize="none"
                                    value={newPassword} onChangeText={setNewPassword} />
                                <Input label={t('auth.confirmPassword')} icon={<Lock size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.confirmNewPassword')}
                                    secureTextEntry autoCapitalize="none"
                                    value={confirmNewPassword} onChangeText={setConfirmNewPassword} />
                                <Button title={t('auth.updatePassword')} onPress={handleSetNewPassword} loading={resetLoading} style={{ marginTop: 8 }} />
                            </>
                        )}
                        <Pressable onPress={closeForgot} style={styles.cancelBtn}>
                            <Text style={[styles.cancelText, { color: c.textMuted }]}>{t('common.cancel')}</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        maxWidth: 440,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontFamily: Fonts.display,
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.8,
        marginTop: 20,
        marginBottom: 6,
    },
    subtitle: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '500' },
    formCard: { width: '100%' },
    errorContainer: {
        backgroundColor: 'rgba(192,85,79,0.08)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
    },
    errorText: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '500' },
    forgotRow: { alignItems: 'flex-end', marginTop: 2, marginBottom: 4 },
    forgotText: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '600' },
    button: { marginTop: 14 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { fontFamily: Fonts.body, fontSize: 13.5, fontWeight: '500' },
    linkText: { fontFamily: Fonts.body, fontSize: 13.5, fontWeight: '700' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        maxWidth: 440,
        width: '100%',
        alignSelf: 'center',
    },
    modalTitle: { fontFamily: Fonts.display, fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
    modalDesc: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '500', marginBottom: 16, lineHeight: 19 },
    cancelBtn: { alignItems: 'center', marginTop: 14 },
    cancelText: { fontFamily: Fonts.body, fontSize: 13.5, fontWeight: '600' },
});
