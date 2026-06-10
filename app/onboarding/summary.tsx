import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useModeStore } from '@/store/modeStore';
import { calculateAll, type Gender, type ActivityLevel, type GoalType, type WeeklyPace } from '@/lib/tdee';

const GOAL_LABELS: Record<string, string> = {
  lose: 'Lose Weight',
  maintain: 'Maintain Weight',
  gain: 'Gain Weight',
};

const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentary',
  light: 'Lightly Active',
  moderate: 'Moderately Active',
  active: 'Very Active',
  very_active: 'Extra Active',
};

export default function SummaryScreen() {
  const router = useRouter();
  const { data, reset } = useOnboardingStore();
  const appMode = useModeStore((s) => s.appMode);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const result = useMemo(() => {
    if (!data.gender || !data.weight || !data.height || !data.age || !data.activityLevel) return null;
    const goal = (data.goal || 'maintain') as GoalType;
    const pace = (goal === 'maintain' ? '0.5' : (data.weeklyPace || '0.5')) as WeeklyPace;
    return calculateAll(
      data.gender as Gender,
      parseFloat(data.weight),
      data.weightUnit,
      parseFloat(data.height),
      data.heightUnit,
      parseInt(data.age),
      data.activityLevel as ActivityLevel,
      goal,
      pace,
    );
  }, [data]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    reset();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ scale: scaleIn }] }]}>
        <View style={styles.emojiRow}>
          <Text style={styles.emoji}>🎯</Text>
        </View>
        <Text style={styles.heading}>Your plan is ready</Text>
        <Text style={styles.subtitle}>Here's your personalised daily target.</Text>

        <View style={styles.targetCard}>
          <Text style={styles.targetLabel}>Daily Calories</Text>
          <Text style={styles.targetValue}>{result?.targetCalories || 1800}</Text>
          <Text style={styles.targetUnit}>kcal</Text>

          <View style={styles.targetDivider} />

          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#EC4899' }]}>{result?.proteinG || 150}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#F59E0B' }]}>{result?.carbsG || 200}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#3B82F6' }]}>{result?.fatG || 60}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          {result && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{result.bmr}</Text>
              <Text style={styles.statLabel}>BMR</Text>
            </View>
          )}
          {result && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{result.tdee}</Text>
              <Text style={styles.statLabel}>TDEE</Text>
            </View>
          )}
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.weight}{data.weightUnit}</Text>
            <Text style={styles.statLabel}>Weight</Text>
          </View>
        </View>

        <View style={styles.chipRow}>
          {data.goal && <View style={styles.chip}><Text style={styles.chipText}>{GOAL_LABELS[data.goal]}</Text></View>}
          {data.gender && <View style={styles.chip}><Text style={styles.chipText}>{GENDER_LABELS[data.gender]}</Text></View>}
          {data.activityLevel && <View style={styles.chip}><Text style={styles.chipText}>{ACTIVITY_LABELS[data.activityLevel]}</Text></View>}
          {data.age && <View style={styles.chip}><Text style={styles.chipText}>{data.age} yrs</Text></View>}
        </View>
      </Animated.View>

      <View style={styles.bottom}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.startBtn}
          onPress={handleStart}
        >
          <Text style={styles.startBtnText}>Start Tracking</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5FB' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32, alignItems: 'center' },
  emojiRow: { marginBottom: 16 },
  emoji: { fontSize: 56 },
  heading: { fontSize: 28, fontWeight: '800', color: '#1B1B1F', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6E6E73', textAlign: 'center', marginBottom: 28 },

  targetCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    alignItems: 'center',
    shadowColor: '#6A49FA', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(106,73,250,0.08)',
  },
  targetLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 },
  targetValue: { fontSize: 52, fontWeight: '800', color: '#6A49FA', marginTop: 4, fontVariant: ['tabular-nums'] },
  targetUnit: { fontSize: 14, color: '#6E6E73', fontWeight: '500' },
  targetDivider: { width: '60%', height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  macroRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  macroLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statBox: {
    alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 20, minWidth: 80,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#6A49FA', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, color: '#6E6E73', marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: '#6A49FA20',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#453284' },

  bottom: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6A49FA', borderRadius: 16, height: 56,
    shadowColor: '#6A49FA', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
