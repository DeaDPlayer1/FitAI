import React, { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing, runOnJS } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from './GlassCard';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextShape {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextShape | null>(null);

const ICON: Record<ToastType, string> = {
  success: 'check',
  error: 'x',
  info: 'info',
  warning: 'alert-triangle',
};

const COLOR: Record<ToastType, string> = {
  success: theme.colors.accent.green,
  error: theme.colors.danger,
  info: theme.colors.info,
  warning: theme.colors.warning,
};

const ToastView = memo(({ message, type }: { message: string; type: ToastType }) => (
  <GlassCard variant="compact" style={styles.toast}>
    <Feather name={ICON[type] as any} size={16} color={COLOR[type]} />
    <Text style={styles.text}>{message}</Text>
  </GlassCard>
));

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastProps | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    setToast({ message, type, duration });

    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });

    hideTimer.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
      translateY.value = withTiming(16, { duration: 220, easing: Easing.out(Easing.cubic) }, () => {
        runOnJS(setToast)(null);
      });
    }, duration);
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const value = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View style={[styles.wrap, { bottom: insets.bottom + 80 }, animatedStyle]}>
          <ToastView message={toast.message} type={toast.type} />
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default ToastView;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 24, right: 24 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { color: theme.colors.text.primary, fontSize: 14, flex: 1 },
});
