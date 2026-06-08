/**
 * PulseDot — Pulsing colored dot for "active" or "live" states.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface PulseDotProps {
  color?: string;
  size?: number;
  ringSize?: number;
  style?: ViewStyle;
  pulse?: boolean;
}

export function PulseDot({
  color = theme.colors.success,
  size = 8,
  ringSize = 18,
  style,
  pulse = true,
}: PulseDotProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (!pulse) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(2.2, { duration: 1500 }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1500 }),
        withTiming(0.6, { duration: 0 })
      ),
      -1,
      false
    );
  }, [pulse, scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[{ width: ringSize, height: ringSize }, styles.container, style]}>
      <Animated.View
        style={[
          styles.ring,
          {
            backgroundColor: color,
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
          },
          ringStyle,
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  dot: {},
});

export default PulseDot;
