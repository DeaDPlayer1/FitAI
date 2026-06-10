import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, withDelay, Easing, FadeIn,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@/constants/theme';

interface Macro {
  label: string;
  value: number;
  target: number;
  color: string;
  softColor: string;
  gradient: [string, string];
  icon: any;
  insight: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function MacroRing({
  macro, index, size = 96, strokeWidth = 8,
}: {
  macro: Macro; index: number; size?: number; strokeWidth?: number;
}) {
  const progress = useSharedValue(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = macro.target > 0 ? Math.min(macro.value / macro.target, 1) : 0;

  useEffect(() => {
    progress.value = withDelay(200 + index * 150, withTiming(pct, { duration: 1000, easing: Easing.out(Easing.cubic) }));
  }, [pct, index]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - progress.value),
  }));

  return (
    <View style={styles.ringWrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={macro.color + '18'} strokeWidth={strokeWidth} fill="none" />
          <AnimatedCircle
            cx={size / 2} cy={size / 2} r={r}
            stroke={macro.color} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            animatedProps={animatedProps}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={[styles.ringValue, { color: macro.color }]}>{Math.round(macro.value)}</Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{macro.label}</Text>
      <Text style={styles.ringTarget}>{macro.target}g goal</Text>
      <Text style={styles.ringInsight}>{macro.insight}</Text>
    </View>
  );
}

export function MacroPerformance({ macros }: { macros: Macro[] }) {
  if (macros.length === 0) return null;
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
      <Text style={styles.cardTitle}>Today's Macros</Text>
      <View style={styles.row}>
        {macros.map((m, i) => (
          <MacroRing key={m.label} macro={m} index={i} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 22, marginBottom: 18,
    padding: 22, paddingBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: {
    fontSize: 12, fontWeight: '700', color: theme.colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  ringWrapper: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  ringCenter: {
    position: 'absolute', inset: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ringValue: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ringTarget: {
    fontSize: 9,
    fontWeight: '500',
    color: theme.colors.text.muted,
  },
  ringInsight: {
    fontSize: 9,
    fontWeight: '500',
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 12,
    paddingHorizontal: 4,
    marginTop: 2,
  },
});

export default MacroPerformance;
