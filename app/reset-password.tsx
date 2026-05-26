import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { updatePassword } from '@/lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
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
    const isDark = colorScheme === 'dark';
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
            style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={[styles.orb1, { backgroundColor: isDark ? 'rgba(27,139,78,0.22)' : 'rgba(27,139,78,0.10)' }]} />
                <View style={[styles.orb2, { backgroundColor: isDark ? 'rgba(34,197,94,0.16)' : 'rgba(34,197,94,0.07)' }]} />

                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="key-outline" size={40} color="#fff" />
                    </View>
                    <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{t('auth.resetPassword')}</Text>
                    <Text style={[styles.subtitle, { color: Colors[colorScheme].textSecondary }]}>
                        {t('auth.enterNewPassword')}
                    </Text>
                </View>

                <View style={[styles.formCard, {
                    backgroundColor: Colors[colorScheme].card,
                    shadowColor: isDark ? '#000' : 'rgba(27,139,78,0.15)',
                }]}>
                    {loading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
                            <Text style={[styles.loadingText, { color: Colors[colorScheme].textSecondary }]}>
                                {t('auth.verifyingLink')}
                            </Text>
                        </View>
                    ) : success ? (
                        <View style={styles.centerContent}>
                            <Ionicons name="checkmark-circle" size={64} color={Colors[colorScheme].primary} />
                            <Text style={[styles.successTitle, { color: Colors[colorScheme].text }]}>
                                {t('auth.passwordUpdated')}
                            </Text>
                            <Text style={[styles.successText, { color: Colors[colorScheme].textSecondary }]}>
                                {t('auth.passwordResetSuccess')}
                            </Text>
                        </View>
                    ) : !sessionReady ? (
                        <View style={styles.centerContent}>
                            <Ionicons name="alert-circle-outline" size={64} color={Colors[colorScheme].error} />
                            <Text style={[styles.errorTitle, { color: Colors[colorScheme].text }]}>
                                {t('auth.linkExpired')}
                            </Text>
                            <Text style={[styles.errorDesc, { color: Colors[colorScheme].textSecondary }]}>
                                {error || t('auth.linkExpiredDesc')}
                            </Text>
                        </View>
                    ) : (
                        <>
                            {error && (
                                <View style={styles.errorContainer}>
                                    <Text style={[styles.errorText, { color: Colors[colorScheme].error }]}>{error}</Text>
                                </View>
                            )}

                            <Input
                                label={t('auth.newPassword')}
                                icon="lock-closed-outline"
                                placeholder={t('auth.newPasswordPlaceholder')}
                                secureTextEntry
                                autoCapitalize="none"
                                value={password}
                                onChangeText={setPassword}
                            />

                            <Input
                                label={t('auth.confirmPassword')}
                                icon="lock-closed-outline"
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
                                style={{ marginTop: 16 }}
                            />
                        </>
                    )}
                </View>
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
    iconContainer: {
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
    title: {
        fontSize: 30,
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
    centerContent: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    loadingText: {
        fontSize: 15,
        marginTop: 16,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    successText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    errorDesc: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
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
});
