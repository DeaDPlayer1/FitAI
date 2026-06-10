import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, TextInput, Modal, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store';
import { theme } from '@/constants/theme';
import { LineChartPremium, BarChartPremium, AreaChartPremium, type DataPoint } from '@/components/ui/charts';

const SCREEN_W = Dimensions.get('window').width;
const CARD_H = 200;
const CHART_W = SCREEN_W - 72;
const CHART_H = 148;
const GRID_GAP = 10;
const CARD_RADIUS = 20;

const PURPLE = '#6A49FA';
const PURPLE_GLOW = 'rgba(106,73,250,0.12)';
const GREEN = '#34C759';
const ORANGE = '#FF9500';
const RED = '#FF3B30';
const CARD_BG = '#FFFFFF';
const MUTED = theme.colors.text.muted || '#8E8E93';
const PRIMARY = theme.colors.text.primary || '#1C1C1E';
const BG = theme.colors.bg.primary || '#F6F5FB';

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return 'Your';
  return fullName.split(' ')[0];
}

function formatDate(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Tooltip ──────────────────────────────────────────────────────────────────

function TooltipBox({ title, lines, x, visible }: {
  title: string; lines: string[]; x: number; visible: boolean;
}) {
  if (!visible) return null;
  return (
    <Animated.View entering={FadeIn.duration(120)} style={[tipSt.box, { left: Math.max(4, Math.min(x - 64, CHART_W - 140)) }]}>
      <Text style={tipSt.title}>{title}</Text>
      {lines.map((l, i) => (
        <Text key={i} style={tipSt.line}>{l}</Text>
      ))}
      <View style={tipSt.arrow} />
    </Animated.View>
  );
}

const tipSt = StyleSheet.create({
  box: {
    position: 'absolute', top: -48, width: 140,
    backgroundColor: '#1C1C1E', borderRadius: 12, padding: 12, paddingBottom: 10,
    zIndex: 100,
  },
  arrow: {
    position: 'absolute', bottom: -5, left: 60,
    width: 10, height: 10, backgroundColor: '#1C1C1E',
    transform: [{ rotate: '45deg' }],
  },
  title: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', marginBottom: 4, letterSpacing: 0.2 },
  line: { fontSize: 10, color: '#C7C7CC', lineHeight: 14 },
});

// ── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sublabel, accent, trend, icon, delay = 0,
}: {
  label: string; value: string; sublabel?: string; accent?: string; trend?: { direction: 'up' | 'down' | 'flat'; label: string }; icon?: keyof typeof Feather.glyphMap; delay?: number;
}) {
  const trendColor = trend?.direction === 'up' ? GREEN : trend?.direction === 'down' ? RED : MUTED;
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(300)} style={[metricSt.card, accent ? { borderLeftWidth: 3, borderLeftColor: accent } : {}]}>
      <View style={metricSt.top}>
        {icon && (
          <View style={[metricSt.iconBox, { backgroundColor: accent ? `${accent}18` : PURPLE_GLOW }]}>
            <Feather name={icon} size={13} color={accent || PURPLE} />
          </View>
        )}
        <Text style={metricSt.label} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={metricSt.value} numberOfLines={1}>{value}</Text>
      {sublabel && <Text style={metricSt.sublabel} numberOfLines={1}>{sublabel}</Text>}
      {trend && (
        <View style={metricSt.trendRow}>
          <Feather name={trend.direction === 'up' ? 'trending-up' : trend.direction === 'down' ? 'trending-down' : 'minus'} size={11} color={trendColor} />
          <Text style={[metricSt.trendLabel, { color: trendColor }]}>{trend.label}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const metricSt = StyleSheet.create({
  card: {
    backgroundColor: CARD_BG, borderRadius: 18, padding: 14, flex: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  iconBox: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: MUTED, letterSpacing: 0.2 },
  value: { fontSize: 20, fontWeight: '800', color: PRIMARY, letterSpacing: -0.3 },
  sublabel: { fontSize: 10, color: MUTED, marginTop: 1 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  trendLabel: { fontSize: 10, fontWeight: '600' },
});

// ── Section Header ───────────────────────────────────────────────────────────

function AnalyticsSectionHeader({
  title, value, trend, icon,
}: {
  title: string; value: string; trend?: { direction: 'up' | 'down' | 'flat'; label: string }; icon: string;
}) {
  const trendColor = trend?.direction === 'up' ? GREEN : trend?.direction === 'down' ? RED : MUTED;
  return (
    <View style={secHeadSt.wrapper}>
      <View style={secHeadSt.left}>
        <Text style={secHeadSt.icon}>{icon}</Text>
        <Text style={secHeadSt.title}>{title}</Text>
      </View>
      <View style={secHeadSt.right}>
        <Text style={secHeadSt.value}>{value}</Text>
        {trend && (
          <View style={secHeadSt.trendRow}>
            <Feather name={trend.direction === 'up' ? 'trending-up' : trend.direction === 'down' ? 'trending-down' : 'minus'} size={12} color={trendColor} />
            <Text style={[secHeadSt.trendLabel, { color: trendColor }]}>{trend.label}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const secHeadSt = StyleSheet.create({
  wrapper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16 },
  title: { fontSize: 17, fontWeight: '700', color: PRIMARY, letterSpacing: -0.2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontSize: 14, fontWeight: '600', color: MUTED },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  trendLabel: { fontSize: 12, fontWeight: '600' },
});

// ── Filter Pills ─────────────────────────────────────────────────────────────

interface FilterPill {
  key: string; label: string;
}

function FilterRow({
  options, selected, onSelect, compact,
}: {
  options: FilterPill[]; selected: string; onSelect: (key: string) => void; compact?: boolean;
}) {
  return (
    <View style={filterRowSt.row}>
      {options.map(o => {
        const isActive = o.key === selected;
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => onSelect(o.key)}
            style={[filterRowSt.pill, isActive && filterRowSt.activePill, compact && filterRowSt.compactPill]}
            activeOpacity={0.7}
          >
            <Text style={[filterRowSt.pillText, isActive && filterRowSt.activeText, compact && filterRowSt.compactText]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const filterRowSt = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: '#F0EFF5',
  },
  activePill: { backgroundColor: PURPLE },
  compactPill: { paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 12, fontWeight: '600', color: MUTED },
  activeText: { color: '#FFFFFF' },
  compactText: { fontSize: 11 },
});

// ── Stat Chip Row ────────────────────────────────────────────────────────────

function StatChip({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={statChipSt.box}>
      <Text style={[statChipSt.value, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={statChipSt.label}>{label}</Text>
    </View>
  );
}

const statChipSt = StyleSheet.create({
  box: {
    backgroundColor: '#F3F1F8', borderRadius: 14, padding: 12, alignItems: 'center', flex: 1,
  },
  value: { fontSize: 16, fontWeight: '800', color: PRIMARY, letterSpacing: -0.2 },
  label: { fontSize: 10, color: MUTED, marginTop: 2, textAlign: 'center', fontWeight: '500' },
});

// ── Empty State ──────────────────────────────────────────────────────────────

function AnalyticsEmptyState({
  title, subtitle, actionLabel, onAction, icon,
}: {
  title: string; subtitle: string; actionLabel?: string; onAction?: () => void; icon?: string;
}) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={emptySt.wrapper}>
      <View style={emptySt.iconCircle}>
        <Feather name={(icon as any) || 'bar-chart-2'} size={22} color={PURPLE} />
      </View>
      <Text style={emptySt.title}>{title}</Text>
      <Text style={emptySt.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={emptySt.btn} onPress={onAction} activeOpacity={0.8}>
          <LinearGradient colors={[PURPLE, '#5A3DE0']} style={emptySt.btnGrad}>
            <Text style={emptySt.btnText}>{actionLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const emptySt = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: PURPLE_GLOW, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: 15, fontWeight: '700', color: PRIMARY, marginBottom: 4 },
  subtitle: { fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 19, marginBottom: 12 },
  btn: { borderRadius: 12, overflow: 'hidden' },
  btnGrad: { paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  btnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

// ── Types ────────────────────────────────────────────────────────────────────

interface ExerciseInfo {
  id: string;
  name: string;
  count: number;
}

interface WorkoutDataPoint {
  date: string;
  max_weight: number;
  sets: number;
  max_reps: number;
}

interface CalorieDataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeightDataPoint {
  date: string;
  weight: number;
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const userId = user?.id;

  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Section 1 – Workout
  const [exercises, setExercises] = useState<ExerciseInfo[]>([]);
  const [selectedEx, setSelectedEx] = useState<string | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutDataPoint[]>([]);
  const [workoutRange, setWorkoutRange] = useState<'1M' | '3M' | '6M' | 'All'>('1M');
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const workoutLoadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [workoutTooltip, setWorkoutTooltip] = useState<{ point: WorkoutDataPoint; x: number } | null>(null);
  const [workoutActiveIdx, setWorkoutActiveIdx] = useState<number | null>(null);

  // Section 2 – Calories
  const [calorieData, setCalorieData] = useState<CalorieDataPoint[]>([]);
  const [calRange, setCalRange] = useState<'week' | '4W' | '3M'>('week');
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);
  const calLoadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [calTooltip, setCalTooltip] = useState<{ point: CalorieDataPoint; x: number } | null>(null);
  const [calActiveIdx, setCalActiveIdx] = useState<number | null>(null);

  // Section 3 – Weight
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [weightRange, setWeightRange] = useState<'1W' | '1M' | '3M' | 'All'>('1M');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);
  const weightLoadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [weightTooltip, setWeightTooltip] = useState<{ point: WeightDataPoint; x: number } | null>(null);
  const [weightActiveIdx, setWeightActiveIdx] = useState<number | null>(null);
  const [showWeightSheet, setShowWeightSheet] = useState(false);
  const [weightInput, setWeightInput] = useState('');

  useEffect(() => {
    setWorkoutError(null);
    setCalError(null);
    setWeightError(null);
    if (userId) {
      fetchProfile();
      fetchExercises();
      fetchCalorieData();
      fetchWeightData();
    }
    return () => {
      if (workoutLoadingTimeout.current) clearTimeout(workoutLoadingTimeout.current);
      if (calLoadingTimeout.current) clearTimeout(calLoadingTimeout.current);
      if (weightLoadingTimeout.current) clearTimeout(weightLoadingTimeout.current);
    };
  }, [userId]);

  // ── Profile ──
  const fetchProfile = async () => {
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('full_name, goal, calorie_goal, weight_unit').eq('id', userId).single();
    if (data) {
      setProfile(data);
      if (data.weight_unit === 'lbs') setWeightUnit('lbs');
    }
  };

  const firstName = useMemo(() => getFirstName(profile?.full_name), [profile?.full_name]);
  const goal = profile?.goal;
  const isLossGoal = goal === 'fat_loss';
  const calGoal = profile?.calorie_goal;

  // ── Section 1: Workout Progress ──
  const fetchExercises = async () => {
    if (!userId) { setWorkoutLoading(false); return; }
    setWorkoutLoading(true);
    setWorkoutError(null);
    workoutLoadingTimeout.current = setTimeout(() => {
      setWorkoutLoading(false);
      setWorkoutError('Timed out loading exercises. Pull down to retry.');
    }, 15000);
    try {
      const { data, error } = await supabase
        .from('exercise_progression')
        .select('exercise_id, exercise_name, id')
        .eq('user_id', userId)
        .order('exercise_name', { ascending: true });
      if (error) throw error;
      const distinct = new Map<string, { id: string; name: string; count: number }>();
      for (const row of data || []) {
        const key = row.exercise_id || row.exercise_name;
        if (!key) continue;
        if (!distinct.has(key)) {
          distinct.set(key, { id: row.exercise_id || key, name: row.exercise_name, count: 0 });
        }
        distinct.get(key)!.count++;
      }
      const list = Array.from(distinct.values()).sort((a, b) => b.count - a.count);
      setExercises(list);
      if (list.length > 0 && !selectedEx) {
        setSelectedEx(list[0].id);
      }
      setWorkoutError(null);
    } catch (e: any) {
      console.error('fetchExercises:', e);
      setWorkoutError(e.message || 'Could not load exercises. Pull down to retry.');
    } finally {
      if (workoutLoadingTimeout.current) { clearTimeout(workoutLoadingTimeout.current); workoutLoadingTimeout.current = null; }
      setWorkoutLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEx && userId) fetchWorkoutData();
  }, [selectedEx, workoutRange, userId]);

  const fetchWorkoutData = async () => {
    if (!userId || !selectedEx) { setWorkoutLoading(false); return; }
    setWorkoutLoading(true);
    setWorkoutTooltip(null);
    setWorkoutActiveIdx(null);
    setWorkoutError(null);
    workoutLoadingTimeout.current = setTimeout(() => {
      setWorkoutLoading(false);
      setWorkoutError('Timed out loading workout data. Pull down to retry.');
    }, 15000);
    try {
      const now = new Date();
      let startDate: Date | null = null;
      if (workoutRange === '1M') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1); }
      if (workoutRange === '3M') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 3); }
      if (workoutRange === '6M') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 6); }

      let query = supabase
        .from('exercise_progression')
        .select('session_date, weight, reps, set_number')
        .eq('user_id', userId)
        .eq('exercise_id', selectedEx)
        .order('session_date', { ascending: true });

      if (startDate) query = query.gte('session_date', startDate.toISOString().split('T')[0]);

      const { data, error } = await query;
      if (error) throw error;

      const grouped = new Map<string, { weights: number[]; totalSets: number; reps: number[] }>();
      for (const row of data || []) {
        const date = row.session_date;
        if (!grouped.has(date)) grouped.set(date, { weights: [], totalSets: 0, reps: [] });
        const g = grouped.get(date)!;
        g.weights.push(Number(row.weight) || 0);
        g.totalSets++;
        if (row.reps) g.reps.push(Number(row.reps));
      }

      const points: WorkoutDataPoint[] = Array.from(grouped.entries())
        .map(([date, g]) => ({
          date,
          max_weight: Math.max(...g.weights, 0),
          sets: g.totalSets,
          max_reps: Math.max(...g.reps, 0),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (workoutRange === 'All') {
        setWorkoutData(points);
      } else {
        setWorkoutData(points.slice(-8));
      }
      setWorkoutError(null);
    } catch (e: any) {
      console.error('fetchWorkoutData:', e);
      setWorkoutError(e.message || 'Could not load workout data.');
    } finally {
      if (workoutLoadingTimeout.current) { clearTimeout(workoutLoadingTimeout.current); workoutLoadingTimeout.current = null; }
      setWorkoutLoading(false);
    }
  };

  const chartWorkoutData: DataPoint[] = useMemo(() =>
    workoutData.map(d => ({ label: formatDate(d.date), value: d.max_weight, date: d.date, meta: d })),
    [workoutData]
  );

  const pb = useMemo(() => {
    if (workoutData.length === 0) return null;
    return workoutData.reduce((best, d) => d.max_weight > best.max_weight ? d : best, workoutData[0]);
  }, [workoutData]);

  const lastSession = useMemo(() => {
    if (workoutData.length === 0) return null;
    return workoutData[workoutData.length - 1];
  }, [workoutData]);

  const selectedExName = useMemo(() => {
    return exercises.find(e => e.id === selectedEx)?.name || '';
  }, [exercises, selectedEx]);

  // ── Section 2: Calories ──
  const fetchCalorieData = async () => {
    if (!userId) { setCalLoading(false); return; }
    setCalLoading(true);
    setCalTooltip(null);
    setCalActiveIdx(null);
    setCalError(null);
    calLoadingTimeout.current = setTimeout(() => {
      setCalLoading(false);
      setCalError('Timed out loading calorie data. Pull down to retry.');
    }, 15000);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      if (calRange === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (calRange === '4W') {
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 27);
        startDate.setHours(0, 0, 0, 0);
      } else {
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
      }

      const { data, error } = await supabase
        .from('meal_logs')
        .select('calories, protein_g, carbs_g, fat_g, logged_at')
        .eq('user_id', userId)
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', endDate.toISOString())
        .order('logged_at', { ascending: true });
      if (error) throw error;

      const grouped = new Map<string, { cal: number; pro: number; carb: number; fat: number }>();
      for (const row of data || []) {
        const d = new Date(row.logged_at).toISOString().split('T')[0];
        if (!grouped.has(d)) grouped.set(d, { cal: 0, pro: 0, carb: 0, fat: 0 });
        const g = grouped.get(d)!;
        g.cal += Number(row.calories) || 0;
        g.pro += Number(row.protein_g) || 0;
        g.carb += Number(row.carbs_g) || 0;
        g.fat += Number(row.fat_g) || 0;
      }

      let points: CalorieDataPoint[];
      if (calRange === 'week') {
        points = DAY_LABELS.map((_, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const key = d.toISOString().split('T')[0];
          const g = grouped.get(key);
          return {
            date: key,
            calories: g?.cal || 0,
            protein: g?.pro || 0,
            carbs: g?.carb || 0,
            fat: g?.fat || 0,
          };
        });
      } else {
        points = Array.from(grouped.entries()).map(([date, g]) => ({
          date,
          calories: g.cal,
          protein: g.pro,
          carbs: g.carb,
          fat: g.fat,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      setCalorieData(points);
      setCalError(null);
    } catch (e: any) {
      console.error('fetchCalorieData:', e);
      setCalError(e.message || 'Could not load calorie data.');
    } finally {
      if (calLoadingTimeout.current) { clearTimeout(calLoadingTimeout.current); calLoadingTimeout.current = null; }
      setCalLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchCalorieData();
  }, [calRange, userId]);

  const chartCalData: DataPoint[] = useMemo(() => {
    if (calRange === 'week') {
      return calorieData.map((d, i) => ({ label: DAY_LABELS[i] || '', value: d.calories, date: d.date, meta: d }));
    }
    return calorieData.map(d => ({ label: formatDate(d.date), value: d.calories, date: d.date, meta: d }));
  }, [calorieData, calRange]);

  const calStats = useMemo(() => {
    if (calorieData.length === 0) return null;
    const withData = calorieData.filter(d => d.calories > 0);
    const avg = withData.length > 0 ? Math.round(withData.reduce((s, d) => s + d.calories, 0) / withData.length) : 0;
    const highest = withData.length > 0 ? Math.round(Math.max(...withData.map(d => d.calories))) : 0;
    return { avg, highest };
  }, [calorieData]);

  // ── Section 3: Body Weight ──
  const fetchWeightData = async () => {
    if (!userId) { setWeightLoading(false); return; }
    setWeightLoading(true);
    setWeightTooltip(null);
    setWeightActiveIdx(null);
    setWeightError(null);
    weightLoadingTimeout.current = setTimeout(() => {
      setWeightLoading(false);
      setWeightError('Timed out loading weight data. Pull down to retry.');
    }, 15000);
    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('weight_kg, logged_at')
        .eq('user_id', userId)
        .order('logged_at', { ascending: true });
      if (error) throw error;

      const pts = (data || []).map(r => ({
        date: new Date(r.logged_at).toISOString().split('T')[0],
        weight: Number(r.weight_kg) || 0,
      }));

      const now = new Date();
      let startDate: Date | null = null;
      if (weightRange === '1W') { startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); }
      if (weightRange === '1M') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1); }
      if (weightRange === '3M') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 3); }

      const filtered = startDate ? pts.filter(p => new Date(p.date) >= startDate!) : pts;
      setWeightData(filtered);
      setWeightError(null);
    } catch (e: any) {
      console.error('fetchWeightData:', e);
      setWeightError(e.message || 'Could not load weight data.');
    } finally {
      if (weightLoadingTimeout.current) { clearTimeout(weightLoadingTimeout.current); weightLoadingTimeout.current = null; }
      setWeightLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchWeightData();
  }, [weightRange, userId]);

  const chartWeightData: DataPoint[] = useMemo(() => {
    const unit = weightUnit;
    return weightData.map(d => ({
      label: formatDate(d.date),
      value: unit === 'lbs' ? Math.round(d.weight * 2.20462 * 10) / 10 : d.weight,
      date: d.date,
      meta: d,
    }));
  }, [weightData, weightUnit]);

  const weightStats = useMemo(() => {
    if (weightData.length === 0) return null;
    const first = weightData[0];
    const last = weightData[weightData.length - 1];
    const change = last.weight - first.weight;
    const unit = weightUnit;
    const val = (v: number) => unit === 'lbs' ? Math.round(v * 2.20462 * 10) / 10 : Math.round(v * 10) / 10;
    return {
      start: val(first.weight),
      startDate: first.date,
      current: val(last.weight),
      currentDate: last.date,
      change: val(change),
    };
  }, [weightData, weightUnit]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchExercises(), fetchCalorieData(), fetchWeightData()]);
    setRefreshing(false);
  }, [userId]);

  const handleSaveWeight = async () => {
    if (!userId || !weightInput) return;
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;
    const kgVal = weightUnit === 'lbs' ? Math.round(w / 2.20462 * 100) / 100 : Math.round(w * 100) / 100;
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: existing } = await supabase
        .from('weight_logs')
        .select('id')
        .eq('user_id', userId)
        .gte('logged_at', todayStart.toISOString())
        .lte('logged_at', todayEnd.toISOString())
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('weight_logs')
          .update({ weight_kg: kgVal, logged_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('weight_logs').insert({
          user_id: userId,
          weight_kg: kgVal,
          logged_at: new Date().toISOString(),
        });
        if (insertError) throw insertError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ weight_kg: kgVal })
        .eq('id', userId);
      if (profileError) throw profileError;

      useUserStore.getState().setHealthProfile({ weight: kgVal });

      setShowWeightSheet(false);
      setWeightInput('');
      await fetchWeightData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const todayCalories = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const entry = calorieData.find(d => d.date === today);
    return entry?.calories ?? null;
  }, [calorieData]);

  const latestWeight = useMemo(() => {
    if (weightData.length === 0) return null;
    return weightData[weightData.length - 1].weight;
  }, [weightData]);

  const todayWeightEntry = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return weightData.find(d => d.date === today) || null;
  }, [weightData]);

  const hasLoggedWeightToday = !!todayWeightEntry;

  const weightModalTitle = hasLoggedWeightToday ? 'Update Today\'s Weight' : 'Log Today\'s Weight';
  const weightSaveLabel = hasLoggedWeightToday ? 'Update Weight' : 'Save Weight';

  // ── Computed insights ──
  const activeDaysThisWeek = useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString().split('T')[0];
    const days = new Set(calorieData.filter(d => d.date >= weekStart && d.calories > 0).map(d => d.date));
    weightData.filter(d => d.date >= weekStart).forEach(d => days.add(d.date));
    return days.size;
  }, [calorieData, weightData]);

  const weightTrendLabel = useMemo(() => {
    if (!weightStats || weightStats.change === 0) return null;
    const dir = weightStats.change > 0 ? 'up' : 'down';
    const isGood = isLossGoal ? dir === 'down' : dir === 'up';
    return {
      direction: dir as 'up' | 'down',
      label: `${isGood ? '+' : ''}${weightStats.change.toFixed(1)} ${weightUnit} overall`,
    };
  }, [weightStats, weightUnit, isLossGoal]);

  const calTrendLabel = useMemo(() => {
    if (!calStats || !calGoal) return null;
    const diff = calStats.avg - calGoal;
    const direction = diff > 50 ? 'up' : diff < -50 ? 'down' : 'flat';
    return {
      direction: direction as 'up' | 'down' | 'flat',
      label: direction === 'flat' ? 'On track' : `${diff > 0 ? '+' : ''}${Math.round(diff)} vs goal`,
    };
  }, [calStats, calGoal]);

  // ── Weight range options ──
  const calFilterOptions: FilterPill[] = [
    { key: 'week', label: 'Week' },
    { key: '4W', label: 'Month' },
    { key: '3M', label: '3M' },
  ];

  const workoutFilterOptions: FilterPill[] = [
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
    { key: '6M', label: '6M' },
    { key: 'All', label: 'All' },
  ];

  const weightFilterOptions: FilterPill[] = [
    { key: '1W', label: '1W' },
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
    { key: 'All', label: 'All' },
  ];

  return (
    <View style={rootSt.screen}>
      <SafeAreaView style={rootSt.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={rootSt.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />
          }
        >
          {/* ═══════════════ HEADER ═══════════════ */}
          <Animated.View entering={FadeInDown.delay(0).duration(400)} style={headerSt.wrapper}>
            <View style={headerSt.topRow}>
              <View style={headerSt.left}>
                <Text style={headerSt.title}>Progress</Text>
                <Text style={headerSt.subtitle}>{firstName}'s analytics</Text>
              </View>
              <TouchableOpacity style={headerSt.syncBtn} onPress={onRefresh} activeOpacity={0.7}>
                <Feather name="refresh-cw" size={16} color={PURPLE} />
              </TouchableOpacity>
            </View>
            <View style={headerSt.metaRow}>
              <View style={headerSt.streakBadge}>
                <Feather name="zap" size={12} color={ORANGE} />
                <Text style={headerSt.streakText}>{activeDaysThisWeek} day streak</Text>
              </View>
              <View style={headerSt.streakBadge}>
                <View style={headerSt.liveDot} />
                <Text style={headerSt.streakText}>Updated now</Text>
              </View>
            </View>
          </Animated.View>

          {/* ═══════════════ INSIGHTS DASHBOARD ═══════════════ */}
          <View style={gridSt.container}>
            <View style={gridSt.row}>
              <MetricCard
                label="Today's Calories"
                value={todayCalories != null ? `${Math.round(todayCalories)}` : '—'}
                sublabel={todayCalories != null && calGoal ? `of ${calGoal} kcal goal` : 'Log a meal to start'}
                accent={ORANGE}
                icon="pie-chart"
                trend={calTrendLabel || undefined}
                delay={60}
              />
              <View style={{ width: GRID_GAP }} />
              <MetricCard
                label="Body Weight"
                value={latestWeight ? `${weightUnit === 'lbs' ? (latestWeight * 2.20462).toFixed(1) : latestWeight.toFixed(1)}` : '—'}
                sublabel={latestWeight ? weightUnit : 'Log your weight'}
                accent={PURPLE}
                icon="activity"
                trend={weightTrendLabel || undefined}
                delay={120}
              />
            </View>
            <View style={{ height: GRID_GAP }} />
            <View style={gridSt.row}>
              <MetricCard
                label="Exercises Tracked"
                value={`${exercises.length}`}
                sublabel={exercises.length > 0 ? `${exercises.reduce((s, e) => s + e.count, 0)} total entries` : 'No data yet'}
                icon="activity"
                delay={180}
              />
              <View style={{ width: GRID_GAP }} />
              <MetricCard
                label="Avg. Daily Calories"
                value={calStats?.avg ? `${calStats.avg}` : '—'}
                sublabel={calStats?.avg ? 'kcal / day' : 'Track to see'}
                icon="bar-chart-2"
                delay={240}
              />
            </View>
          </View>

          {/* ═══════════════ CALORIES SECTION ═══════════════ */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <AnalyticsSectionHeader
              title="Calories"
              value={todayCalories != null ? `${Math.round(todayCalories)} today` : 'No data'}
              trend={calTrendLabel || undefined}
              icon="🔥"
            />
            <View style={cardSt.wrapper}>
              <View style={cardSt.filterRow}>
                <FilterRow options={calFilterOptions} selected={calRange} onSelect={(k) => setCalRange(k as typeof calRange)} compact />
              </View>

              {calError ? (
                <View style={{ paddingVertical: 20, alignItems: 'center', gap: 8 }}>
                  <Feather name="alert-circle" size={20} color={RED} />
                  <Text style={{ fontSize: 13, color: MUTED, textAlign: 'center' }}>{calError}</Text>
                </View>
              ) : calLoading && calorieData.length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: MUTED }}>Loading...</Text>
                </View>
              ) : calorieData.length === 0 ? (
                <AnalyticsEmptyState
                  title="No calorie data yet"
                  subtitle="Start tracking your meals in the Nutrition tab"
                  actionLabel="Go to Nutrition"
                  onAction={() => router.push('/(tabs)/food')}
                  icon="pie-chart"
                />
              ) : (
                <>
                  <View style={cardSt.chartArea}>
                    <TooltipBox
                      title={calTooltip?.point.date ? formatDateFull(calTooltip.point.date) : ''}
                      lines={calTooltip ? [
                        `${Math.round(calTooltip.point.calories)} kcal`,
                        `P: ${Math.round(calTooltip.point.protein)}g · C: ${Math.round(calTooltip.point.carbs)}g · F: ${Math.round(calTooltip.point.fat)}g`,
                      ] : []}
                      x={calTooltip?.x ?? 0}
                      visible={!!calTooltip}
                    />
                    <BarChartPremium
                      data={chartCalData}
                      color={ORANGE}
                      goalLine={calGoal || undefined}
                      onBarTap={(p, i) => {
                        const meta = p.meta as CalorieDataPoint;
                        if (meta.calories === 0) return;
                        const screenX = (i / Math.max(chartCalData.length - 1, 1)) * CHART_W + 20;
                        setCalTooltip({ point: meta, x: screenX });
                        setCalActiveIdx(i);
                      }}
                      highlightIndex={calActiveIdx ?? undefined}
                    />
                  </View>
                  <View style={cardSt.statsRow}>
                    <StatChip label="Avg / day" value={calStats ? `${calStats.avg}` : '—'} />
                    <StatChip label="Highest" value={calStats ? `${calStats.highest}` : '—'} />
                    <StatChip label="Goal" value={calGoal ? `${calGoal}` : 'Not set'} accent={calGoal ? PURPLE : undefined} />
                  </View>
                </>
              )}
            </View>
          </Animated.View>

          {/* ═══════════════ BODY WEIGHT SECTION ═══════════════ */}
          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <AnalyticsSectionHeader
              title="Body Weight"
              value={latestWeight ? `${weightUnit === 'lbs' ? (latestWeight * 2.20462).toFixed(1) : latestWeight.toFixed(1)} ${weightUnit}` : 'No data'}
              trend={weightTrendLabel || undefined}
              icon="⚖️"
            />
            <View style={cardSt.wrapper}>
              <View style={cardSt.filterRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <FilterRow options={weightFilterOptions} selected={weightRange} onSelect={(k) => setWeightRange(k as typeof weightRange)} compact />
                </View>
                <View style={unitToggleSt.wrapper}>
                  {(['kg', 'lbs'] as const).map(u => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setWeightUnit(u)}
                      style={[unitToggleSt.pill, weightUnit === u && unitToggleSt.activePill]}
                    >
                      <Text style={[unitToggleSt.text, weightUnit === u && unitToggleSt.activeText]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {weightError ? (
                <View style={{ paddingVertical: 20, alignItems: 'center', gap: 8 }}>
                  <Feather name="alert-circle" size={20} color={RED} />
                  <Text style={{ fontSize: 13, color: MUTED, textAlign: 'center' }}>{weightError}</Text>
                </View>
              ) : weightLoading && weightData.length === 0 ? (
                <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: MUTED }}>Loading...</Text>
                </View>
              ) : weightData.length < 2 ? (
                <AnalyticsEmptyState
                  title="Not enough data"
                  subtitle="Log your weight daily to see your trend over time"
                  actionLabel="Log Today's Weight"
                  onAction={() => setShowWeightSheet(true)}
                  icon="activity"
                />
              ) : (
                <>
                  <View style={cardSt.chartArea}>
                    <TooltipBox
                      title={weightTooltip?.point.date ? formatDateFull(weightTooltip.point.date) : ''}
                      lines={weightTooltip ? (() => {
                        const idx = weightData.findIndex(d => d.date === weightTooltip.point.date);
                        const prev = idx > 0 ? weightData[idx - 1] : null;
                        const change = prev ? (weightTooltip.point.weight - prev.weight) : 0;
                        return [
                          `${weightUnit === 'lbs' ? (weightTooltip.point.weight * 2.20462).toFixed(1) : weightTooltip.point.weight.toFixed(1)} ${weightUnit}`,
                          `Change: ${change >= 0 ? '+' : ''}${change.toFixed(1)} ${weightUnit}`,
                        ];
                      })() : []}
                      x={weightTooltip?.x ?? 0}
                      visible={!!weightTooltip}
                    />
                    <AreaChartPremium
                      data={chartWeightData}
                      color={PURPLE}
                      onPointTap={(p, i) => {
                        const screenX = (i / Math.max(chartWeightData.length - 1, 1)) * CHART_W + 30;
                        const meta = p.meta as WeightDataPoint;
                        setWeightTooltip({ point: meta, x: screenX });
                        setWeightActiveIdx(i);
                      }}
                      activePoint={weightActiveIdx ?? undefined}
                    />
                  </View>
                  {weightStats && (
                    <View style={cardSt.statsRow}>
                      <StatChip label={`Start · ${formatDate(weightStats.startDate)}`} value={`${weightStats.start}`} />
                      <StatChip label={`Current · ${formatDate(weightStats.currentDate)}`} value={`${weightStats.current}`} />
                      <StatChip
                        label="Change"
                        value={`${weightStats.change >= 0 ? '+' : ''}${weightStats.change}`}
                        accent={weightStats.change === 0 ? undefined : (isLossGoal ? (weightStats.change < 0 ? GREEN : RED) : (weightStats.change > 0 ? GREEN : RED))}
                      />
                    </View>
                  )}
                    <TouchableOpacity
                      style={logWeightSt.btn}
                      onPress={() => {
                        if (todayWeightEntry) {
                          const display = weightUnit === 'lbs'
                            ? (todayWeightEntry.weight * 2.20462).toFixed(1)
                            : todayWeightEntry.weight.toFixed(1);
                          setWeightInput(display);
                        } else {
                          setWeightInput('');
                        }
                        setShowWeightSheet(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient colors={['rgba(106,73,250,0.12)', 'rgba(106,73,250,0.04)']} style={logWeightSt.grad}>
                        <Feather name={hasLoggedWeightToday ? "edit-2" : "plus"} size={15} color={PURPLE} />
                        <Text style={logWeightSt.text}>{hasLoggedWeightToday ? "Update Today's Weight" : "Log Today's Weight"}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>

          {/* ═══════════════ WORKOUT PROGRESS SECTION ═══════════════ */}
          <Animated.View entering={FadeInDown.delay(260).duration(400)}>
            <AnalyticsSectionHeader
              title="Workout Progress"
              value={`${exercises.length} exercises`}
              icon="💪"
            />
            <View style={cardSt.wrapper}>
              {exercises.length === 0 ? (
                <AnalyticsEmptyState
                  title="No workout data yet"
                  subtitle="Complete your first workout to see exercise progress"
                  actionLabel="Start Workout"
                  onAction={() => router.push('/(tabs)/train')}
                  icon="zap"
                />
              ) : (
                <>
                  {/* Exercise chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 2 }}>
                      {exercises.map(ex => (
                        <TouchableOpacity
                          key={ex.id}
                          onPress={() => setSelectedEx(ex.id)}
                          style={[chipSt.base, selectedEx === ex.id && chipSt.active]}
                          activeOpacity={0.7}
                        >
                          <Text style={[chipSt.text, selectedEx === ex.id && chipSt.activeText]}>
                            {ex.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  {/* Filter */}
                  <View style={cardSt.filterRow}>
                    <FilterRow options={workoutFilterOptions} selected={workoutRange} onSelect={(k) => setWorkoutRange(k as typeof workoutRange)} compact />
                  </View>

                  {workoutError ? (
                    <View style={{ paddingVertical: 20, alignItems: 'center', gap: 8 }}>
                      <Feather name="alert-circle" size={20} color={RED} />
                      <Text style={{ fontSize: 13, color: MUTED, textAlign: 'center' }}>{workoutError}</Text>
                    </View>
                  ) : workoutLoading && workoutData.length === 0 ? (
                    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: MUTED }}>Loading...</Text>
                    </View>
                  ) : workoutData.length < 2 ? (
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: MUTED, textAlign: 'center' }}>
                        Not enough data yet. Complete more sessions to see {selectedExName} progress.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={cardSt.chartArea}>
                        <TooltipBox
                          title={workoutTooltip?.point.date ? formatDateFull(workoutTooltip.point.date) : ''}
                          lines={workoutTooltip ? [
                            `Max: ${workoutTooltip.point.max_weight} kg`,
                            `Sets: ${workoutTooltip.point.sets} · Reps: ${workoutTooltip.point.max_reps}`,
                          ] : []}
                          x={workoutTooltip?.x ?? 0}
                          visible={!!workoutTooltip}
                        />
                        <LineChartPremium
                          data={chartWorkoutData}
                          color={PURPLE}
                          onPointTap={(p, i) => {
                            const screenX = (i / Math.max(chartWorkoutData.length - 1, 1)) * CHART_W + 30;
                            const meta = p.meta as WorkoutDataPoint;
                            setWorkoutTooltip({ point: meta, x: screenX });
                            setWorkoutActiveIdx(i);
                          }}
                          activePoint={workoutActiveIdx ?? undefined}
                        />
                      </View>
                      <View style={cardSt.statsRow}>
                        <StatChip
                          label={`Personal Best${pb ? ` · ${formatDate(pb.date)}` : ''}`}
                          value={pb ? `${pb.max_weight} kg` : '—'}
                        />
                        <StatChip
                          label={`Last Session${lastSession ? ` · ${formatDate(lastSession.date)}` : ''}`}
                          value={lastSession ? `${lastSession.max_weight} kg` : '—'}
                        />
                      </View>
                    </>
                  )}
                </>
              )}
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Log Weight Modal ── */}
      <Modal visible={showWeightSheet} transparent animationType="slide">
        <TouchableOpacity
          style={modalSt.backdrop}
          activeOpacity={1}
          onPress={() => setShowWeightSheet(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={modalSt.sheet}>
            <View style={modalSt.handle} />
            <Text style={modalSt.title}>{weightModalTitle}</Text>

            <View style={modalSt.inputRow}>
              <TextInput
                style={modalSt.input}
                placeholder="0.0"
                placeholderTextColor="#C7C7CC"
                keyboardType="decimal-pad"
                value={weightInput}
                onChangeText={setWeightInput}
                autoFocus
              />
              <Text style={modalSt.unit}>{weightUnit}</Text>
            </View>

            <Text style={modalSt.date}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>

            <TouchableOpacity
              style={[modalSt.saveBtn, (!weightInput || isNaN(parseFloat(weightInput))) && modalSt.saveBtnDisabled]}
              onPress={handleSaveWeight}
              disabled={!weightInput || isNaN(parseFloat(weightInput))}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[PURPLE, '#5A3DE0']} style={modalSt.saveGrad}>
                <Text style={modalSt.saveText}>{weightSaveLabel}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const rootSt = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: 12 },
});

// ── Header ──
const headerSt = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, marginBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  left: {},
  title: { fontSize: 30, fontWeight: '800', color: PRIMARY, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '500', color: MUTED, marginTop: 2 },
  syncBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: PURPLE_GLOW, alignItems: 'center', justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  streakText: { fontSize: 11, fontWeight: '600', color: MUTED },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },
});

// ── Insights Grid ──
const gridSt = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 8 },
  row: { flexDirection: 'row' },
});

// ── Card ──
const cardSt = StyleSheet.create({
  wrapper: {
    backgroundColor: CARD_BG, borderRadius: CARD_RADIUS, marginHorizontal: 16,
    padding: 16, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    marginBottom: 8,
  },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chartArea: { position: 'relative', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
});

// ── Exercise Chips ──
const chipSt = StyleSheet.create({
  base: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12,
    backgroundColor: '#F0EFF5',
  },
  active: { backgroundColor: PURPLE },
  text: { fontSize: 12, fontWeight: '600', color: MUTED },
  activeText: { color: '#FFFFFF' },
});

// ── Unit Toggle ──
const unitToggleSt = StyleSheet.create({
  wrapper: { flexDirection: 'row', backgroundColor: '#F0EFF5', borderRadius: 8, padding: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activePill: { backgroundColor: '#FFFFFF' },
  text: { fontSize: 11, fontWeight: '600', color: MUTED },
  activeText: { color: PURPLE },
});

// ── Log Weight ──
const logWeightSt = StyleSheet.create({
  btn: { borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  grad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: PURPLE_GLOW,
  },
  text: { fontSize: 14, fontWeight: '700', color: PURPLE },
});

// ── Modal ──
const modalSt = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: CARD_BG, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, paddingTop: 12,
  },
  handle: { width: 36, height: 4, backgroundColor: '#E5E5EA', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800', color: PRIMARY, textAlign: 'center', marginBottom: 24 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  input: {
    fontSize: 40, fontWeight: '800', color: PRIMARY, textAlign: 'center',
    borderBottomWidth: 2, borderBottomColor: PURPLE, minWidth: 120, paddingVertical: 4,
  },
  unit: { fontSize: 20, fontWeight: '600', color: MUTED },
  date: { fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 28 },
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.5 },
  saveGrad: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
