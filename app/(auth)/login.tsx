import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function LoginScreen() {
    const { signIn, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setError(null);

        try {
            await signIn({ email: email.trim(), password });
            router.replace('/(tabs)');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to sign in');
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
                    <Text style={styles.title}>MatchSlot</Text>
                    <Text style={styles.subtitle}>Schedule matches effortlessly</Text>
                </View>

                <View style={styles.form}>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

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
                        placeholder="Enter your password"
                        secureTextEntry
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Button
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.button}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <Link href="/(auth)/register" asChild>
                            <Pressable>
                                <Text style={styles.linkText}>Sign up</Text>
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
        marginBottom: 48,
    },
    logoContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
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
        fontSize: 44,
    },
    title: {
        fontSize: 36,
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
