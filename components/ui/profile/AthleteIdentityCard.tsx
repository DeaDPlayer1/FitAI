import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, FadeInDown } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

interface MetricItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string | number;
  color: string;
  softColor?: string;
  gradient?: [string, string];
}

interface AthleteIdentityCardProps {
  metrics: MetricItem[];
}

function AnimatedCount({ value, color }: { value: string | number; color: string }) {
  const raw = String(value);
  const numPart = parseFloat(raw.replace(/[^0-9.]/g, ''));
  const suffix = raw.replace(/[0-9.]/g, '').trim();
  const isNumeric = !isNaN(numPart);
  const displayVal = useSharedValue(0);
  const hasAnimated = useSharedValue(false);

  useEffect(() => {
    if (isNumeric) {
      if (!hasAnimated.value) {
        displayVal.value = withTiming(numPart, { duration: 800, easing: Easing.out(Easing.quad) });
        hasAnimated.value = true;
      } else {
        displayVal.value = withTiming(numPart, { duration: 400, easing: Easing.out(Easing.quad) });
      }
    }
  }, [numPart, isNumeric]);

  const animatedProps = useAnimatedProps(() => {
    if (!isNumeric) return { text: raw } as any;
    return {
      text: `${Math.round(displayVal.value)}`,
    } as any;
  });

  if (!isNumeric) {
    return <Text style={[styles.metricValue, { color }]}>{value}</Text>;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <AnimatedText animatedProps={animatedProps} style={[styles.metricValue, { color }]} />
      {suffix ? <Text style={[styles.unitSuffix, { color: color + '99' }]}>{suffix}</Text> : null}
    </View>
  );
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export function AthleteIdentityCard({ metrics }: AthleteIdentityCardProps) {
  return (
    <View style={styles.row}>
      {metrics.slice(0, 3).map((m, i) => (
        <Animated.View
          key={m.label}
          entering={FadeInDown.delay(i * 100).duration(400).easing(Easing.out(Easing.quad))}
          style={styles.card}
        >
          <LinearGradient
            colors={m.gradient || [m.softColor || '#FFFFFF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inner}
          >
            <View style={[styles.iconBg, { backgroundColor: m.color + '18' }]}>
              <Feather name={m.icon} size={16} color={m.color} />
            </View>
            <AnimatedCount value={m.value} color={m.color} />
            <Text style={styles.metricLabel}>{m.label}</Text>
          </LinearGradient>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: theme.radius.xl,
    ...theme.shadow.card,
  },
  inner: {
    borderRadius: theme.radius.xl,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: theme.font.size.h3,
    fontWeight: '800',
    fontFamily: theme.font.family.heading,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  unitSuffix: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    marginLeft: 2,
  },
});

export default AthleteIdentityCard;
