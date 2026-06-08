import { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence,
  interpolate, Easing, FadeInDown, FadeInUp, SlideInRight,
  ZoomIn, LightSpeedInRight,
} from 'react-native-reanimated';

// ── Entrance Presets ──

export const StaggerFade = (index: number, baseDelay = 80) =>
  FadeInDown.delay(index * baseDelay)
    .duration(400)
    .easing(Easing.out(Easing.quad));

export const StaggerSlide = (index: number, baseDelay = 60) =>
  SlideInRight.delay(index * baseDelay)
    .duration(350)
    .easing(Easing.out(Easing.quad));

export const StaggerZoom = (index: number, baseDelay = 100) =>
  ZoomIn.delay(index * baseDelay)
    .duration(300)
    .springify()
    .damping(14);

// ── Value Animations ──

export function useCountUp(toValue: number, duration = 800, enabled = true) {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!enabled) { progress.value = 1; return; }
    progress.value = 0;
    progress.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [toValue, duration, enabled]);

  return useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [0, 1]),
  }));
}

export function usePulse(duration = 2000, min = 0.85, max = 1) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(max, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(min, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}

export function useBreathing(duration = 3000) {
  const opacity = useSharedValue(0.6);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.6, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

export function useShimmer(enabled = true) {
  const translateX = useSharedValue(-1);
  useEffect(() => {
    if (!enabled) return;
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );
  }, [enabled]);
  return useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(translateX.value, [-1, 1], [-120, 120]),
    }],
  }));
}

// ── Spring press feedback ──

export function pressSpring() {
  return withSpring(0.94, { damping: 12, stiffness: 200, mass: 0.5 });
}

export function releaseSpring() {
  return withSpring(1, { damping: 10, stiffness: 150 });
}

// ── Glow pulse for avatar / badges ──

export function useGlowPulse(color = 'rgba(106,73,250,0.4)', duration = 2500) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);
  const glow = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.7]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.12]) }],
  }));
  return glow;
}

// ── Confirmation wave ──

export function useConfirmationWave() {
  const wave = useSharedValue(0);
  const trigger = () => {
    wave.value = 0;
    wave.value = withSequence(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 600, easing: Easing.inOut(Easing.sin) }),
    );
  };
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(wave.value, [0, 0.3, 1], [0, 1, 0]),
    transform: [
      { scale: interpolate(wave.value, [0, 1], [0.8, 1.3]) },
    ],
  }));
  return { trigger, style };
}
