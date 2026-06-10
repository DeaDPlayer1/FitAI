import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import {
  getMealById, logMeal, deleteSavedMeal,
  toggleFavoriteMeal,
  type SavedMeal,
} from '@/lib/foodSearch';
import { syncUserData } from '@/lib/sync';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍪',
  pre_workout: '⚡', post_workout: '💪',
};

const LOG_MEAL_OPTIONS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙' },
  { key: 'snack', label: 'Snack', emoji: '🍪' },
  { key: 'pre_workout', label: 'Pre Workout', emoji: '⚡' },
  { key: 'post_workout', label: 'Post Workout', emoji: '💪' },
];

function foodEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('rice')) return '🍚';
  if (lower.includes('chicken') || lower.includes('paneer')) return '🍗';
  if (lower.includes('bread') || lower.includes('roti') || lower.includes('naan')) return '🍞';
  if (lower.includes('egg')) return '🥚';
  if (lower.includes('banana')) return '🍌';
  if (lower.includes('apple')) return '🍎';
  if (lower.includes('salad')) return '🥗';
  if (lower.includes('fish')) return '🐟';
  if (lower.includes('dal') || lower.includes('lentil')) return '🫘';
  if (lower.includes('curry') || lower.includes('gravy')) return '🍛';
  if (lower.includes('soup')) return '🍜';
  if (lower.includes('smoothie') || lower.includes('shake') || lower.includes('milk')) return '🥛';
  if (lower.includes('coffee') || lower.includes('tea')) return '☕';
  if (lower.includes('pasta')) return '🍝';
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('burger')) return '🍔';
  if (lower.includes('fries') || lower.includes('potato')) return '🍟';
  if (lower.includes('cheese')) return '🧀';
  if (lower.includes('nuts') || lower.includes('peanut')) return '🥜';
  if (lower.includes('avocado')) return '🥑';
  if (lower.includes('broccoli')) return '🥦';
  if (lower.includes('tomato')) return '🍅';
  if (lower.includes('carrot')) return '🥕';
  return '🍽️';
}

function generateMealEmoji(foods: { food_name: string }[]): string {
  const seen = new Set<string>();
  const emojis: string[] = [];
  for (const f of foods) {
    const e = foodEmoji(f.food_name);
    if (!seen.has(e)) {
      seen.add(e);
      emojis.push(e);
    }
    if (emojis.length >= 3) break;
  }
  return emojis.join(' ') || '🍽️';
}

export default function SavedMealDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealId: string; returnTo?: string; mealType?: string }>();
  const { user } = useUserStore();
  const insets = useSafeAreaInsets();

  const [meal, setMeal] = useState<SavedMeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!params.mealId) return;
        const m = await getMealById(parseInt(params.mealId));
        setMeal(m);
      } catch (e) {
        console.warn('[saved-meal-detail] load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.mealId]);

  const handleLogAll = useCallback(async (targetMealType?: string) => {
    if (!meal || !user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowMealPicker(false);
    setLogging(true);
    try {
      await logMeal(user.id, meal.id, targetMealType || meal.meal_type);
      await syncUserData(user.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Logged!', `"${meal.meal_name}" has been logged.`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not log meal.');
    } finally {
      setLogging(false);
    }
  }, [meal, user, router]);

  const handleToggleFav = useCallback(async () => {
    if (!meal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = meal.is_favorite === 1 ? 0 : 1;
    await toggleFavoriteMeal(meal.id, next === 1);
    setMeal({ ...meal, is_favorite: next });
  }, [meal]);

  const handleDelete = useCallback(() => {
    if (!meal) return;
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${meal.meal_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteSavedMeal(meal.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ],
    );
  }, [meal, router]);

  const handleEdit = useCallback(() => {
    if (!meal) return;
    const foods = meal.foods.map(f => ({
      foodName: f.food_name,
      quantity: f.quantity,
      unit: f.unit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      fiber: f.fiber || 0,
    }));
    router.navigate({
      pathname: '/modals/create-meal',
      params: {
        foods: JSON.stringify(foods),
        editMealId: String(meal.id),
        editName: meal.meal_name,
        editType: meal.meal_type,
      },
    });
  }, [meal, router]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6C3BFF" />
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Feather name="alert-circle" size={40} color="#9CA3AF" />
        <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: '#1F2937' }}>Meal not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: '#6C3BFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
          <Text style={{ color: '#FFF', fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const emoji = meal.meal_thumbnail || generateMealEmoji(meal.foods);
  const mealTypeEmoji = MEAL_EMOJI[meal.meal_type] || '🍽️';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeInDown.duration(250)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#1F2937" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleToggleFav} style={styles.headerBtn}>
          <Ionicons name={meal.is_favorite === 1 ? 'heart' : 'heart-outline'} size={20} color={meal.is_favorite === 1 ? '#EC4899' : '#9CA3AF'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
          <Feather name="trash-2" size={18} color="#EF4444" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{emoji}</Text>
          <Text style={styles.heroName}>{meal.meal_name}</Text>
          <View style={styles.heroMeta}>
            <View style={styles.mealTypeBadge}>
              <Text style={styles.mealTypeText}>{mealTypeEmoji} {capitalize(meal.meal_type.replace('_', ' '))}</Text>
            </View>
            <Text style={styles.heroFoodCount}>{meal.foods.length} food{meal.foods.length !== 1 ? 's' : ''}</Text>
          </View>
          {meal.log_count != null && meal.log_count > 0 && (
            <Text style={styles.heroLogCount}>Logged {meal.log_count} time{meal.log_count !== 1 ? 's' : ''}</Text>
          )}
        </View>

        <View style={styles.macroCard}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(meal.total_calories)}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#EC4899' }]}>{Math.round(meal.total_protein)}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#F59E0B' }]}>{Math.round(meal.total_carbs)}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroDivider} />
          <View style={styles.macroItem}>
            <Text style={[styles.macroValue, { color: '#3B82F6' }]}>{Math.round(meal.total_fat)}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Foods</Text>
          {meal.foods.map((f, i) => (
            <Animated.View key={f.id || i} entering={FadeInDown.delay(i * 30).duration(200)}>
              <View style={styles.foodCard}>
                <View style={styles.foodEmojiWrap}>
                  <Text style={styles.foodEmoji}>{foodEmoji(f.food_name)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.foodName}>{f.food_name}</Text>
                  <Text style={styles.foodQty}>{Math.round(f.quantity)}{f.unit} · {Math.round(f.calories)} kcal</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.foodMacro}>P {Math.round(f.protein)}g</Text>
                  <Text style={styles.foodMacro}>C {Math.round(f.carbs)}g</Text>
                  <Text style={styles.foodMacro}>F {Math.round(f.fat)}g</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={handleEdit}
          activeOpacity={0.8}
          style={styles.editBtn}
        >
          <Feather name="edit-2" size={16} color="#6C3BFF" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowMealPicker(true)}
          disabled={logging}
          activeOpacity={0.85}
          style={styles.logBtn}
        >
          {logging ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#FFF" />
              <Text style={styles.logBtnText}>Log All · {Math.round(meal.total_calories)} kcal</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Meal Type Picker Overlay ── */}
      {showMealPicker && (
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowMealPicker(false)}>
          <Animated.View entering={FadeInDown.duration(200)} style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Log to which meal?</Text>
            {LOG_MEAL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => handleLogAll(opt.key)}
                activeOpacity={0.8}
                style={styles.pickerOption}
              >
                <Text style={styles.pickerOptionEmoji}>{opt.emoji}</Text>
                <Text style={styles.pickerOptionLabel}>{opt.label}</Text>
                <Feather name="chevron-right" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowMealPicker(false)} style={styles.pickerCancel}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },

  hero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20 },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  mealTypeBadge: {
    backgroundColor: '#F5F3FF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  mealTypeText: { fontSize: 12, fontWeight: '700', color: '#6C3BFF' },
  heroFoodCount: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  heroLogCount: { fontSize: 11, fontWeight: '500', color: '#9CA3AF', marginTop: 4 },

  macroCard: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    shadowColor: '#6C3BFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: {
    fontSize: 22, fontWeight: '800', color: '#F97316', fontVariant: ['tabular-nums'],
  },
  macroLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  macroDivider: { width: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  foodCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  foodEmojiWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center',
  },
  foodEmoji: { fontSize: 18 },
  foodName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  foodQty: { fontSize: 12, fontWeight: '500', color: '#9CA3AF', marginTop: 2 },
  foodMacro: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', lineHeight: 15 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: 'rgba(248,249,252,0.95)',
  },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, paddingHorizontal: 18,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#6C3BFF',
  },
  editBtnText: { fontSize: 14, fontWeight: '800', color: '#6C3BFF' },
  logBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6C3BFF', borderRadius: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  logBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  // ── Meal Type Picker ──
  pickerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
  },
  pickerTitle: {
    fontSize: 17, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 16,
  },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  pickerOptionEmoji: { fontSize: 20 },
  pickerOptionLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1F2937' },
  pickerCancel: {
    marginTop: 16, paddingVertical: 12, alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 14,
  },
  pickerCancelText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
});
