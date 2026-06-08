import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, interpolate, Easing, FadeInDown } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface AchievementItem {
  id: string;
  title: string;
  description?: string | null;
  icon: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementsProps {
  items: AchievementItem[];
}

const RARITY_CONFIG: Record<string, { gradient: [string, string]; glow: string }> = {
  common: { gradient: ['#E8E8ED', '#D1D5DB'], glow: 'rgba(0,0,0,0.05)' },
  rare: { gradient: ['#C6E6FF', '#93C5FD'], glow: 'rgba(59,130,246,0.2)' },
  epic: { gradient: ['#EDE9FE', '#C4B5FD'], glow: 'rgba(106,73,250,0.25)' },
  legendary: { gradient: ['#FEF3C7', '#FCD34D'], glow: 'rgba(245,158,11,0.3)' },
};

function ShimmerOverlay() {
  const translateX = useSharedValue(-1);
  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1, true
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(translateX.value, [-1, 1], [-160, 160]),
    }],
  }));
  return (
    <Animated.View style={[styles.shimmer, style]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

export function Achievements({ items }: AchievementsProps) {
  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      decelerationRate="fast"
    >
      {items.map((item, i) => {
        const cfg = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.common;
        const iconName = (item.icon || 'award') as React.ComponentProps<typeof Feather>['name'];
        return (
          <Animated.View
            key={item.id}
            entering={FadeInDown.delay(i * 60).duration(300).easing(Easing.out(Easing.quad))}
          >
            <LinearGradient
              colors={cfg.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, { shadowColor: cfg.glow }]}
            >
              <View style={styles.iconRow}>
                <Feather name={iconName} size={22} color={item.rarity === 'legendary' ? '#92400E' : theme.colors.primary} />
              </View>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
              <View style={styles.rarityBadge}>
                <Text style={styles.rarityText}>{item.rarity}</Text>
              </View>
              {item.rarity === 'legendary' && <ShimmerOverlay />}
            </LinearGradient>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    width: 150,
    borderRadius: theme.radius.xl,
    padding: 14,
    gap: 6,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  iconRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: theme.font.size.caption,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  desc: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 14,
  },
  rarityBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});

export default Achievements;
