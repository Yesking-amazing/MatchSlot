import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Calendar, Home, ShieldCheck, User } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View, useColorScheme } from 'react-native';

function ApprovalsIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    const { user } = useAuth();
    const [count, setCount] = useState(0);

    useFocusEffect(useCallback(() => {
        if (!user?.email) return;
        supabase
            .from('approvals')
            .select('id', { count: 'exact', head: true })
            .eq('approver_email', user.email.toLowerCase())
            .eq('status', 'PENDING')
            .then(({ count: cnt }) => setCount(cnt ?? 0));
    }, [user?.email]));

    return (
        <View>
            <ShieldCheck size={size} color={color} strokeWidth={focused ? 2.4 : 2} />
            {count > 0 && (
                <View style={[styles.badge, { backgroundColor: c.accent, borderColor: c.background }]}>
                    <Text style={[styles.badgeText, { color: c.accentInk }]}>{count > 9 ? '9+' : count}</Text>
                </View>
            )}
        </View>
    );
}

export default function TabLayout() {
    const scheme = useColorScheme() ?? 'light';
    const c = Colors[scheme];
    const { t } = useTranslation();

    const tint = scheme === 'dark' ? 'rgba(12,19,15,0.92)' : 'rgba(246,243,234,0.92)';

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: c.primary,
                tabBarInactiveTintColor: c.tabIconDefault,
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    borderTopColor: c.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    backgroundColor: Platform.OS === 'ios' ? 'transparent' : tint,
                    elevation: 0,
                },
                tabBarBackground: () => (
                    Platform.OS === 'ios'
                        ? <BlurView intensity={40} tint={scheme === 'dark' ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
                        : <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
                ),
                tabBarLabelStyle: {
                    fontFamily: Fonts.body,
                    fontWeight: '600',
                    fontSize: 11,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tabs.home'),
                    tabBarIcon: ({ color, focused }) => <Home size={22} color={color} strokeWidth={focused ? 2.4 : 2} />,
                }}
            />
            <Tabs.Screen
                name="manage"
                options={{
                    title: t('tabs.myMatches'),
                    tabBarIcon: ({ color, focused }) => <Calendar size={22} color={color} strokeWidth={focused ? 2.4 : 2} />,
                }}
            />
            <Tabs.Screen
                name="approvals"
                options={{
                    title: t('tabs.approvals'),
                    tabBarIcon: ({ color, focused }) => <ApprovalsIcon color={color} size={22} focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ color, focused }) => <User size={22} color={color} strokeWidth={focused ? 2.4 : 2} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute', top: -5, right: -9,
        borderRadius: 9, minWidth: 17, height: 17,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 4, borderWidth: 1.5,
    },
    badgeText: { fontFamily: Fonts.body, fontSize: 10, fontWeight: '800' },
});
