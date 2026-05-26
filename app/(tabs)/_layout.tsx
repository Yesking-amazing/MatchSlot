import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

function ApprovalsBadgeIcon({ color, focused }: { color: string; focused: boolean }) {
    const { user } = useAuth();
    const [count, setCount] = useState(0);

    useFocusEffect(useCallback(() => {
        if (!user?.email) return;
        supabase
            .from('approvals')
            .select('id', { count: 'exact', head: true })
            .eq('approver_email', user.email.toLowerCase())
            .eq('status', 'PENDING')
            .then(({ count: c }) => setCount(c ?? 0));
    }, [user?.email]));

    return (
        <View>
            <Ionicons name={focused ? 'shield-checkmark' : 'shield-checkmark-outline'} size={24} color={color} />
            {count > 0 && (
                <View style={badgeStyle.badge}>
                    <Text style={badgeStyle.text}>{count > 9 ? '9+' : count}</Text>
                </View>
            )}
        </View>
    );
}

const badgeStyle = StyleSheet.create({
    badge: {
        position: 'absolute', top: -4, right: -8,
        backgroundColor: '#EF4444', borderRadius: 8,
        minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 3,
    },
    text: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

export default function TabLayout() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { t } = useTranslation();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.tabIconDefault,
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: colorScheme === 'dark'
                        ? 'rgba(10,31,18,0.95)'
                        : 'rgba(255,255,255,0.95)',
                    borderTopColor: theme.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    elevation: 0,
                },
                tabBarBackground: () => (
                    <View style={[StyleSheet.absoluteFill, {
                        backgroundColor: colorScheme === 'dark'
                            ? 'rgba(10,31,18,0.95)'
                            : 'rgba(255,255,255,0.95)',
                    }]} />
                ),
                tabBarLabelStyle: {
                    fontWeight: '500',
                    fontSize: 12,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: t('tabs.home'),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="manage"
                options={{
                    title: t('tabs.myMatches'),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'football' : 'football-outline'} size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="approvals"
                options={{
                    title: t('tabs.approvals'),
                    tabBarIcon: ({ color, focused }) => (
                        <ApprovalsBadgeIcon color={color} focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: t('tabs.profile'),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
