// UI: Premium Statistics/Activity Overhaul (Phase 5)
// DATA: Fixed zero-data issue by implementing real-time Supabase fetching logic
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

import Card from '@/components/ui/Card';
import { StatWidget } from '@/components/ui/StatWidget';
import { BarChart } from '@/components/ui/BarChart';
import { FadeInView } from '@/components/ui/FadeInView';
import { CountingText } from '@/components/ui/CountingText';

import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StatsScreen() {
  const router = useRouter();
  
  // DATA: Local state for statistics
  const [profile, setProfile] = useState<any>(null);
  const [weeklyCalories, setWeeklyCalories] = useState<any[]>([]);
  const [todayExercise, setTodayExercise] = useState(0);
  const [latestWeight, setLatestWeight] = useState<number | string>('--');
  const [todayWater, setTodayWater] = useState(0);
  const [todayBPM, setTodayBPM] = useState<number | string>('--');
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, total: 1 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // DATA: fetchProfile()
  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    } catch (e) { console.error('stats fetchProfile error:', e); }
  };

  // DATA: fetchWeeklyCalories() -> 7 days
  const fetchWeeklyCalories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('meal_logs')
        .select('logged_at, calories')
        .eq('user_id', user.id)
        .gte('logged_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const grouped = data.reduce((acc: any, log: any) => {
        const dayName = days[new Date(log.logged_at).getDay()];
        acc[dayName] = (acc[dayName] || 0) + (log.calories || 0);
        return acc;
      }, {});

      const today = days[new Date().getDay()];
      const chart = days.map(d => ({
        day: d,
        value: grouped[d] || 0,
        isActive: d === today
      }));
      setWeeklyCalories(chart);
    } catch (e) { console.error('fetchWeeklyCalories error:', e); }
  };

  // DATA: fetchStats() -> exercise, weight, water, bpm
  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString();
      const endOfDay = new Date(today.setHours(23,59,59,999)).toISOString();

      // Exercise (from workout_logs)
      const { data: workouts } = await supabase.from('workout_logs').select('duration_minutes').eq('user_id', user.id).gte('logged_at', startOfDay).lte('logged_at', endOfDay);
      setTodayExercise(workouts?.reduce((s, w) => s + (w.duration_minutes || 0), 0) || 0);

      // Weight (latest)
      const { data: weights } = await supabase.from('weight_logs').select('weight_kg').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1);
      setLatestWeight(weights?.[0]?.weight_kg || '--');

      // Water (today)
      const { data: waters } = await supabase.from('water_logs').select('glasses').eq('user_id', user.id).gte('logged_at', startOfDay).lte('logged_at', endOfDay);
      setTodayWater(waters?.reduce((s, w) => s + (w.glasses || 0), 0) || 0);

      // BPM (latest from activity_logs)
      const { data: activity } = await supabase.from('activity_logs').select('bpm').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1);
      setTodayBPM(activity?.[0]?.bpm || '--');
    } catch (e) { console.error('fetchStats error:', e); }
  };

  // DATA: fetchHeatmap() -> last 21 days
  const fetchHeatmap = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('meal_logs').select('logged_at').eq('user_id', user.id).gte('logged_at', new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString());
      
      const activeDates = new Set(data?.map(d => new Date(d.logged_at).toDateString()));
      const days = [];
      for (let i = 20; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({ active: activeDates.has(d.toDateString()) });
      }
      setHeatmapData(days);
    } catch (e) { console.error('fetchHeatmap error:', e); }
  };

  // DATA: fetchMacros()
  const fetchMacros = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString();
      const endOfDay = new Date(today.setHours(23,59,59,999)).toISOString();

      const { data } = await supabase.from('meal_logs').select('calories, protein_g, carbs_g, fat_g').eq('user_id', user.id).gte('logged_at', startOfDay).lte('logged_at', endOfDay);
      const totals = data?.reduce((acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein_g || 0),
        carbs: acc.carbs + (m.carbs_g || 0),
        fat: acc.fat + (m.fat_g || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      
      const totalMacros = totals.protein + totals.carbs + totals.fat || 1;
      setMacros({ ...totals, total: totalMacros });
    } catch (e) { console.error('fetchMacros error:', e); }
  };

  // DATA: fetchRecentLogs()
  const fetchRecentLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: meals } = await supabase.from('meal_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(5);
      const { data: workouts } = await supabase.from('workout_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(3);
      
      const combined = [
        ...(meals || []).map(m => ({ ...m, type: 'food' })),
        ...(workouts || []).map(w => ({ ...w, type: 'workout' }))
      ].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
      
      setRecentLogs(combined.slice(0, 5));
    } catch (e) { console.error('fetchRecentLogs error:', e); }
  };

  // DATA: useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const loadAll = async () => {
        setLoading(true);
        await Promise.all([
          fetchProfile(),
          fetchWeeklyCalories(),
          fetchStats(),
          fetchHeatmap(),
          fetchMacros(),
          fetchRecentLogs()
        ]);
        setLoading(false);
      };
      loadAll();
    }, [])
  );

  const calorieGoal = profile?.calorie_goal ?? 1800;

  // ANIMATION: Sticky Header Collapse
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(scrollY.value, [0, 100], [60, 44], Extrapolate.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 80], [1, 0.9], Extrapolate.CLAMP);
    return { height, opacity };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(scrollY.value, [0, 100], [20, 16], Extrapolate.CLAMP);
    return { fontSize };
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <Animated.View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Animated.Text style={[styles.headerTitle, headerTitleStyle]}>Statistic</Animated.Text>
        <TouchableOpacity>
          <Feather name="more-horizontal" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.screen} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* CALORIES HERO SECTION - Staggered */}
        <FadeInView delay={0}>
          <View style={styles.heroSection}>
            <Text style={styles.heroLabel}>Calories</Text>
            <View style={styles.heroValueRow}>
              <CountingText 
                value={Math.round(macros.calories || 0)} 
                style={styles.heroValue} 
              />
              <Text style={styles.heroUnit}>Kcal</Text>
              <View style={styles.flex} />
              <Text style={styles.heroTarget}>Target: {calorieGoal} Kcal</Text>
            </View>
          </View>
        </FadeInView>

        {/* BAR CHART - Staggered */}
        <FadeInView delay={100}>
          <Card style={styles.chartCard} padding={20}>
            {loading ? <ActivityIndicator color={theme.colors.accent.green} /> : <BarChart data={weeklyCalories} maxValue={3000} />}
          </Card>
        </FadeInView>

        {/* STAT WIDGETS GRID - Staggered */}
        <FadeInView delay={200}>
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <StatWidget 
                icon="zap" 
                label="Exercise" 
                value={(todayExercise / 60).toFixed(1)} 
                unit="hours" 
                color={theme.colors.accent.green}
                iconBg="rgba(157,195,56,0.1)"
              />
              <StatWidget 
                icon="heart" 
                label="BPM" 
                value={todayBPM} 
                unit="bpm" 
                color={theme.colors.accent.red}
                iconBg="rgba(239,68,68,0.1)"
              />
            </View>
            <View style={styles.gridRow}>
              <StatWidget 
                icon="activity" 
                label="Weight" 
                value={latestWeight} 
                unit="kg" 
                color={theme.colors.accent.orange}
                iconBg="rgba(249,115,22,0.1)"
              />
              <StatWidget 
                icon="droplet" 
                label="Water" 
                value={todayWater} 
                unit="glasses" 
                color={theme.colors.accent.blue}
                iconBg="rgba(59,130,246,0.1)"
              />
            </View>
          </View>
        </FadeInView>

        {/* ACTIVITY HEATMAP - Staggered */}
        <FadeInView delay={300}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Heatmap</Text>
            <Card style={styles.heatmapCard} padding={16}>
              <View style={styles.heatmapGrid}>
                {heatmapData.map((d, i) => (
                  <FadeInView key={i} delay={300 + i * 20}>
                    <View style={[
                      styles.heatmapSquare, 
                      { backgroundColor: d.active ? theme.colors.accent.green : '#E5E7EB' }
                    ]} />
                  </FadeInView>
                ))}
              </View>
            </Card>
          </View>
        </FadeInView>

        {/* MACROS DISTRIBUTION - Staggered */}
        <FadeInView delay={400}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Macros Distribution</Text>
            <Card style={styles.macrosCard} padding={20}>
              <View style={styles.macroContent}>
                <View style={styles.macroLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: theme.colors.accent.green }]} />
                    <Text style={styles.legendText}>Protein ({Math.round(macros.protein/macros.total*100)}%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: theme.colors.accent.orange }]} />
                    <Text style={styles.legendText}>Carbs ({Math.round(macros.carbs/macros.total*100)}%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: theme.colors.accent.blue }]} />
                    <Text style={styles.legendText}>Fats ({Math.round(macros.fat/macros.total*100)}%)</Text>
                  </View>
                </View>

                <Svg width={80} height={80}>
                  <Circle cx="40" cy="40" r="32" stroke="#F3F4F6" strokeWidth="8" fill="none" />
                  <Circle 
                    cx="40" cy="40" r="32" 
                    stroke={theme.colors.accent.green} strokeWidth="8" 
                    strokeDasharray={`${(macros.protein/macros.total)*201} 201`} 
                    fill="none" 
                    rotation="-90" origin="40, 40"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
            </Card>
          </View>
        </FadeInView>

        {/* RECENT LOGS - Staggered */}
        <FadeInView delay={500}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Logs</Text>
            {recentLogs.map((log, i) => (
              <Card key={i} style={styles.logCard} padding={16}>
                <View style={styles.logItem}>
                  <View style={[styles.logIcon, { backgroundColor: log.type === 'food' ? 'rgba(249,115,22,0.1)' : 'rgba(157,195,56,0.1)' }]}>
                    <Feather name={log.type === 'food' ? "coffee" : "activity"} size={20} color={log.type === 'food' ? theme.colors.accent.orange : theme.colors.accent.green} />
                  </View>
                  <View style={styles.logInfo}>
                    <Text style={styles.logTitle}>{log.type === 'food' ? log.food_name : (log.plan_name || 'Workout')}</Text>
                    <Text style={styles.logSub}>
                      {log.type === 'food' ? `${(log.calories ?? 0).toFixed(0)} kcal` : `${Array.isArray(log.exercises) ? log.exercises.length : 0} exercises`}
                    </Text>
                  </View>
                  <Text style={styles.logTime}>{new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </Card>
            ))}
          </View>
        </FadeInView>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    height: 60,
    backgroundColor: '#FFFFFF' 
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  screen: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  flex: { flex: 1 },
  heroSection: { paddingVertical: 20 },
  heroLabel: { fontSize: 13, color: theme.colors.text.muted, marginBottom: 4 },
  heroValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 20 },
  heroValue: { fontSize: 48, fontWeight: '900', color: '#1A1A1A' },
  heroUnit: { fontSize: 18, color: theme.colors.text.muted },
  heroTarget: { fontSize: 13, color: theme.colors.text.muted },
  chartCard: { marginBottom: 16, minHeight: 200, justifyContent: 'center' },
  grid: { marginBottom: 24, gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginTop: 24, marginBottom: 12 },
  heatmapCard: { width: '100%' },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heatmapSquare: { width: 36, height: 36, borderRadius: 8 },
  macrosCard: { width: '100%', alignItems: 'center' },
  macroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  macroLegend: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 13, color: theme.colors.text.secondary },
  logCard: { marginBottom: 10 },
  logItem: { flexDirection: 'row', alignItems: 'center' },
  logIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logInfo: { flex: 1 },
  logTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  logSub: { fontSize: 13, color: theme.colors.text.muted, marginTop: 2 },
  logTime: { fontSize: 12, color: theme.colors.text.muted },
});
