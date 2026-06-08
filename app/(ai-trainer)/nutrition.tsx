import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ModeBadge from '@/components/ui/ModeBadge';
import { useAiTrainerStore } from '@/store/aiTrainerStore';
import { supabase } from '@/lib/supabase';

export default function AiNutrition() {
  const router = useRouter();
  const activePlan = useAiTrainerStore(s => s.activePlan);
  const [todayCals, setTodayCals] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [todayFat, setTodayFat] = useState(0);
  const [meals, setMeals] = useState<{ time: string; food: string; cals: number; protein: number }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
      const { data } = await supabase
        .from('meal_logs')
        .select('calories, protein_g, carbs_g, fat_g, food_name, meal_type')
        .eq('user_id', user.id)
        .gte('logged_at', start)
        .lte('logged_at', end);
      if (data) {
        setTodayCals(data.reduce((s: number, m: any) => s + (m.calories || 0), 0));
        setTodayProtein(data.reduce((s: number, m: any) => s + (m.protein_g || 0), 0));
        setTodayCarbs(data.reduce((s: number, m: any) => s + (m.carbs_g || 0), 0));
        setTodayFat(data.reduce((s: number, m: any) => s + (m.fat_g || 0), 0));
        const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
        const sorted = [...data].sort((a: any, b: any) => mealOrder.indexOf(a.meal_type) - mealOrder.indexOf(b.meal_type));
        setMeals(sorted.map((m: any) => ({
          time: m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1),
          food: m.food_name || 'Unknown',
          cals: m.calories || 0,
          protein: m.protein_g || 0,
        })));
      }
    })();
  }, []);

  const calTarget = activePlan?.calorieTarget || 1800;
  const proteinTarget = activePlan?.proteinTarget || 150;
  const carbTarget = activePlan?.carbTarget || 200;
  const fatTarget = activePlan?.fatTarget || 60;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <ModeBadge mode="ai_trainer" onPress={() => router.push('/settings/mode-switcher')} />
      </View>

      {activePlan && (
        <LinearGradient colors={['#0f0a1a', '#1a0f2e']} style={styles.planBanner}>
          <Feather name="pie-chart" size={14} color="#C8FF00" />
          <Text style={styles.planBannerText}>
            {activePlan.goal.toUpperCase()} · {calTarget} kcal · {proteinTarget}g protein
          </Text>
        </LinearGradient>
      )}

      <View style={styles.targetRow}>
        <View style={styles.targetCard}>
          <Text style={[styles.targetValue, todayCals >= calTarget * 0.9 && styles.targetHit]}>{todayCals}</Text>
          <Text style={styles.targetLabel}>Calories</Text>
          <Text style={styles.targetSub}>/ {calTarget} goal</Text>
        </View>
        <View style={styles.targetCard}>
          <Text style={[styles.targetValue, todayProtein >= proteinTarget && styles.targetHit]}>{todayProtein}</Text>
          <Text style={styles.targetLabel}>Protein</Text>
          <Text style={styles.targetSub}>/ {proteinTarget}g goal</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Macro Breakdown */}
        <View style={styles.macroSection}>
          <Text style={styles.sectionTitle}>Daily Targets</Text>
          {[
            { label: 'Carbs', current: todayCarbs, target: carbTarget, unit: 'g', color: '#F59E0B' },
            { label: 'Fat', current: todayFat, target: fatTarget, unit: 'g', color: '#EC4899' },
          ].map((m, i) => (
            <View key={m.label} style={styles.macroRow}>
              <View style={[styles.macroDot, { backgroundColor: m.color }]} />
              <Text style={styles.macroName}>{m.label}</Text>
              <Text style={styles.macroValue}>{m.current}{m.unit}</Text>
              <Text style={styles.macroTarget}>/ {m.target}{m.unit}</Text>
            </View>
          ))}
        </View>

        {/* AI Tip */}
        {activePlan && (
          <View style={styles.tipCard}>
            <Feather name="message-circle" size={14} color="#8B5CF6" />
            <Text style={styles.tipText}>
              {activePlan.goal.toLowerCase() === 'cut'
                ? 'Prioritize protein to preserve muscle during your deficit.'
                : activePlan.goal.toLowerCase() === 'build'
                ? 'Your surplus supports muscle growth — keep protein intake consistent.'
                : 'Stay consistent with your macros to maintain your current composition.'}
            </Text>
          </View>
        )}

        {meals.length === 0 ? (
          <View style={styles.emptyMeals}>
            <Feather name="coffee" size={24} color="#7A7A7A" />
            <Text style={styles.emptyMealsText}>No meals logged today</Text>
          </View>
        ) : meals.map((m, i) => (
          <Animated.View key={m.time} entering={FadeInDown.duration(400).delay(i * 80).springify()}>
            <View style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTime}>{m.time}</Text>
                <Text style={styles.mealCals}>{m.cals} kcal</Text>
              </View>
              <Text style={styles.mealFood}>{m.food}</Text>
              <Text style={styles.mealProtein}>{m.protein}g protein</Text>
            </View>
          </Animated.View>
        ))}

        <TouchableOpacity style={styles.logBtn} activeOpacity={0.8}>
          <Feather name="plus" size={18} color="#0A0A0A" />
          <Text style={styles.logBtnText}>Log Meal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F5F5F5' },
  planBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(200,255,0,0.1)',
  },
  planBannerText: { fontSize: 11, color: '#C8FF00', fontWeight: '600', letterSpacing: 0.5 },
  targetRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 8 },
  targetCard: {
    flex: 1, padding: 16, borderRadius: 16,
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#1F1F1F',
    alignItems: 'center',
  },
  targetValue: { fontSize: 28, fontWeight: '800', color: '#F5F5F5' },
  targetHit: { color: '#C8FF00' },
  targetLabel: { fontSize: 12, color: '#C8FF00', marginTop: 2 },
  targetSub: { fontSize: 11, color: '#7A7A7A', marginTop: 2 },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 40 },
  sectionTitle: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  macroSection: { padding: 16, borderRadius: 16, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1F1F1F', gap: 8 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroName: { fontSize: 14, color: '#F5F5F5', flex: 1 },
  macroValue: { fontSize: 14, fontWeight: '600', color: '#C8FF00', marginRight: 4 },
  macroTarget: { fontSize: 14, fontWeight: '600', color: '#A78BFA' },
  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 14, borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
  },
  tipText: { fontSize: 12, color: '#C4B5FD', flex: 1, lineHeight: 17 },
  mealCard: { padding: 16, borderRadius: 16, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1F1F1F' },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  mealTime: { fontSize: 13, fontWeight: '600', color: '#F5F5F5' },
  mealCals: { fontSize: 13, color: '#7A7A7A' },
  mealFood: { fontSize: 14, color: '#C4B5FD', marginTop: 4 },
  mealProtein: { fontSize: 12, color: '#7A7A7A', marginTop: 2 },
  emptyMeals: { alignItems: 'center', padding: 32, gap: 8 },
  emptyMealsText: { fontSize: 13, color: '#7A7A7A' },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 48, borderRadius: 16, backgroundColor: '#C8FF00', marginTop: 4,
  },
  logBtnText: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
});
