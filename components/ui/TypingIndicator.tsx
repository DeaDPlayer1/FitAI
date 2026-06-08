import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';

const Dot = ({ delay, color }: { delay: number; color: string }) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    translateY.value = withDelay(delay, withRepeat(withSequence(withTiming(-6, { duration: 500 }), withTiming(0, { duration: 500 })), -1, true));
    scale.value = withDelay(delay, withRepeat(withSequence(withTiming(1.3, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true));
    opacity.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0.4, { duration: 500 })), -1, true));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, animatedStyle]} />;
};

interface TypingIndicatorProps {
  dotColor?: string;
}

export const TypingIndicator = ({ dotColor = '#10B981' }: TypingIndicatorProps) => {
  return (
    <View style={styles.container}>
      <Dot delay={0} color={dotColor} />
      <Dot delay={200} color={dotColor} />
      <Dot delay={400} color={dotColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
