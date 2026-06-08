import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface HydrationRecoveryProps {
  current: number;
  goal: number;
  onAdd: () => void;
}

function WaveBackground({ progress }: { progress: number }) {
  const waveY = useSharedValue(0);
  useEffect(() => {
    waveY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [waveY]);

  const animStyle = useAnimatedStyle(() => ({
    height: interpolate(progress, [0, 1], [10, 100]),
    transform: [{ translateY: interpolate(waveY.value, [0, 1], [0, -4]) }],
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          bottom: 0,
          backgroundColor: 'rgba(96,165,250,0.12)',
          borderRadius: theme.radius.xl,
          overflow: 'hidden',
        },
        animStyle,
      ]}
    />
  );
}

export function HydrationRecovery({ current, goal, onAdd }: HydrationRecoveryProps) {
  const progress = goal > 0 ? Math.min(current / goal, 1) : 0;
  const ringProgress = useSharedValue(0);

  useEffect(() => {
    ringProgress.value = withTiming(progress, { duration: 1200, easing: Easing.out(Easing.quad) });
  }, [progress, ringProgress]);

  const fillPct = Math.round(progress * 100);

  return (
    <LinearGradient
      colors={['#F0F9FF', '#E0F2FE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBg}>
            <Feather name="droplet" size={16} color="#3B82F6" />
          </View>
          <View>
            <Text style={styles.title}>Hydration</Text>
            <Text style={styles.sub}>Recovery fueling</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.7}>
          <Feather name="plus" size={16} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.progressSection}>
          <View style={styles.ring}>
            <Text style={styles.value}>{current}</Text>
            <Text style={styles.unit}>glasses</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressFill, { width: `${fillPct}%` }]} />
          </View>
          <Text style={styles.goalText}>Goal: {goal} glasses</Text>
        </View>

        <TouchableOpacity style={styles.quickAdd} onPress={onAdd} activeOpacity={0.7}>
          <Feather name="plus-circle" size={18} color="#3B82F6" />
          <Text style={styles.quickAddText}>Add glass</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    padding: 18,
    marginHorizontal: 20,
    ...theme.shadow.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  sub: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressSection: {
    flex: 1,
  },
  ring: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.25)',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
  },
  unit: {
    fontSize: 8,
    fontWeight: '600',
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: -2,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  goalText: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  quickAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59,130,246,0.10)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
  },
  quickAddText: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    color: '#3B82F6',
  },
});

export default HydrationRecovery;
