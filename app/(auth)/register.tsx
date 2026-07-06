import { Monogram } from '@/components/ui/Brandmark';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { Link, router } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
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
    const c = Colors[colorScheme];

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
            style={[styles.container, { backgroundColor: c.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                <View style={styles.header}>
                    <Monogram size={56} />
                    <Text style={[styles.title, { color: c.text }]}>{t('auth.createAccount')}</Text>
                    <Text style={[styles.subtitle, { color: c.textMuted }]}>
                        {t('auth.joinMatchslot')}
                    </Text>
                </View>

                <Card padding={20} style={styles.formCard}>
                    {error && (
                        <View style={[styles.errorContainer, { borderColor: c.errorBorder }]}>
                            <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
                        </View>
                    )}

                    <Input label={t('auth.name')} icon={<User size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.namePlaceholder')}
                        autoCapitalize="words" value={name} onChangeText={setName} />
                    <Input label={t('auth.email')} icon={<Mail size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.emailPlaceholder')}
                        keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                        value={email} onChangeText={setEmail} />
                    <Input label={t('auth.password')} icon={<Lock size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.createPasswordPlaceholder')}
                        secureTextEntry autoCapitalize="none" value={password} onChangeText={setPassword} />
                    <Input label={t('auth.confirmPassword')} icon={<Lock size={17} color={c.textMuted} strokeWidth={2} />} placeholder={t('auth.confirmPasswordPlaceholder')}
                        secureTextEntry autoCapitalize="none" value={confirmPassword} onChangeText={setConfirmPassword} />

                    <Button title={t('auth.createAccount')} onPress={handleRegister} loading={loading} style={styles.button} />

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: c.textMuted }]}>
                            {t('auth.hasAccount')}{' '}
                        </Text>
                        <Link href="/(auth)/login" asChild>
                            <Pressable>
                                <Text style={[styles.linkText, { color: c.primary }]}>{t('auth.signInLink')}</Text>
                            </Pressable>
                        </Link>
                    </View>
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
        marginBottom: 28,
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
    button: { marginTop: 14 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    footerText: { fontFamily: Fonts.body, fontSize: 13.5, fontWeight: '500' },
    linkText: { fontFamily: Fonts.body, fontSize: 13.5, fontWeight: '700' },
});
