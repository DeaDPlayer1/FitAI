import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import ProgressRing from '@/components/ui/ProgressRingV2';

const { width: SCREEN_W } = Dimensions.get('window');

interface SmartPill {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  color?: string;
}

interface DynamicHeroProps {
  greeting: string;
  userName: string;
  aiMessage?: string;
  calorieValue?: number;
  calorieRemaining?: number;
  calorieGoal?: number;
  smartPills: SmartPill[];
  onAvatarPress?: () => void;
}

function GlowingOrb({ size, color, top, left, delay = 0 }: { size: number; color: string; top: number; left: number; delay?: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.orb,
        { width: size, height: size, borderRadius: size / 2, top, left, backgroundColor: color },
        animStyle,
      ]}
    />
  );
}

export function DynamicHero({
  greeting,
  userName,
  aiMessage,
  calorieValue = 0,
  calorieRemaining = 0,
  calorieGoal = 0,
  smartPills,
}: DynamicHeroProps) {
  const heroBaseHeight = 340;
  const calorieProgress = calorieGoal > 0 ? Math.min(calorieValue / calorieGoal, 1) : 0;

  return (
    <View style={{ height: heroBaseHeight }}>
      <LinearGradient
        colors={[theme.colors.gradient.hero[0], theme.colors.gradient.hero[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1.2 }}
        style={[styles.heroGradient, { height: heroBaseHeight }]}
      >
        <GlowingOrb size={180} color="rgba(255,255,255,0.06)" top={-40} left={-60} delay={0} />
        <GlowingOrb size={120} color="rgba(255,255,255,0.05)" top={80} left={SCREEN_W - 100} delay={800} />
        <GlowingOrb size={80} color="rgba(255,255,255,0.08)" top={200} left={40} delay={1600} />

        <View style={styles.curveOverlay} />

        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        </View>

        <View style={styles.mainRow}>
          <View style={styles.calorieSection}>
            <Text style={styles.calorieValue}>{calorieValue.toLocaleString()}</Text>
            <Text style={styles.calorieSub}>kcal consumed today</Text>
            <Text style={styles.calorieGoal}>Goal: {calorieGoal.toLocaleString()} kcal</Text>
          </View>
          <View style={styles.ringContainer}>
            <ProgressRing
              progress={calorieProgress}
              size={96}
              strokeWidth={10}
              color="#FFFFFF"
              trackColor="rgba(255,255,255,0.20)"
              centerLabel={calorieRemaining.toLocaleString()}
              centerSub="kcal left"
              duration={1500}
            />
          </View>
        </View>

        {aiMessage && (
          <View style={styles.aiRow}>
            <View style={styles.aiIconCircle}>
              <Feather name="zap" size={10} color="#FFFFFF" />
            </View>
            <Text style={styles.aiText} numberOfLines={1}>{aiMessage}</Text>
          </View>
        )}

        <View style={styles.pillsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
          >
            {smartPills.map((pill, i) => (
              <View key={i} style={[styles.smartPill, pill.color ? { borderColor: pill.color } : undefined]}>
                <Feather name={pill.icon} size={12} color={pill.color || 'rgba(255,255,255,0.85)'} />
                <Text style={styles.smartPillLabel}>{pill.label}</Text>
                <Text style={[styles.smartPillValue, pill.color ? { color: pill.color } : undefined]}>{pill.value}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  heroGradient: {
    width: '100%',
    paddingTop: (StatusBar.currentHeight || 44) + 8,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  curveOverlay: {
    position: 'absolute',
    bottom: -30,
    left: -10,
    right: -10,
    height: 60,
    backgroundColor: theme.colors.bg.primary,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  orb: { position: 'absolute' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    zIndex: 2,
  },
  greeting: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: theme.font.size.caption,
    fontWeight: '500',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: theme.font.size.h2,
    fontWeight: '800',
    marginTop: 2,
    fontFamily: theme.font.family.bold,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    marginBottom: 12,
  },
  calorieSection: { flex: 1 },
  calorieValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800',
    fontFamily: theme.font.family.heading,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  calorieSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: theme.font.size.body,
    fontWeight: '500',
    marginTop: 2,
  },
  calorieGoal: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: theme.font.size.caption,
    fontWeight: '500',
    marginTop: 2,
  },
  ringContainer: { marginLeft: 16 },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    zIndex: 2,
  },
  aiIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: theme.font.size.caption,
    fontWeight: '500',
    flex: 1,
  },
  pillsContainer: {
    zIndex: 3,
    marginLeft: -20,
    marginRight: -20,
    paddingBottom: 8,
  },
  smartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
  },
  smartPillLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: theme.font.size.micro,
    fontWeight: '500',
  },
  smartPillValue: {
    color: '#FFFFFF',
    fontSize: theme.font.size.micro,
    fontWeight: '700',
  },
});

export default DynamicHero;
