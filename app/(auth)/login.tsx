import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { resetPassword } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
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
    const isDark = colorScheme === 'dark';

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

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                {/* Decorative orbs — plain Views, no native module needed */}
                <View style={[styles.orb1, { backgroundColor: isDark ? 'rgba(27,139,78,0.22)' : 'rgba(27,139,78,0.10)' }]} />
                <View style={[styles.orb2, { backgroundColor: isDark ? 'rgba(34,197,94,0.16)' : 'rgba(34,197,94,0.07)' }]} />

                <View style={styles.header}>
                    {/* Solid indigo logo squircle */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>⚽</Text>
                    </View>
                    <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{t('auth.matchslot')}</Text>
                    <Text style={[styles.subtitle, { color: Colors[colorScheme].textSecondary }]}>
                        {t('auth.scheduleMatches')}
                    </Text>
                </View>

                <View style={[styles.formCard, {
                    backgroundColor: Colors[colorScheme].card,
                    shadowColor: isDark ? '#000' : 'rgba(27,139,78,0.15)',
                }]}>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={[styles.errorText, { color: Colors[colorScheme].error }]}>{error}</Text>
                        </View>
                    )}

                    <Input label={t('auth.email')} icon="mail-outline" placeholder={t('auth.emailPlaceholder')}
                        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                        value={email} onChangeText={setEmail} />

                    <Input label={t('auth.password')} icon="lock-closed-outline" placeholder={t('auth.passwordPlaceholder')}
                        secureTextEntry autoCapitalize="none"
                        value={password} onChangeText={setPassword} />

                    <Pressable onPress={() => { setResetEmail(email); setShowForgot(true); }} style={styles.forgotRow}>
                        <Text style={[styles.forgotText, { color: Colors[colorScheme].primary }]}>{t('auth.forgotPassword')}</Text>
                    </Pressable>

                    <Button title={t('auth.signIn')} onPress={handleLogin} loading={submitting} style={styles.button} />

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: Colors[colorScheme].textSecondary }]}>
                            {t('auth.noAccount')}{' '}
                        </Text>
                        <Link href="/(auth)/register" asChild>
                            <Pressable>
                                <Text style={[styles.linkText, { color: Colors[colorScheme].primary }]}>{t('auth.signUp')}</Text>
                            </Pressable>
                        </Link>
                    </View>
                </View>
            </ScrollView>

            <Modal visible={showForgot} transparent animationType="fade" onRequestClose={() => { setShowForgot(false); setResetStep('email'); setResettingPassword(false); }}>
                <Pressable style={styles.modalOverlay} onPress={() => { setShowForgot(false); setResetStep('email'); setResettingPassword(false); }}>
                    <Pressable style={[styles.modalContent, { backgroundColor: Colors[colorScheme].card }]} onPress={(e) => e.stopPropagation()}>
                        {resetStep === 'email' && (
                            <>
                                <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>{t('auth.resetPassword')}</Text>
                                <Text style={[styles.modalDesc, { color: Colors[colorScheme].textSecondary }]}>
                                    {t('auth.enterEmailForReset')}
                                </Text>
                                <Input label={t('auth.email')} icon="mail-outline" placeholder={t('auth.emailPlaceholder')}
                                    keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                                    value={resetEmail} onChangeText={setResetEmail} />
                                <Button title={t('auth.sendResetCode')} onPress={handleForgotPassword} loading={resetLoading} style={{ marginTop: 8 }} />
                            </>
                        )}
                        {resetStep === 'code' && (
                            <>
                                <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>{t('auth.enterCode')}</Text>
                                <Text style={[styles.modalDesc, { color: Colors[colorScheme].textSecondary }]}>
                                    {t('auth.enterCode')}
                                </Text>
                                <Input label={t('auth.verifyCode')} icon="key-outline" placeholder={t('auth.codePlaceholder')}
                                    autoCapitalize="none" autoCorrect={false}
                                    value={otpCode} onChangeText={setOtpCode} />
                                <Button title={t('auth.verifyCode')} onPress={handleVerifyOtp} loading={resetLoading} style={{ marginTop: 8 }} />
                                <Pressable onPress={() => { setResetStep('email'); setOtpCode(''); }} style={styles.cancelBtn}>
                                    <Text style={[styles.cancelText, { color: Colors[colorScheme].primary }]}>{t('auth.sendResetCode')}</Text>
                                </Pressable>
                            </>
                        )}
                        {resetStep === 'newpass' && (
                            <>
                                <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>{t('auth.newPassword')}</Text>
                                <Text style={[styles.modalDesc, { color: Colors[colorScheme].textSecondary }]}>
                                    {t('auth.enterNewPassword')}
                                </Text>
                                <Input label={t('auth.newPassword')} icon="lock-closed-outline" placeholder={t('auth.newPasswordPlaceholder')}
                                    secureTextEntry autoCapitalize="none"
                                    value={newPassword} onChangeText={setNewPassword} />
                                <Input label={t('auth.confirmPassword')} icon="lock-closed-outline" placeholder={t('auth.confirmNewPassword')}
                                    secureTextEntry autoCapitalize="none"
                                    value={confirmNewPassword} onChangeText={setConfirmNewPassword} />
                                <Button title={t('auth.updatePassword')} onPress={handleSetNewPassword} loading={resetLoading} style={{ marginTop: 8 }} />
                            </>
                        )}
                        <Pressable onPress={() => { setShowForgot(false); setResetStep('email'); setResettingPassword(false); }} style={styles.cancelBtn}>
                            <Text style={[styles.cancelText, { color: Colors[colorScheme].textSecondary }]}>{t('common.cancel')}</Text>
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
    },
    orb1: {
        position: 'absolute',
        top: -100,
        left: -60,
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    orb2: {
        position: 'absolute',
        bottom: 60,
        right: -80,
        width: 240,
        height: 240,
        borderRadius: 120,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 88,
        height: 88,
        borderRadius: 24,
        backgroundColor: '#1B8B4E',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#1B8B4E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    logo: { fontSize: 44 },
    title: {
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: { fontSize: 16 },
    formCard: {
        width: '100%',
        padding: 24,
        borderRadius: 28,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 4,
    },
    errorContainer: {
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.2)',
    },
    errorText: { fontSize: 14, textAlign: 'center', fontWeight: '500' },
    forgotRow: { alignItems: 'flex-end', marginTop: 4, marginBottom: 4 },
    forgotText: { fontSize: 14, fontWeight: '600' },
    button: { marginTop: 12 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { fontSize: 15 },
    linkText: { fontSize: 15, fontWeight: '700' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    modalDesc: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
    cancelBtn: { alignItems: 'center', marginTop: 16 },
    cancelText: { fontSize: 15, fontWeight: '600' },
});
