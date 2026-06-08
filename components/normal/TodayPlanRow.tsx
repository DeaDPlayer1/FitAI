import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import WorkoutPlanCard from './WorkoutPlanCard';

interface Props {
  onStartWorkout: () => void;
  onLogMeal: () => void;
  onAddWater: () => void;
  mealsLogged: number;
  mealsTotal: number;
  waterLogged: number;
  waterGoal: number;
  hasWorkout?: boolean;
}

export default function TodayPlanRow({
  onStartWorkout, onLogMeal, onAddWater,
  mealsLogged, mealsTotal, waterLogged, waterGoal,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Plan</Text>
        <Text style={styles.sectionChevron}>›</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16 }}
      >
        <WorkoutPlanCard
          icon="▶️"
          iconBg="#ECFDF5"
          iconColor="#22C55E"
          label="WORKOUT"
          value="Start"
          sub="Ready"
          cta="Tap to Start →"
          ctaColor="#22C55E"
          onPress={onStartWorkout}
        />
        <WorkoutPlanCard
          icon="☕"
          iconBg="#FFFBEB"
          iconColor="#F59E0B"
          label="MEALS"
          value={`${mealsLogged}/${mealsTotal}`}
          sub={`${Math.max(mealsTotal - mealsLogged, 0)} remaining`}
          cta="Log meal →"
          ctaColor="#F59E0B"
          progress={(mealsLogged / Math.max(mealsTotal, 1)) * 100}
          progressColor="#F59E0B"
          onPress={onLogMeal}
        />
        <WorkoutPlanCard
          icon="💧"
          iconBg="#EFF6FF"
          iconColor="#60A5FA"
          label="WATER"
          value={`${waterLogged}/${waterGoal}`}
          sub={`${Math.max(waterGoal - waterLogged, 0)} more glasses`}
          cta="Add glass →"
          ctaColor="#60A5FA"
          onPress={onAddWater}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sectionChevron: { fontSize: 16, color: '#9CA3AF' },
});
