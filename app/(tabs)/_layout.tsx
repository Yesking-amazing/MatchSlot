import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colorScheme === 'dark'
            ? 'rgba(10,31,18,0.95)'
            : 'rgba(255,255,255,0.95)',
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          marginHorizontal: 18,
          borderRadius: 24,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, {
            backgroundColor: colorScheme === 'dark'
              ? 'rgba(10,31,18,0.95)'
              : 'rgba(255,255,255,0.95)',
            borderRadius: 24,
            shadowColor: colorScheme === 'dark' ? '#000' : 'rgba(26,46,26,0.12)',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 1,
            shadowRadius: 36,
            elevation: 8,
          }]} />
        ),
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: 10.5,
        },
        tabBarItemStyle: {
          borderRadius: 16,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'football' : 'football-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
