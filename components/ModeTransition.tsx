import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  targetMode: 'normal' | 'ai_trainer';
  onMidpoint?: () => Promise<void>;
  onComplete?: () => void;
}

function Dot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

export default function ModeTransition({ visible, targetMode, onMidpoint, onComplete }: Props) {
  const overlayOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);

  const isAi = targetMode === 'ai_trainer';
  const lime = '#C8FF00';

  useEffect(() => {
    if (!visible) {
      overlayOpacity.value = 0;
      iconScale.value = 0;
      textOpacity.value = 0;
      return;
    }

    const run = async () => {
      overlayOpacity.value = withTiming(1, { duration: 400, easing: Easing.in(Easing.ease) });

      await delay(400);
      iconScale.value = withSpring(1, { damping: 14, stiffness: 180 });

      await delay(200);
      textOpacity.value = withTiming(1, { duration: 250 });

      await delay(400);
      dotsOpacity.value = withTiming(1, { duration: 200 });
      await delay(200);
      if (onMidpoint) await onMidpoint();

      await delay(300);
      if (onComplete) onComplete();
    };
    run();
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: withTiming(textOpacity.value * 12, { duration: 250 }) }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]} pointerEvents="auto">
      <Animated.View style={[styles.iconCircle, iconStyle]}>
        <Feather
          name={isAi ? 'zap' : 'grid'}
          size={24}
          color={isAi ? '#0A0A0A' : '#F5F5F5'}
        />
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={[styles.modeText, { color: isAi ? lime : '#F5F5F5' }]}>
          {isAi ? 'Switching to AI Trainer Mode' : 'Switching to Normal Mode'}
        </Text>
        <View style={styles.dotsRow}>
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#C8FF00',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  modeText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
});
