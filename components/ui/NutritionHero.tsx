import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface NutritionHeroProps {
  dateLabel: string;
  aiMessage?: string;
}

function GlowOrb({ size, top, left, delay = 0 }: { size: number; top: number; left: number; delay?: number }) {
  const opacity = useSharedValue(0.2);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.2, { duration: 3000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [delay, opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, top, left, backgroundColor: 'rgba(255,255,255,0.06)' }, anim]} />;
}

export function NutritionHero({ dateLabel, aiMessage }: NutritionHeroProps) {
  return (
    <View style={{ height: 240 }}>
      <LinearGradient
        colors={[theme.colors.gradient.hero[0], theme.colors.gradient.hero[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1.2 }}
        style={styles.gradient}
      >
        <GlowOrb size={160} top={-30} left={-50} delay={0} />
        <GlowOrb size={100} top={60} left={SCREEN_W - 100} delay={600} />
        <GlowOrb size={70} top={140} left={30} delay={1200} />

        <View style={styles.curveOverlay} />

        <View style={styles.topRow}>
          <View>
            <Text style={styles.title}>Nutrition</Text>
            <Text style={styles.date}>{dateLabel}</Text>
          </View>
        </View>

        {aiMessage && (
          <View style={styles.aiRow}>
            <View style={styles.aiIcon}>
              <Feather name="zap" size={10} color="#FFFFFF" />
            </View>
            <Text style={styles.aiText} numberOfLines={1}>{aiMessage}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    height: 240,
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    fontFamily: theme.font.family.bold,
    color: '#FFFFFF',
  },
  date: {
    fontSize: theme.font.size.caption,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.80)',
    marginTop: 2,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    zIndex: 2,
  },
  aiIcon: {
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
});

export default NutritionHero;
