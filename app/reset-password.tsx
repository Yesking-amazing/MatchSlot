import { Monogram } from '@/components/ui/Brandmark';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';
import { updatePassword } from '@/lib/auth';
import { Stack } from 'expo-router';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ResetPasswordScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const c = Colors[colorScheme];
    const { t } = useTranslation();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            // Method 1: Token hash from query params (from custom email template)
            const urlParams = new URLSearchParams(window.location.search);
            const tokenHash = urlParams.get('token_hash');
            const type = urlParams.get('type');

            if (tokenHash && type === 'recovery') {
                supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: 'recovery',
                }).then(({ error }) => {
                    if (error) {
                        setError(t('auth.invalidResetLink'));
                    } else {
                        setSessionReady(true);
                    }
                    setLoading(false);
                });
                return;
            }

            // Method 2: Access token from URL hash (from Supabase verify redirect)
            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    }).then(({ error }) => {
                        if (error) {
                            setError(t('auth.invalidResetLink'));
                        } else {
                            setSessionReady(true);
                        }
                        setLoading(false);
                    });
                    return;
                }
            }
        }

        // Fallback: check for existing session
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setSessionReady(true);
            } else {
                setError('Invalid or expired reset link. Please request a new one.');
            }
            setLoading(false);
        });
    }, []);

    const handleResetPassword = async () => {
        if (!password || !confirmPassword) {
            setError(t('auth.fillAllFields'));
            return;
        }
        if (password.length < 6) {
            setError(t('auth.passwordTooShort'));
            return;
        }
        if (password !== confirmPassword) {
            setError(t('auth.passwordMismatch'));
            return;
        }

        setError(null);
        setSubmitting(true);
        try {
            await updatePassword(password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || t('auth.failedSignIn'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: c.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                <View style={styles.header}>
                    <Monogram size={56} />
                    <Text style={[styles.title, { color: c.text }]}>{t('auth.resetPassword')}</Text>
                    <Text style={[styles.subtitle, { color: c.textMuted }]}>
                        {t('auth.enterNewPassword')}
                    </Text>
                </View>

                <Card padding={20} style={styles.formCard}>
                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color={c.primary} />
                            <Text style={[styles.loadingText, { color: c.textMuted }]}>
                                {t('auth.verifyingLink')}
                            </Text>
                        </View>
                    ) : success ? (
                        <View style={styles.centerContent}>
                            <View style={[styles.stateIcon, { backgroundColor: c.primaryTint }]}>
                                <CheckCircle size={30} color={c.primary} strokeWidth={2} />
                            </View>
                            <Text style={[styles.successTitle, { color: c.text }]}>
                                {t('auth.passwordUpdated')}
                            </Text>
                            <Text style={[styles.successText, { color: c.textMuted }]}>
                                {t('auth.passwordResetSuccess')}
                            </Text>
                        </View>
                    ) : !sessionReady ? (
                        <View style={styles.centerContent}>
                            <View style={[styles.stateIcon, { backgroundColor: 'rgba(192,85,79,0.08)' }]}>
                                <AlertCircle size={30} color={c.error} strokeWidth={2} />
                            </View>
                            <Text style={[styles.errorTitle, { color: c.text }]}>
                                {t('auth.linkExpired')}
                            </Text>
                            <Text style={[styles.errorDesc, { color: c.textMuted }]}>
                                {error || t('auth.linkExpiredDesc')}
                            </Text>
                        </View>
                    ) : (
                        <>
                            {error && (
                                <View style={[styles.errorContainer, { borderColor: c.errorBorder }]}>
                                    <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
                                </View>
                            )}

                            <Input
                                label={t('auth.newPassword')}
                                icon={<Lock size={17} color={c.textMuted} strokeWidth={2} />}
                                placeholder={t('auth.newPasswordPlaceholder')}
                                secureTextEntry
                                autoCapitalize="none"
                                value={password}
                                onChangeText={setPassword}
                            />

                            <Input
                                label={t('auth.confirmPassword')}
                                icon={<Lock size={17} color={c.textMuted} strokeWidth={2} />}
                                placeholder={t('auth.confirmNewPassword')}
                                secureTextEntry
                                autoCapitalize="none"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />

                            <Button
                                title={t('auth.updatePassword')}
                                onPress={handleResetPassword}
                                loading={submitting}
                                style={{ marginTop: 8 }}
                            />
                        </>
                    )}
                </Card>
            </ScrollView>
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
    subtitle: { fontFamily: Fonts.body, fontSize: 14, fontWeight: '500', textAlign: 'center' },
    formCard: { width: '100%' },
    centerContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    stateIcon: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loadingText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        fontWeight: '500',
        marginTop: 16,
    },
    successTitle: {
        fontFamily: Fonts.display,
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    successText: {
        fontFamily: Fonts.body,
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 19,
    },
    errorTitle: {
        fontFamily: Fonts.display,
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    errorDesc: {
        fontFamily: Fonts.body,
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        lineHeight: 19,
    },
    errorContainer: {
        backgroundColor: 'rgba(192,85,79,0.08)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
    },
    errorText: { fontFamily: Fonts.body, fontSize: 13, fontWeight: '500' },
});
