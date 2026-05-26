import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import '@/lib/i18n';

import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { addNotificationResponseListener, registerForPushNotifications, sendPushToUser } from '@/lib/notifications';
import { isOnboardingComplete } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function useProtectedRoute(user: any, loading: boolean, resettingPassword: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Public routes that don't require authentication
    const isPublicRoute = segments[0] === 'offer' || segments[0] === 'approve' || segments[0] === 'reset-password';
    const isOnboarding = segments[0] === 'onboarding';

    if (!user && !inAuthGroup && !isPublicRoute) {
      // Redirect to login if not authenticated and not on auth or public screen
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup && !resettingPassword && !isOnboarding) {
      // Redirect to main app if authenticated but on auth screen
      // Skip redirect if user is in the middle of resetting their password
      router.replace('/(tabs)');
    }
  }, [user, segments, loading, resettingPassword]);
}

function RootLayoutNav() {
  const colorScheme = useColorScheme() ?? 'light';
  const { user, loading, resettingPassword } = useAuth();

  useProtectedRoute(user, loading, resettingPassword);

  const router = useRouter();

  // Register push token + check onboarding on login
  useEffect(() => {
    if (!user || loading) return;
    registerForPushNotifications(user.id);
    // Small delay to let navigation settle before redirecting
    const timer = setTimeout(() => {
      isOnboardingComplete(user.id).then(done => {
        if (!done) router.replace('/onboarding' as any);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [user?.id, loading]);

  // Handle notification action responses (attendance Yes/No)
  useEffect(() => {
    const sub = addNotificationResponseListener(async (response: any) => {
      const actionId = response?.actionIdentifier;
      const data = response?.notification?.request?.content?.data;
      if (!data || data.type !== 'attendance_check') return;

      const slotId = data.slotId;
      if (!slotId) return;

      // Look up the slot to find the host
      const { data: slot } = await supabase.from('slots').select('match_offer_id, guest_club').eq('id', slotId).single();
      if (!slot) return;
      const { data: offer } = await supabase.from('match_offers').select('created_by, age_group, format').eq('id', slot.match_offer_id).single();
      if (!offer?.created_by) return;

      if (actionId === 'CONFIRM_YES') {
        await sendPushToUser(offer.created_by, 'Attendance Confirmed ✅', `${slot.guest_club || 'Your opponent'} confirmed they're coming to the ${offer.age_group} ${offer.format} match.`);
      } else if (actionId === 'CONFIRM_NO') {
        await sendPushToUser(offer.created_by, 'Attendance Cancelled ❌', `${slot.guest_club || 'Your opponent'} can\'t make it to the ${offer.age_group} ${offer.format} match.`);
      }
    });
    return () => sub?.remove();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme].primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, headerBackTitle: 'Back' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

