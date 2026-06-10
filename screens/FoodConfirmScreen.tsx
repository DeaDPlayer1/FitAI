import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';
import { getDb } from '@/lib/db';
import {
  analyzeFood, verifyAndCrossCheck,
  type FoodAnalysisItem, type FoodDataSource,
} from '@/lib/nutritionAI';
import { canonicalizeFoodName } from '@/lib/foodCanonicalMap';

export interface FoodConfirmParams {
  imageUri?: string;
  aiDescription?: string;
  voiceTranscript?: string;
  items: FoodAnalysisItem[];
  inputType: 'camera' | 'gallery' | 'voice' | 'text' | 'barcode';
}

interface ItemState {
  name: string;
  grams: number;
  cal100: number;
  prot100: number;
  carb100: number;
  fat100: number;
  fiber100: number;
  confidence?: number;
  chain?: string;
  servingLabel?: string;
  isRestaurant?: boolean;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalFiber?: number;
}

interface RecentFood {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_grams: number;
  last_grams_used: number;
  last_meal_type: string;
  log_count: number;
}

interface DailyProgress {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalCalories: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
}

const C = {
  bg: '#F8F7FF',
  surface: '#FFFFFF',
  primary: '#6C3CE1',
  purpleDeep: '#4F28B8',
  text: '#1A1A2E',
  muted: '#9CA3AF',
  border: '#F0EDFF',
  inputBg: '#F5F3FF',
  inputBorder: '#DDD6FE',
  cal: '#F97316',
  prot: '#EC4899',
  carb: '#F59E0B',
  fat: '#3B82F6',
  fiber: '#10B981',
};

function scaleItem(item: ItemState) {
  if (item.isRestaurant && item.totalCalories != null) {
    const qty = Math.max(1, Math.round(item.grams));
    return {
      cal: Math.round(item.totalCalories * qty),
      prot: round1((item.totalProtein || 0) * qty),
      carb: round1((item.totalCarbs || 0) * qty),
      fat: round1((item.totalFat || 0) * qty),
      fiber: round1((item.totalFiber || 0) * qty),
    };
  }
  const r = item.grams / 100;
  return {
    cal: Math.round(item.cal100 * r),
    prot: round1(item.prot100 * r),
    carb: round1(item.carb100 * r),
    fat: round1(item.fat100 * r),
    fiber: round1(item.fiber100 * r),
  };
}

function getMealTypeByTime(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 10 && h < 14) return 'lunch';
  if (h >= 14 && h < 18) return 'snack';
  if (h >= 18 && h < 22) return 'dinner';
  return 'snack';
}

function getMealEmoji(type: string): string {
  switch (type) {
    case 'breakfast': return '🌅';
    case 'lunch': return '☀️';
    case 'dinner': return '🌙';
    default: return '🍎';
  }
}

function MacroBalance({ totals }: { totals: { cal: number; prot: number; carb: number; fat: number } }) {
  const totalCal = totals.cal || 1;
  const pPct = Math.round(totals.prot * 4 / totalCal * 100);
  const cPct = Math.round(totals.carb * 4 / totalCal * 100);
  const fPct = Math.round(totals.fat * 9 / totalCal * 100);

  const label = (pct: number, low: number, high: number) =>
    pct < low ? 'Low' : pct > high ? 'High' : 'Mod';

  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
      <Pill label={`${label(pPct, 10, 20)} P`} color="#EC4899" pct={pPct} />
      <Pill label={`${label(cPct, 45, 65)} C`} color="#F59E0B" pct={cPct} />
      <Pill label={`${label(fPct, 20, 35)} F`} color="#3B82F6" pct={fPct} />
    </View>
  );
}

function Pill({ label, color, pct }: { label: string; color: string; pct: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{label}</Text>
      <Text style={{ fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.5)' }}>{pct}%</Text>
    </View>
  );
}

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444';
  const label = pct >= 80 ? 'High' : pct >= 50 ? 'Medium' : 'Low';
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: color + '18', borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 3,
    }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 10, fontWeight: '700', color }}>{label}</Text>
      <Text style={{ fontSize: 9, fontWeight: '500', color: color + 'AA' }}>{pct}%</Text>
    </View>
  );
}

function DailyGoalCard({ progress, totals }: { progress: DailyProgress; totals: { cal: number; prot: number; carb: number; fat: number } }) {
  const calPct = Math.min(totals.cal / progress.goalCalories, 1);
  const remaining = progress.goalCalories - (progress.calories + totals.cal);
  const isOver = remaining < 0;

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={{
      backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16,
      borderWidth: 1, borderColor: C.border,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Daily Goal
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '600', color: isOver ? '#EF4444' : C.primary }}>
          {isOver ? `${Math.abs(remaining)} over` : `${Math.round(remaining)} left`}
        </Text>
      </View>

      <View style={{ height: 8, borderRadius: 4, backgroundColor: C.border, overflow: 'hidden', marginBottom: 4 }}>
        <View style={{
          height: '100%', borderRadius: 4,
          width: `${Math.min(calPct * 100, 100)}%`,
          backgroundColor: isOver ? '#EF4444' : C.primary,
        }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, fontWeight: '500', color: C.muted }}>
          {progress.calories + totals.cal} / {progress.goalCalories} kcal
        </Text>
        <Text style={{ fontSize: 11, fontWeight: '500', color: isOver ? '#EF4444' : C.muted }}>
          {Math.round(calPct * 100)}%
        </Text>
      </View>
    </Animated.View>
  );
}

function getMealInsight(totals: { prot: number; carb: number; fat: number }): { text: string; icon: string; color: string } {
  const protPct = totals.prot * 4 / (totals.prot * 4 + totals.carb * 4 + totals.fat * 9) * 100 || 0;
  const carbPct = totals.carb * 4 / (totals.prot * 4 + totals.carb * 4 + totals.fat * 9) * 100 || 0;
  const fatPct = totals.fat * 9 / (totals.prot * 4 + totals.carb * 4 + totals.fat * 9) * 100 || 0;

  if (protPct < 10 && totals.prot < 10) {
    return { text: 'Low protein — add a lean protein source', icon: 'alert-triangle', color: '#EF4444' };
  }
  if (carbPct > 65 && totals.carb > 60) {
    return { text: 'Higher-carb meal — balance with protein later', icon: 'alert-circle', color: '#F59E0B' };
  }
  if (fatPct > 40 && totals.fat > 30) {
    return { text: 'Higher-fat meal — watch portions', icon: 'info', color: '#3B82F6' };
  }
  if (protPct > 30 && totals.prot > 30) {
    return { text: 'High protein — great for muscle recovery', icon: 'check-circle', color: '#22C55E' };
  }
  return { text: 'Balanced meal — keep it up!', icon: 'check-circle', color: '#22C55E' };
}

export default function FoodConfirmScreen({ params, onClose }: {
  params: FoodConfirmParams;
  onClose: () => void;
}) {
  const { user } = useUserStore();

  const [itemStates, setItemStates] = useState<ItemState[]>([]);
  const [mealType, setMealType] = useState(getMealTypeByTime());
  const [saving, setSaving] = useState(false);
  const [showAddSearch, setShowAddSearch] = useState(false);
  const [addSearchText, setAddSearchText] = useState('');
  const [addSearchLoading, setAddSearchLoading] = useState(false);
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);

  useEffect(() => {
    (async () => {
      const verifiedItems: FoodAnalysisItem[] = [];
      for (const item of params.items) {
        const v = await verifyAndCrossCheck(item);
        verifiedItems.push({ ...v, name: canonicalizeFoodName(v.name) });
      }
      setItemStates(verifiedItems.map(i => ({
        name: i.name,
        grams: i.isRestaurant ? 1 : i.grams,
        cal100: i.calories_per_100g,
        prot100: i.protein_per_100g,
        carb100: i.carbs_per_100g,
        fat100: i.fat_per_100g,
        fiber100: i.fiber_per_100g,
        confidence: i.confidence,
        chain: i.chain,
        servingLabel: i.servingLabel,
        isRestaurant: i.isRestaurant,
        totalCalories: i.totalCalories,
        totalProtein: i.totalProtein,
        totalCarbs: i.totalCarbs,
        totalFat: i.totalFat,
        totalFiber: i.totalFiber,
      })));
      setInitialized(true);
    })();
  }, []);

  useEffect(() => {
    if (user?.id) loadDailyProgress();
  }, [user]);

  useEffect(() => {
    if (showAddSearch && user?.id) {
      loadRecentFoods();
    }
  }, [showAddSearch]);

  const loadDailyProgress = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('meal_logs')
        .select('calories, protein_g, carbs_g, fat_g')
        .gte('logged_at', today)
        .lt('logged_at', today + 'T23:59:59.999Z')
        .eq('user_id', user?.id);
      const sums = (data || []).reduce((acc: any, r: any) => ({
        calories: acc.calories + (r.calories || 0),
        protein: acc.protein + (r.protein_g || 0),
        carbs: acc.carbs + (r.carbs_g || 0),
        fat: acc.fat + (r.fat_g || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      const goals = (user as any)?.goals || {};
      setDailyProgress({
        ...sums,
        goalCalories: goals.calories || 2000,
        goalProtein: goals.protein || 150,
        goalCarbs: goals.carbs || 250,
        goalFat: goals.fat || 65,
      });
    } catch {}
  };

  const loadRecentFoods = async () => {
    try {
      const db = await getDb();
      const currentMeal = getMealTypeByTime();
      const uid = user?.id || '';
      const freq = await db.getAllAsync<any>(
        `SELECT * FROM user_food_history WHERE user_id = ? AND last_meal_type = ? ORDER BY log_count DESC LIMIT 5`,
        uid, currentMeal
      );
      const recent = await db.getAllAsync<any>(
        `SELECT * FROM user_food_history WHERE user_id = ? ORDER BY last_logged DESC LIMIT 10`,
        uid
      );
      const merged = [...freq];
      for (const r of recent) {
        if (!merged.find((m: any) => m.food_name === r.food_name)) {
          merged.push(r);
        }
      }
      setRecentFoods(merged.slice(0, 10));
    } catch {}
  };

  const totals = useMemo(() =>
    itemStates.reduce(
      (acc, item) => {
        const s = scaleItem(item);
        return {
          cal: acc.cal + s.cal,
          prot: acc.prot + s.prot,
          carb: acc.carb + s.carb,
          fat: acc.fat + s.fat,
          fiber: acc.fiber + s.fiber,
        };
      },
      { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0 }
    ),
    [itemStates]
  );

  const insight = useMemo(() => getMealInsight(totals), [totals]);

  const hasLowConfidence = useMemo(() =>
    itemStates.some(i => i.confidence != null && i.confidence < 0.5),
    [itemStates]
  );

  const updateGrams = useCallback((idx: number, grams: number) => {
    setItemStates(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], grams: Math.max(1, Math.min(5000, grams)) };
      return next;
    });
  }, []);

  const updateName = useCallback((idx: number, name: string) => {
    setItemStates(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], name };
      return next;
    });
  }, []);

  const removeItem = useCallback((idx: number) => {
    setItemStates(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  }, []);

  const addItem = useCallback(() => {
    setShowAddSearch(true);
    setShowRecent(true);
  }, []);

  const addRecentFood = useCallback((recent: RecentFood) => {
    setItemStates(prev => [...prev, {
      name: recent.food_name,
      grams: recent.last_grams_used || recent.serving_grams || 100,
      cal100: recent.calories,
      prot100: recent.protein,
      carb100: recent.carbs,
      fat100: recent.fat,
      fiber100: recent.fiber,
    }]);
    setShowAddSearch(false);
    setShowRecent(false);
    setAddSearchText('');
  }, []);

  const handleAddSearch = useCallback(async () => {
    const text = addSearchText.trim();
    if (!text) return;
    setAddSearchLoading(true);
    try {
      const result = await analyzeFood({ text, userId: user?.id || '' });
      if (result.items.length > 0) {
        const item = result.items[0];
        if (item.isRestaurant) {
          setItemStates(prev => [...prev, {
            name: item.name,
            grams: 1,
            cal100: Math.round(item.calories * 100),
            prot100: Math.round(item.protein * 100 * 10) / 10,
            carb100: Math.round(item.carbs * 100 * 10) / 10,
            fat100: Math.round(item.fat * 100 * 10) / 10,
            fiber100: Math.round(item.fiber * 100 * 10) / 10,
            chain: item.chain,
            servingLabel: item.servingLabel,
            isRestaurant: true,
            totalCalories: item.totalCalories,
            totalProtein: item.totalProtein,
            totalCarbs: item.totalCarbs,
            totalFat: item.totalFat,
            totalFiber: item.totalFiber,
          }]);
        } else {
          const grams = parseInt(item.quantity) || 100;
          const r = 100 / grams;
          setItemStates(prev => [...prev, {
            name: canonicalizeFoodName(item.name),
            grams,
            cal100: Math.round(item.calories * r),
            prot100: Math.round(item.protein * r * 10) / 10,
            carb100: Math.round(item.carbs * r * 10) / 10,
            fat100: Math.round(item.fat * r * 10) / 10,
            fiber100: Math.round(item.fiber * r * 10) / 10,
          }]);
        }
      }
      setShowAddSearch(false);
      setShowRecent(false);
      setAddSearchText('');
    } catch {
      Alert.alert('Not found', 'Could not find that food. Try a simpler name.');
    } finally {
      setAddSearchLoading(false);
    }
  }, [addSearchText, user]);

  const handleLogAll = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to log food.');
      return;
    }
    const valid = itemStates.filter(i => i.name.trim().length > 0 && i.grams > 0);
    if (valid.length === 0) {
      Alert.alert('Missing Info', 'Please enter at least one food item.');
      return;
    }

    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id || user.id;
      const loggedAt = new Date().toISOString();
      const today = loggedAt.split('T')[0];

      for (const item of valid) {
        const foodName = item.name.toLowerCase();

        const existing = await supabase
          .from('meal_logs')
          .select('calories, food_name')
          .eq('user_id', userId)
          .gte('logged_at', today)
          .lt('logged_at', today + 'T23:59:59.999Z')
          .eq('meal_type', mealType)
          .ilike('food_name', foodName);

        if (existing.data && existing.data.length > 0) {
          const proceed = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Already Logged',
              `You already logged ${item.name} for ${mealType} today (${existing.data![0].calories} kcal). Add again anyway?`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Add Anyway', onPress: () => resolve(true) },
              ]
            );
          });
          if (!proceed) continue;
        }

        const s = scaleItem(item);
        const { error } = await supabase.from('meal_logs').insert({
          user_id: userId,
          food_name: item.name,
          calories: s.cal,
          protein_g: s.prot,
          carbs_g: s.carb,
          fat_g: s.fat,
          meal_type: mealType,
          logged_at: loggedAt,
        });
        if (error) throw error;

        const db = await getDb();
        const existingHist = await db.getFirstAsync<any>(
          `SELECT * FROM user_food_history WHERE user_id = ? AND LOWER(food_name) = ?`,
          userId, foodName
        );
        if (existingHist) {
          await db.runAsync(
            `UPDATE user_food_history SET log_count = log_count + 1, last_logged = ?, last_grams_used = ?, last_meal_type = ? WHERE id = ?`,
            loggedAt, item.grams, mealType, existingHist.id
          );
        } else {
          await db.runAsync(
            `INSERT INTO user_food_history (user_id, food_name, aliases, calories, protein, carbs, fat, fiber, serving_size, serving_grams, log_count, last_logged, last_grams_used, last_meal_type, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`,
            userId, foodName, '[]',
            item.cal100, item.prot100, item.carb100, item.fat100, item.fiber100,
            `${item.grams}g`, item.grams, loggedAt, item.grams, mealType, 'ai'
          );
        }

        await db.runAsync(
          `INSERT OR IGNORE INTO food_cache
           (food_name, aliases, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size, serving_grams, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          foodName, '[]',
          item.cal100, item.prot100, item.carb100, item.fat100, item.fiber100,
          `${item.grams}g`, item.grams, 'ai'
        );
      }

      await syncUserData(userId);

      const dailyGoal = (user as any)?.goals?.calories;
      if (dailyGoal) {
        const todayCal = dailyProgress?.calories || 0;
        const newTotal = todayCal + totals.cal;
        const remaining = dailyGoal - newTotal;
        const msg = remaining >= 0
          ? `Logged ✓  ${Math.round(remaining)} kcal remaining today`
          : `Logged ✓  ${Math.abs(Math.round(remaining))} kcal over goal today`;
        Alert.alert('', msg);
      }

      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save food log.');
    } finally {
      setSaving(false);
    }
  };

  const canLog = itemStates.every(i => i.name.trim().length > 0 && i.grams > 0);

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingTop: 60,
        paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.surface,
        borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <TouchableOpacity onPress={onClose} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="arrow-left" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '600', color: C.text, textAlign: 'center' }}>Confirm Food</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {hasLowConfidence && (
          <Animated.View entering={FadeInDown} style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginBottom: 12,
            borderWidth: 1, borderColor: '#FDE68A',
          }}>
            <Feather name="alert-triangle" size={16} color="#D97706" />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#92400E' }}>
              Some items may be inaccurate — please check and edit the values below.
            </Text>
          </Animated.View>
        )}

        {params.imageUri ? (
          <View style={{ position: 'relative', marginBottom: 8 }}>
            <Image source={{ uri: params.imageUri }} style={{ width: '100%', height: 200, borderRadius: 0 }} resizeMode="cover" />
            <TouchableOpacity
              style={{ position: 'absolute', bottom: 8, right: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
              onPress={onClose}
            >
              <Text style={{ fontSize: 16 }}>🔄</Text>
            </TouchableOpacity>
          </View>
        ) : params.inputType === 'text' || params.inputType === 'voice' ? (
          <View style={{
            height: 100, backgroundColor: C.inputBg, borderRadius: 12, marginBottom: 8,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 28 }}>📝</Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: C.muted, marginTop: 4 }}>Analysed from text</Text>
          </View>
        ) : null}

        {(params.aiDescription || params.voiceTranscript) && (
          <View style={{
            flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 12,
            backgroundColor: C.inputBg, borderRadius: 10, padding: 10,
          }}>
            <Text style={{ fontSize: 13 }}>🤖</Text>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: C.primary, lineHeight: 18 }} numberOfLines={2}>
              AI identified: {params.aiDescription || params.voiceTranscript}
            </Text>
          </View>
        )}

        <LinearGradient
          colors={[C.primary, C.purpleDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1.2 }}
          style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.8, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
            {getMealEmoji(mealType)} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#FFFFFF' }}>{totals.cal}</Text>
            <Text style={{ fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>kcal</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>P {totals.prot}g</Text>
            <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>·</Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>C {totals.carb}g</Text>
            <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>·</Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>F {totals.fat}g</Text>
          </View>
          <MacroBalance totals={totals} />
        </LinearGradient>

        <Animated.View entering={FadeInDown.delay(50)} style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: insight.color + '12', borderRadius: 12, padding: 12, marginBottom: 16,
          borderWidth: 1, borderColor: insight.color + '25',
        }}>
          <Feather name={insight.icon as any} size={16} color={insight.color} />
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: insight.color }}>{insight.text}</Text>
        </Animated.View>

        {dailyProgress && (
          <DailyGoalCard progress={dailyProgress} totals={totals} />
        )}

        {itemStates.map((item, idx) => {
          const scaled = scaleItem(item);
          return (
            <Animated.View
              key={`item-${idx}`}
              entering={FadeInDown.delay(idx * 80)}
              style={{
                backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12,
                borderWidth: 1, borderColor: C.border,
                shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <TextInput
                    style={{ flex: 1, fontSize: 16, fontWeight: '700', color: C.text, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: 'transparent', minWidth: 120 }}
                    value={item.name}
                    onChangeText={(t) => updateName(idx, t)}
                    placeholder="Food name"
                    placeholderTextColor={C.muted}
                  />
                  {item.isRestaurant && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      backgroundColor: '#16A34A18', borderRadius: 6,
                      paddingHorizontal: 8, paddingVertical: 3,
                    }}>
                      <Text style={{ fontSize: 11 }}>🍔</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>Restaurant Item</Text>
                    </View>
                  )}
                  <ConfidenceBadge confidence={item.confidence} />
                </View>
                <TouchableOpacity onPress={() => removeItem(idx)} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="x" size={16} color={C.muted} />
                </TouchableOpacity>
              </View>

              {item.chain && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  marginBottom: 8,
                }}>
                  <View style={{
                    backgroundColor: C.primary + '12', borderRadius: 6,
                    paddingHorizontal: 8, paddingVertical: 3,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: C.primary }}>🏪 {item.chain}</Text>
                  </View>
                  {item.servingLabel && (
                    <Text style={{ fontSize: 11, fontWeight: '500', color: C.muted }}>per {item.servingLabel}</Text>
                  )}
                </View>
              )}

              <View style={{ height: 1, backgroundColor: C.border, marginBottom: 12 }} />

              {item.isRestaurant ? (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                    How many {item.servingLabel || 'servings'}?
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <TouchableOpacity
                      style={{
                        width: 44, height: 44, borderRadius: 12,
                        backgroundColor: C.inputBg, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1.5, borderColor: C.inputBorder,
                      }}
                      onPress={() => updateGrams(idx, Math.max(0.5, item.grams - 0.5))}
                    >
                      <Feather name="minus" size={20} color={C.primary} />
                    </TouchableOpacity>
                    <View style={{
                      flex: 1, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: C.inputBg, borderRadius: 12, paddingVertical: 8,
                      borderWidth: 1.5, borderColor: C.primary,
                    }}>
                      <Text style={{ fontSize: 28, fontWeight: '800', color: C.text }}>
                        {Math.round(item.grams)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        width: 44, height: 44, borderRadius: 12,
                        backgroundColor: C.inputBg, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1.5, borderColor: C.inputBorder,
                      }}
                      onPress={() => updateGrams(idx, Math.min(50, item.grams + 0.5))}
                    >
                      <Feather name="plus" size={20} color={C.primary} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                    {[1, 2, 3, 4].map((qty) => (
                      <TouchableOpacity
                        key={qty}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
                          backgroundColor: Math.round(item.grams) === qty ? C.primary : C.inputBg,
                          borderWidth: 1, borderColor: Math.round(item.grams) === qty ? C.primary : C.inputBorder,
                        }}
                        onPress={() => updateGrams(idx, qty)}
                      >
                        <Text style={{
                          fontSize: 13, fontWeight: '700',
                          color: Math.round(item.grams) === qty ? '#FFFFFF' : C.primary,
                        }}>{qty}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>How much?</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <TextInput
                      style={{
                        fontSize: 32, fontWeight: '800', color: C.text,
                        backgroundColor: C.inputBg, borderRadius: 12, paddingHorizontal: 16,
                        paddingVertical: 8, minWidth: 80, textAlign: 'center',
                        borderWidth: 1.5, borderColor: item.grams > 0 ? C.primary : C.inputBorder,
                      }}
                      value={String(Math.round(item.grams))}
                      onChangeText={(t) => {
                        const v = parseInt(t.replace(/[^0-9]/g, ''), 10) || 0;
                        updateGrams(idx, v);
                      }}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      selectTextOnFocus
                    />
                    <Text style={{ fontSize: 16, fontWeight: '600', color: C.muted }}>g</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                    {[50, 100, 200].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                          backgroundColor: item.grams === g ? C.primary : C.inputBg,
                          borderWidth: 1, borderColor: item.grams === g ? C.primary : C.inputBorder,
                        }}
                        onPress={() => updateGrams(idx, g)}
                      >
                        <Text style={{
                          fontSize: 13, fontWeight: '700',
                          color: item.grams === g ? '#FFFFFF' : C.primary,
                        }}>{g}g</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: C.bg, borderRadius: 10, padding: 10,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.cal }}>🔥 {scaled.cal}</Text>
                <Text style={{ fontSize: 12, color: C.muted }}>kcal</Text>
                <Text style={{ fontSize: 10, color: C.muted }}>·</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.prot }}>P {scaled.prot}g</Text>
                <Text style={{ fontSize: 10, color: C.muted }}>·</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.carb }}>C {scaled.carb}g</Text>
                <Text style={{ fontSize: 10, color: C.muted }}>·</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.fat }}>F {scaled.fat}g</Text>
              </View>
            </Animated.View>
          );
        })}

        {showAddSearch ? (
          <Animated.View entering={FadeInDown} style={{
            backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 16,
            borderWidth: 1, borderColor: C.border,
          }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: C.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
              borderWidth: 1.5, borderColor: C.inputBorder,
            }}>
              <Feather name="search" size={16} color={C.muted} />
              <TextInput
                style={{ flex: 1, fontSize: 15, fontWeight: '500', color: C.text, paddingVertical: 4 }}
                value={addSearchText}
                onChangeText={(t) => { setAddSearchText(t); setShowRecent(true); }}
                placeholder="Search food..."
                placeholderTextColor={C.muted}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={handleAddSearch}
              />
            </View>

            {showRecent && recentFoods.length > 0 && addSearchText.length === 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Recent</Text>
                {recentFoods.map((rf, i) => (
                  <TouchableOpacity
                    key={rf.food_name + i}
                    style={{
                      flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4,
                      borderBottomWidth: i < recentFoods.length - 1 ? 1 : 0, borderBottomColor: C.border,
                    }}
                    onPress={() => addRecentFood(rf)}
                  >
                    <Feather name="clock" size={14} color={C.muted} style={{ marginRight: 10 }} />
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: C.text, textTransform: 'capitalize' }}>{rf.food_name}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: C.primary }}>{rf.calories} kcal/100g</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity
                style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 }}
                onPress={() => { setShowAddSearch(false); setShowRecent(false); setAddSearchText(''); }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.muted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: C.primary, paddingVertical: 10, paddingHorizontal: 20,
                  borderRadius: 10, minWidth: 60, alignItems: 'center',
                  opacity: addSearchLoading || !addSearchText.trim() ? 0.5 : 1,
                }}
                onPress={handleAddSearch}
                disabled={addSearchLoading || !addSearchText.trim()}
              >
                {addSearchLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : (
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              paddingVertical: 14, borderRadius: 12, marginBottom: 16,
              borderWidth: 1.5, borderColor: C.primary,
            }}
            onPress={addItem}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={16} color={C.primary} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.primary }}>Add Another Food</Text>
          </TouchableOpacity>
        )}

        <Text style={{ fontSize: 11, fontWeight: '600', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Meal</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
            <TouchableOpacity
              key={type}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                backgroundColor: mealType === type ? C.primary : C.inputBg,
                borderWidth: 1, borderColor: mealType === type ? C.primary : C.inputBorder,
              }}
              onPress={() => setMealType(type)}
            >
              <Text style={{
                fontSize: 13, fontWeight: '600',
                color: mealType === type ? '#FFFFFF' : C.primary,
              }}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        paddingTop: 12, backgroundColor: C.bg,
        borderTopWidth: 1, borderTopColor: C.border,
      }}>
        <TouchableOpacity
          style={{ borderRadius: 16, overflow: 'hidden', opacity: canLog && !saving ? 1 : 0.5 }}
          onPress={handleLogAll}
          disabled={saving || !canLog}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={canLog ? [C.primary, C.purpleDeep] : ['#CBD5E1', '#94A3B8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 24 }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="check" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>Log {totals.cal} kcal</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingVertical: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.muted, textDecorationLine: 'underline' }}>Edit Entry</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
