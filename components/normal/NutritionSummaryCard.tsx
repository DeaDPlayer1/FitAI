import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, withDelay } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function MacroRow({ color, label, current, target }: { color: string; label: string; current: number; target: number }) {
  const pct = target > 0 ? (current / target) * 100 : 0;
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.macroDot, { backgroundColor: color }]} />
          <Text style={styles.macroLabel}>{label}</Text>
        </View>
        <Text style={styles.macroRight}>{current}/{target}g</Text>
      </View>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

interface Props {
  calories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
}

export default function NutritionSummaryCard({
  calories, calorieGoal, protein, proteinGoal, carbs, carbsGoal, fat, fatGoal,
}: Props) {
  const pct = calorieGoal > 0 ? (calories / calorieGoal) * 100 : 0;
  const remaining = calorieGoal - calories;
  const circumference = 2 * Math.PI * 35;
  const fillLen = (pct / 100) * circumference;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(400, withTiming(pct / 100, { duration: 1200 }));
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (animatedProgress.value * circumference),
  }));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Nutrition</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{Math.round(pct)}% consumed</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.left}>
          <View style={styles.ringWrap}>
            <Svg width={80} height={80} viewBox="0 0 80 80">
              <Circle cx="40" cy="40" r="35" stroke="#E5E7EB" strokeWidth="7" fill="none" />
              <AnimatedCircle
                cx="40" cy="40" r="35"
                stroke="#22C55E"
                strokeWidth="7"
                fill="none"
                strokeDasharray={circumference}
                strokeLinecap="round"
                animatedProps={animatedProps}
                rotation="-90"
                origin="40, 40"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.leftNum, remaining < 0 && { color: '#FF6B6B' }]}>{remaining}</Text>
              <Text style={styles.leftLabel}>{remaining < 0 ? 'OVER' : 'LEFT'}</Text>
            </View>
          </View>
          <Text style={styles.leftSub}>of {calorieGoal} kcal</Text>
        </View>

        <View style={styles.right}>
          <MacroRow color="#22C55E" label="Protein" current={protein} target={proteinGoal} />
          <MacroRow color="#F59E0B" label="Carbs" current={carbs} target={carbsGoal} />
          <MacroRow color="#60A5FA" label="Fat" current={fat} target={fatGoal} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 100,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  badge: { backgroundColor: '#ECFDF5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, color: '#22C55E', fontWeight: '500' },
  content: { flexDirection: 'row', marginTop: 14 },
  left: { width: '35%', alignItems: 'center' },
  ringWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  leftNum: { fontSize: 20, fontWeight: '700', color: '#111827' },
  leftLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  leftSub: { fontSize: 12, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
  right: { flex: 1, paddingLeft: 14, gap: 10 },
  macroRow: { gap: 4 },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroLabel: { fontSize: 14, color: '#111827' },
  macroRight: { fontSize: 14, fontWeight: '700', color: '#111827' },
  macroBarTrack: { height: 5, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
});
