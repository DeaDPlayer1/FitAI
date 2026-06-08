import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, interpolate, Easing } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface AIFitnessStatusProps {
  insight: string;
  trend?: 'up' | 'down' | 'stable';
  trendLabel?: string;
  onUpdateGoals?: () => void;
  onAskCoach?: () => void;
  onAdjustProgram?: () => void;
}

function AIOrb() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, [pulse]);
  const glow = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.15]) }],
  }));
  const core = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 0.5, 1], [0.8, 1, 0.8]),
  }));
  return (
    <View style={styles.orbWrap}>
      <Animated.View style={[styles.orbGlow, glow]} />
      <Animated.View style={[styles.orbCore, core]}>
        <Feather name="cpu" size={22} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

export function AIFitnessStatus({
  insight, trend, trendLabel,
  onUpdateGoals, onAskCoach, onAdjustProgram,
}: AIFitnessStatusProps) {
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus';
  const trendColor = trend === 'up' ? theme.colors.success : trend === 'down' ? theme.colors.warning : theme.colors.text.muted;

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F7FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.top}>
        <AIOrb />
        <View style={styles.content}>
          <Text style={styles.title}>AI Fitness Status</Text>
          <Text style={styles.insight}>{insight}</Text>
          {trendLabel && (
            <View style={styles.trendRow}>
              <Feather name={trendIcon} size={14} color={trendColor} />
              <Text style={[styles.trendLabel, { color: trendColor }]}>{trendLabel}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {onUpdateGoals && (
          <TouchableOpacity style={styles.actionBtn} onPress={onUpdateGoals} activeOpacity={0.7}>
            <Feather name="target" size={14} color={theme.colors.primary} />
            <Text style={styles.actionText}>Update Goals</Text>
          </TouchableOpacity>
        )}
        {onAskCoach && (
          <TouchableOpacity style={styles.actionBtn} onPress={onAskCoach} activeOpacity={0.7}>
            <Feather name="message-circle" size={14} color={theme.colors.primary} />
            <Text style={styles.actionText}>Ask Coach</Text>
          </TouchableOpacity>
        )}
        {onAdjustProgram && (
          <TouchableOpacity style={styles.actionBtn} onPress={onAdjustProgram} activeOpacity={0.7}>
            <Feather name="sliders" size={14} color={theme.colors.primary} />
            <Text style={styles.actionText}>Adjust Program</Text>
          </TouchableOpacity>
        )}
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
  },
  top: {
    flexDirection: 'row',
    gap: 14,
  },
  orbWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryGlow,
  },
  orbCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: theme.font.size.caption,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  insight: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendLabel: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  actionText: {
    fontSize: theme.font.size.micro,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

export default AIFitnessStatus;
