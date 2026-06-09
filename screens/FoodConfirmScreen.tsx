import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';
import { getDb } from '@/lib/db';
import {
  analyzeFood, verifyAndCrossCheck, canonicalizeFoodName,
  type FoodAnalysisItem, type FoodDataSource,
} from '@/lib/nutritionAI';

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

  useEffect(() => {
    (async () => {
      const verifiedItems: FoodAnalysisItem[] = [];
      for (const item of params.items) {
        const v = await verifyAndCrossCheck(item);
        verifiedItems.push({ ...v, name: canonicalizeFoodName(v.name) });
      }
      setItemStates(verifiedItems.map(i => ({
        name: i.name,
        grams: i.grams,
        cal100: i.calories_per_100g,
        prot100: i.protein_per_100g,
        carb100: i.carbs_per_100g,
        fat100: i.fat_per_100g,
        fiber100: i.fiber_per_100g,
      })));
      setInitialized(true);
    })();
  }, []);

  useEffect(() => {
    if (showAddSearch && user?.id) {
      loadRecentFoods();
    }
  }, [showAddSearch]);

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
      setShowAddSearch(false);
      setShowRecent(false);
      setAddSearchText('');
    } catch {
      Alert.alert('Not found', 'Could not find that food. Try a simpler name.');
    } finally {
      setAddSearchLoading(false);
    }
  }, [addSearchText, user]);

  const getTodayCalories = async (userId: string): Promise<number> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('meal_logs')
        .select('calories')
        .gte('logged_at', today)
        .lt('logged_at', today + 'T23:59:59.999Z')
        .eq('user_id', userId);
      return (data || []).reduce((s, r: any) => s + (r.calories || 0), 0);
    } catch { return 0; }
  };

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
        const todayCal = await getTodayCalories(userId);
        const remaining = dailyGoal - todayCal;
        const msg = remaining > 0
          ? `Logged ✓  ${remaining} kcal remaining today`
          : `Logged ✓  ${Math.abs(remaining)} kcal over goal today`;
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
          <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.8, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>TOTAL</Text>
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

        {itemStates.map((item, idx) => {
          const scaled = scaleItem(item);
          return (
            <View key={`item-${idx}`} style={{
              backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12,
              borderWidth: 1, borderColor: C.border,
              shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <TextInput
                  style={{ flex: 1, fontSize: 16, fontWeight: '700', color: C.text, paddingVertical: 0, marginRight: 8, borderBottomWidth: 1, borderBottomColor: 'transparent' }}
                  value={item.name}
                  onChangeText={(t) => updateName(idx, t)}
                  placeholder="Food name"
                  placeholderTextColor={C.muted}
                />
                <TouchableOpacity onPress={() => removeItem(idx)} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="x" size={16} color={C.muted} />
                </TouchableOpacity>
              </View>

              <View style={{ height: 1, backgroundColor: C.border, marginBottom: 12 }} />

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
            </View>
          );
        })}

        {showAddSearch ? (
          <View style={{
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
          </View>
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
