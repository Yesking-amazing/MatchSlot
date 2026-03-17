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
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="manage"
        options={{
          title: 'My Matches',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'football' : 'football-outline'} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
