import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const Dot = ({ delay }: { delay: number }) => {
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

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export const TypingIndicator = () => {
  return (
    <View style={styles.container}>
      <Dot delay={0} />
      <Dot delay={200} />
      <Dot delay={400} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 18,
    alignSelf: 'flex-start',
    marginLeft: 24,
    marginBottom: 16,
    ...theme.shadow.card,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent.green,
  },
});
