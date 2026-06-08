import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, interpolate, Easing, FadeInDown } from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import { useGlowPulse, useBreathing } from '@/lib/animations';
import AvatarCircle from '@/components/ui/AvatarCircle';

let BlurView: any = null;
if (Platform.OS === 'ios') {
  BlurView = require('expo-blur').BlurView;
}

interface ProfileHeroProps {
  name: string;
  avatarUrl?: string | null;
  goal?: string | null;
  fitnessMode?: string;
  currentWeek?: number;
  totalWeeks?: number;
  motivationalSubtitle?: string;

  onAvatarPress?: () => void;
}

function GlowOrb({ delay = 0, size = 120, color = 'rgba(106,73,250,0.3)' }) {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 + delay, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000 + delay, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 1], [0.15, 0.35]),
    transform: [
      { translateX: interpolate(anim.value, [0, 1], [-10, 10]) },
      { translateY: interpolate(anim.value, [0, 1], [-8, 8]) },
      { scale: interpolate(anim.value, [0, 1], [1, 1.08]) },
    ],
  }));
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

function AvatarGlow() {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);
  const ring1 = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.25, 0.5]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.15]) }],
  }));
  const ring2 = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.1, 0.3]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1.1, 1.3]) }],
  }));
  return (
    <>
      <Animated.View style={[styles.avatarRing, ring1]} />
      <Animated.View style={[styles.avatarRingOuter, ring2]} />
    </>
  );
}

export function ProfileHero({
  name, avatarUrl, goal, fitnessMode, currentWeek = 1, totalWeeks = 12,
  motivationalSubtitle, onAvatarPress,
}: ProfileHeroProps) {
  const goalLabel = goal?.replace(/_/g, ' ') || 'Building consistency';
  const subtitle = motivationalSubtitle || 'Ready for today\'s session?';

  const headerChildren = (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.primaryDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1.3 }}
      style={styles.container}
    >
      <GlowOrb delay={0} size={160} color="rgba(106,73,250,0.25)" />
      <GlowOrb delay={1000} size={100} color="rgba(198,230,255,0.15)" />
      <GlowOrb delay={2000} size={80} color="rgba(254,218,218,0.12)" />

      <Animated.View entering={FadeInDown.duration(400)} style={styles.topRow}>
        <View style={{ flex: 1 }} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.85} style={styles.avatarWrap}>
          <AvatarGlow />
          <AvatarCircle
            name={name}
            uri={avatarUrl}
            size={80}
            variant="glass"
            borderColor="rgba(255,255,255,0.55)"
          />
          <View style={styles.activeDot} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(180).duration(400)} style={styles.name}>
        {name || 'User'}
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(240).duration(400)} style={styles.goalBadge}>
        <Feather name="target" size={12} color="rgba(255,255,255,0.85)" />
        <Text style={styles.goalText}>{goalLabel}</Text>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(300).duration(400)} style={styles.subtitle}>
        {subtitle}
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(340).duration(400)} style={styles.programRow}>
        <Feather name="calendar" size={12} color="rgba(255,255,255,0.65)" />
        <Text style={styles.programText}>
          {fitnessMode ? `${fitnessMode} mode` : 'AI Trainer'} · Week {currentWeek}/{totalWeeks}
        </Text>
      </Animated.View>
    </LinearGradient>
  );

  if (Platform.OS === 'ios' && BlurView) {
    return (
      <View style={{ position: 'relative' }}>
        {headerChildren}
        <BlurView intensity={8} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>
    );
  }

  return headerChildren;
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarRingOuter: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: theme.font.family.heading,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    marginBottom: 6,
  },
  goalText: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.90)',
    textTransform: 'capitalize',
  },
  subtitle: {
    fontSize: theme.font.size.body,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    marginBottom: 8,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  programText: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.60)',
    textTransform: 'capitalize',
  },
});

export default ProfileHero;
