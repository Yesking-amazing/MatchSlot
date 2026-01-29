import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// FIXED: Corrected URL to match the anon key (sjc not vjc)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ijmjjzcroxkbsjcmztgd.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbWpqemNyb3hrYnNqY216dGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDk3NDMsImV4cCI6MjA4NDYyNTc0M30.aYRu7p5RQRkCerLnwao6MTSeNbHnSeV8YXQQQcpGDMw';

// Log the configuration for debugging
console.log('🔧 Supabase Config:', {
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey.substring(0, 20) + '...',
});

// Platform-safe storage adapter (handles SSR where window is undefined)
const createStorage = () => {
  // During SSR or when window is not available, use a no-op storage
  if (typeof window === 'undefined') {
    return {
      getItem: (_key: string) => Promise.resolve(null),
      setItem: (_key: string, _value: string) => Promise.resolve(),
      removeItem: (_key: string) => Promise.resolve(),
    };
  }

  // Web platform: use localStorage
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }

  // Native platforms: use AsyncStorage (lazy import to avoid SSR issues)
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-client-info': 'matchslot-app',
    },
  },
});

