import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function RegisterScreen() {
    const { signUp, loading } = useAuth();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) { setError(t('auth.fillAllFields')); return; }
        if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
        if (password.length < 6) { setError(t('auth.passwordTooShort')); return; }
        setError(null);
        try {
            await signUp({ email: email.trim(), password, name: name.trim() });
            Alert.alert(t('auth.accountCreated'), t('auth.checkEmail'),
                [{ text: t('common.ok'), onPress: () => router.replace('/(auth)/login') }]);
        } catch (err: any) {
            setError(err.message || t('auth.failedCreateAccount'));
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                {/* Decorative orbs */}
                <View style={[styles.orb1, { backgroundColor: isDark ? 'rgba(27,139,78,0.22)' : 'rgba(27,139,78,0.10)' }]} />
                <View style={[styles.orb2, { backgroundColor: isDark ? 'rgba(34,197,94,0.16)' : 'rgba(34,197,94,0.07)' }]} />

                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>⚽</Text>
                    </View>
                    <Text style={[styles.title, { color: Colors[colorScheme].text }]}>{t('auth.createAccount')}</Text>
                    <Text style={[styles.subtitle, { color: Colors[colorScheme].textSecondary }]}>
                        {t('auth.joinMatchslot')}
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

                    <Input label={t('auth.name')} icon="person-outline" placeholder={t('auth.namePlaceholder')}
                        autoCapitalize="words" value={name} onChangeText={setName} />
                    <Input label={t('auth.email')} icon="mail-outline" placeholder={t('auth.emailPlaceholder')}
                        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                        value={email} onChangeText={setEmail} />
                    <Input label={t('auth.password')} icon="lock-closed-outline" placeholder={t('auth.createPasswordPlaceholder')}
                        secureTextEntry autoCapitalize="none" value={password} onChangeText={setPassword} />
                    <Input label={t('auth.confirmPassword')} icon="lock-closed-outline" placeholder={t('auth.confirmPasswordPlaceholder')}
                        secureTextEntry autoCapitalize="none" value={confirmPassword} onChangeText={setConfirmPassword} />

                    <Button title={t('auth.createAccount')} onPress={handleRegister} loading={loading} style={styles.button} />

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: Colors[colorScheme].textSecondary }]}>
                            {t('auth.hasAccount')}{' '}
                        </Text>
                        <Link href="/(auth)/login" asChild>
                            <Pressable>
                                <Text style={[styles.linkText, { color: Colors[colorScheme].primary }]}>{t('auth.signInLink')}</Text>
                            </Pressable>
                        </Link>
                    </View>
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
        marginBottom: 36,
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
        fontSize: 32,
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
    button: { marginTop: 12 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    footerText: { fontSize: 15 },
    linkText: { fontSize: 15, fontWeight: '700' },
});
