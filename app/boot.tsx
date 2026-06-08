import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/constants/theme';

function Dot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(
      withSequence(withTiming(-6, { duration: 300 }), withTiming(0, { duration: 300 })),
      -1, true
    ));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  return <Animated.View style={[styles.dot, style]} />;
}

export default function BootScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const fadeOut = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      fadeOut.value = withTiming(1, { duration: 300 });
      setTimeout(() => {
        const mode = user?.app_mode || 'normal';
        router.replace(mode === 'ai_trainer' ? '/(ai-trainer)' : '/(tabs)');
      }, 350);
    }, 1800);
    return () => clearTimeout(timer);
  }, [user?.app_mode]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: 1 - fadeOut.value,
  }));

  return (
    <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={styles.container}>
      <Animated.View style={[styles.content, containerStyle]}>
        <Text style={styles.loadingText}>Reading your profile...</Text>
        <View style={styles.dots}>
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12, color: '#C4B5FD', letterSpacing: 1,
    marginBottom: 16, textTransform: 'uppercase',
  },
  dots: {
    flexDirection: 'row', gap: 6,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.colors.accent.primary,
  },
});
