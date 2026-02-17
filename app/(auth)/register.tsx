import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
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
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setError(null);

        try {
            await signUp({ email: email.trim(), password, name: name.trim() });
            Alert.alert(
                'Account Created',
                'Please check your email to verify your account, then sign in.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(auth)/login'),
                    },
                ]
            );
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Failed to create account');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Decorative top glow */}
                <View style={styles.glowCircle} />

                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>⚽</Text>
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join MatchSlot today</Text>
                </View>

                <View style={styles.form}>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <Input
                        label="Name"
                        icon="person-outline"
                        placeholder="Enter your name"
                        autoCapitalize="words"
                        value={name}
                        onChangeText={setName}
                    />

                    <Input
                        label="Email"
                        icon="mail-outline"
                        placeholder="Enter your email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Input
                        label="Password"
                        icon="lock-closed-outline"
                        placeholder="Create a password"
                        secureTextEntry
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Input
                        label="Confirm Password"
                        icon="lock-closed-outline"
                        placeholder="Confirm your password"
                        secureTextEntry
                        autoCapitalize="none"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />

                    <Button
                        title="Create Account"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.button}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <Pressable>
                                <Text style={styles.linkText}>Sign in</Text>
                            </Pressable>
                        </Link>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    glowCircle: {
        position: 'absolute',
        top: -80,
        alignSelf: 'center',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.light.glow,
        opacity: 0.4,
    },
    header: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.light.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: Colors.light.primary,
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 8,
    },
    logo: {
        fontSize: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.light.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.textSecondary,
    },
    form: {
        width: '100%',
    },
    errorContainer: {
        backgroundColor: 'rgba(248,113,113,0.12)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(248,113,113,0.3)',
    },
    errorText: {
        color: Colors.light.error,
        fontSize: 14,
        textAlign: 'center',
    },
    button: {
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 28,
    },
    footerText: {
        color: Colors.light.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: Colors.light.primary,
        fontSize: 14,
        fontWeight: '700',
    },
});
