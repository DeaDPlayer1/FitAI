import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import ProgressRing from '@/components/ui/ProgressRingV2';

const { width: SCREEN_W } = Dimensions.get('window');

interface StatChip {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  color: string;
}

interface EnergyRingCardProps {
  consumed: number;
  remaining: number;
  progress: number;
  stats: StatChip[];
}

function PulseArc() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [pulse]);
  const anim = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.1, 0.3]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.04]) }],
  }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 999, borderWidth: 2, borderColor: theme.colors.primary }, anim]} />
  );
}

export function EnergyRingCard({ consumed, remaining, progress, stats }: EnergyRingCardProps) {
  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.ringSection}>
        <View style={styles.ringWrapper}>
          <PulseArc />
          <ProgressRing
            progress={progress}
            size={130}
            strokeWidth={12}
            color={theme.colors.primary}
            trackColor={theme.colors.primarySoft}
            duration={1500}
          >
            <View style={styles.ringCenter}>
              <Text style={[styles.ringKcal, remaining < 0 && { color: '#FF6B6B' }]}>{remaining.toLocaleString()}</Text>
              <Text style={styles.ringSub}>{remaining < 0 ? 'kcal over' : 'kcal left'}</Text>
            </View>
          </ProgressRing>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <View key={i} style={styles.statChip}>
            <View style={[styles.statIconBg, { backgroundColor: stat.color + '18' }]}>
              <Feather name={stat.icon} size={12} color={stat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: theme.radius.xl,
    padding: 22,
    marginHorizontal: 20,
    marginTop: -12,
    gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  ringSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringWrapper: {
    position: 'relative',
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    alignItems: 'center',
  },
  ringKcal: {
    fontSize: 36,
    fontWeight: '800',
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  ringSub: {
    fontSize: theme.font.size.micro,
    fontWeight: '600',
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statsGrid: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.muted,
  },
  statValue: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

export default EnergyRingCard;
