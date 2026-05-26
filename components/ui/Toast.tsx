import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ToastData {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface ToastContextType {
  showToast: (message: string, icon?: keyof typeof Ionicons.glyphMap) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((message: string, icon?: keyof typeof Ionicons.glyphMap) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, icon });
    timerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <ToastView toast={toast} />}
    </ToastContext.Provider>
  );
}

function ToastView({ toast }: { toast: ToastData }) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#FFFFFFEE' : '#0F2818EE';
  const fg = isDark ? '#0F2818' : '#FFFFFF';

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.wrapper}
      pointerEvents="none"
    >
      <View style={[styles.pill, { backgroundColor: bg }]}>
        {toast.icon && (
          <Ionicons name={toast.icon} size={16} color={fg} />
        )}
        <Text style={[styles.text, { color: fg }]}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 108,
    alignItems: 'center',
    zIndex: 1000,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 10,
  },
  text: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
