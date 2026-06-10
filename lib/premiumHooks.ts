import { useCallback, useRef } from 'react';
import {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withSequence, Easing, runOnJS, type WithSpringConfig,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const springConfig: WithSpringConfig = { damping: 12, stiffness: 200, mass: 0.8 };
const softSpring: WithSpringConfig = { damping: 16, stiffness: 140, mass: 1 };
const bounceSpring: WithSpringConfig = { damping: 8, stiffness: 220, mass: 0.6 };

export function useScaleOnPress(initial = 1, config = springConfig) {
  const scale = useSharedValue(initial);
  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.94, config);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [scale, config]);
  const onPressOut = useCallback(() => {
    scale.value = withSpring(initial, config);
  }, [scale, initial, config]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return { animatedStyle, onPressIn, onPressOut, scale };
}

export function useHapticTap() {
  return useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
}

export function useHapticHeavy() {
  return useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
}

export function useHapticSuccess() {
  return useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
}

export function useAnimatedGlow(active = false) {
  const opacity = useSharedValue(active ? 1 : 0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 300 }),
  }));
  const setActive = useCallback((v: boolean) => {
    opacity.value = v ? 1 : 0;
  }, [opacity]);
  return { animatedStyle, setActive };
}

export function usePulseAnimation() {
  const pulse = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: withSpring(pulse.value < 1.05 ? 0.8 : 1),
  }));
  const startPulse = useCallback(() => {
    pulse.value = withSequence(
      withSpring(1.06, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 8, stiffness: 100 }),
    );
  }, [pulse]);
  const loopPulse = useCallback(() => {
    pulse.value = withSequence(
      withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
    );
  }, [pulse]);
  return { animatedStyle, startPulse, loopPulse };
}

export function useSlideInUp(delay = 0) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 400, easing: Easing.out(Easing.ease) }),
    transform: [{ translateY: withSpring(translateY.value, { damping: 16, stiffness: 120 }) }],
  }));
  const animateIn = useCallback(() => {
    setTimeout(() => {
      translateY.value = 0;
      opacity.value = 1;
    }, delay);
  }, [translateY, opacity, delay]);
  return { animatedStyle, animateIn };
}

export function useFadeIn(delay = 0) {
  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 400, easing: Easing.out(Easing.ease) }),
  }));
  const animateIn = useCallback(() => {
    setTimeout(() => { opacity.value = 1; }, delay);
  }, [opacity, delay]);
  return { animatedStyle, animateIn };
}

export function useCountUp(target: number, duration = 600) {
  const value = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 300 }),
  }));
  const animate = useCallback(() => {
    value.value = withTiming(target, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, target, duration]);
  return { value, animatedStyle, animate };
}

export function useStaggerAnimation(count: number, baseDelay = 80) {
  const items = Array.from({ length: count }, (_, i) => {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(30);
    return { opacity, translateY, index: i };
  });
  const animateAll = useCallback(() => {
    items.forEach((item) => {
      setTimeout(() => {
        item.opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
        item.translateY.value = withSpring(0, { damping: 15, stiffness: 120 });
      }, baseDelay * item.index);
    });
  }, [items, baseDelay]);
  const animatedStyles = items.map((item) =>
    useAnimatedStyle(() => ({
      opacity: item.opacity.value,
      transform: [{ translateY: item.translateY.value }],
    }))
  );
  return { animatedStyles, animateAll };
}

export function useShimmer() {
  const translateX = useSharedValue(-200);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const startShimmer = useCallback(() => {
    translateX.value = withTiming(400, { duration: 1200, easing: Easing.linear });
  }, [translateX]);
  return { animatedStyle, startShimmer };
}
