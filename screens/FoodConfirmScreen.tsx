import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';
import { getDb } from '@/lib/db';
import type { NutritionResult } from '@/lib/nutritionAI';
import {
  estimateBaseNutrition, parseServingString,
  type ScaledNutrition, type BaseNutrition,
} from '@/lib/nutritionScale';
import ServingSizeEditor from '@/components/ui/ServingSizeEditor';
import { useToast } from '@/components/ui/ToastNotification';

export interface FoodConfirmParams {
  imageUri?: string;
  aiDescription?: string;
  voiceTranscript?: string;
  nutrition: NutritionResult;
  inputType: 'camera' | 'gallery' | 'voice';
}

function getMealTypeByTime(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 18) return 'snack';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'snack';
}

interface Props {
  params: FoodConfirmParams;
  onClose: () => void;
}

export default function FoodConfirmScreen({ params, onClose }: Props) {
  const router = useRouter();
  const { user } = useUserStore();
  const { showToast } = useToast();

  const { imageUri, aiDescription, voiceTranscript, nutrition, inputType } = params;

  const [foodName, setFoodName] = useState(nutrition.name || '');
  const [baseNutrition, setBaseNutrition] = useState<BaseNutrition>(() => {
    const parsed = parseServingString(nutrition.serving);
    // Use AI-detected servingGrams when available (e.g., 330ml can → 330g)
    const sg = nutrition.servingGrams;
    if (sg && sg > 0) {
      return {
        baseServingValue: sg,
        baseServingUnit: 'g',
        baseServingLabel: nutrition.serving || `${sg}g`,
        calories: nutrition.calories || 0,
        protein_g: nutrition.protein || 0,
        carbs_g: nutrition.carbs || 0,
        fats_g: nutrition.fat || 0,
        fiber_g: nutrition.fiber || 0,
        sugar_g: 0,
        sodium_g: 0,
      };
    }
    const gramEstimate = (parsed?.unit === 'g' || parsed?.unit === 'ml') ? parsed.value : 100;
    return {
      baseServingValue: gramEstimate,
      baseServingUnit: (parsed?.unit === 'ml' ? 'ml' : (parsed?.unit as any) || 'g'),
      baseServingLabel: nutrition.serving || `${gramEstimate}g`,
      calories: nutrition.calories || 0,
      protein_g: nutrition.protein || 0,
      carbs_g: nutrition.carbs || 0,
      fats_g: nutrition.fat || 0,
      fiber_g: nutrition.fiber || 0,
      sugar_g: 0,
      sodium_g: 0,
    };
  });
  const [scaled, setScaled] = useState<ScaledNutrition>(() => {
    const parsed = parseServingString(nutrition.serving);
    const sg = nutrition.servingGrams;
    if (sg && sg > 0) {
      return {
        calories: nutrition.calories || 0,
        protein_g: nutrition.protein || 0,
        carbs_g: nutrition.carbs || 0,
        fats_g: nutrition.fat || 0,
        fiber_g: nutrition.fiber || 0,
        sugar_g: 0,
        sodium_g: 0,
        servingLabel: nutrition.serving || `${sg}g`,
        servingQuantity: sg,
        servingUnit: 'g',
      };
    }
    return {
      calories: nutrition.calories || 0,
      protein_g: nutrition.protein || 0,
      carbs_g: nutrition.carbs || 0,
      fats_g: nutrition.fat || 0,
      fiber_g: nutrition.fiber || 0,
      sugar_g: 0,
      sodium_g: 0,
      servingLabel: nutrition.serving || '1 serving',
      servingQuantity: parsed?.value || 1,
      servingUnit: (parsed?.unit) || 'serving',
    };
  });
  const [mealType, setMealType] = useState(getMealTypeByTime());
  const [saving, setSaving] = useState(false);

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handleNutritionChange = useCallback((s: ScaledNutrition) => {
    setScaled(s);
  }, []);

  const handleLogFood = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to log food.');
      return;
    }
    if (!foodName.trim()) {
      Alert.alert('Missing Info', 'Please enter a food name.');
      return;
    }
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id || user.id;

      const { error } = await supabase.from('meal_logs').insert({
        user_id: userId,
        food_name: foodName.trim(),
        calories: scaled.calories,
        protein_g: scaled.protein_g,
        carbs_g: scaled.carbs_g,
        fat_g: scaled.fats_g,
        meal_type: mealType,
        logged_at: new Date().toISOString(),
      });
      if (error) throw error;

      await syncUserData(userId);

      try {
        const db = await getDb();
        await db.runAsync(
          `INSERT OR IGNORE INTO food_cache
           (food_name, aliases, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size, serving_grams, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          foodName.trim().toLowerCase(), '[]',
          baseNutrition.calories, baseNutrition.protein_g,
          baseNutrition.carbs_g, baseNutrition.fats_g, baseNutrition.fiber_g,
          baseNutrition.baseServingLabel, baseNutrition.baseServingValue, 'ai'
        );

        const existing = await db.getFirstAsync<any>(
          `SELECT id FROM user_food_history WHERE user_id = ? AND LOWER(food_name) = ?`,
          userId, foodName.trim().toLowerCase()
        );
        if (existing) {
          await db.runAsync(
            `UPDATE user_food_history SET log_count = log_count + 1, last_logged = ? WHERE id = ?`,
            new Date().toISOString(), existing.id
          );
        } else {
          await db.runAsync(
            `INSERT INTO user_food_history
             (user_id, food_name, aliases, calories, protein, carbs, fat, fiber, serving_size, serving_grams, log_count, last_logged, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            userId, foodName.trim().toLowerCase(), '[]',
            scaled.calories, scaled.protein_g,
            scaled.carbs_g, scaled.fats_g, scaled.fiber_g,
            scaled.servingLabel, scaled.servingQuantity,
            new Date().toISOString(), 'ai'
          );
        }
      } catch (dbErr) {
        console.error('[FoodConfirm] Cache error:', dbErr);
      }

      showToast(`Logged ${foodName.trim()} ✓`, 'success');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save food log.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.container}
    >
      <View style={s.header}>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Feather name="x" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Confirm Food</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
        {imageUri && (
          <Image source={{ uri: imageUri }} style={s.previewImage} />
        )}

        {aiDescription && (
          <View style={s.aiTag}>
            <Feather name="cpu" size={14} color={theme.colors.primary} />
            <Text style={s.aiTagText}>AI identified: {aiDescription}</Text>
          </View>
        )}

        {voiceTranscript && (
          <View style={s.aiTag}>
            <Feather name="mic" size={14} color={theme.colors.primary} />
            <Text style={s.aiTagText}>You said: {voiceTranscript}</Text>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.fieldLabel}>Food Name</Text>
          <TextInput
            style={s.textInput}
            value={foodName}
            onChangeText={setFoodName}
            placeholder="e.g. Chicken Salad"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* ── Dynamic Serving Editor ── */}
        <View style={s.card}>
          <Text style={s.fieldLabel}>Serving Size</Text>
          <ServingSizeEditor
            baseNutrition={baseNutrition}
            isPackaged={false}
            initialQuantity={scaled.servingQuantity}
            initialUnit={scaled.servingUnit}
            onNutritionChange={handleNutritionChange}
          />
        </View>

        <View style={s.card}>
          <Text style={s.fieldLabel}>Meal Type</Text>
          <View style={s.mealTypeRow}>
            {mealTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  s.mealTypeBtn,
                  mealType === type && s.mealTypeBtnActive,
                ]}
                onPress={() => setMealType(type)}
              >
                <Text
                  style={[
                    s.mealTypeText,
                    mealType === type && s.mealTypeTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={s.logBtn}
          onPress={handleLogFood}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.logBtnGradient}
          >
            {saving ? (
              <Text style={s.logBtnText}>Saving...</Text>
            ) : (
              <>
                <Feather name="check" size={18} color="#FFFFFF" />
                <Text style={s.logBtnText}>Log {scaled.calories} kcal</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose} style={s.tryAgainBtn}>
          <Text style={s.tryAgainText}>Try Again</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = {
  container: { flex: 1, backgroundColor: theme.colors.background } as const,
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: theme.colors.surface,
  } as const,
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } as const,
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary } as const,
  scroll: { flex: 1 } as const,
  scrollContent: { padding: 20, paddingBottom: 40 } as const,
  previewImage: {
    height: 200, borderRadius: 12, marginBottom: 12,
    backgroundColor: theme.colors.bg.secondary,
  } as const,
  aiTag: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 12, backgroundColor: 'rgba(106,73,250,0.06)',
    borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(106,73,250,0.12)',
  } as const,
  aiTagText: {
    flex: 1, fontSize: 13, fontWeight: '500',
    color: theme.colors.text.muted, lineHeight: 18,
  } as const,
  card: {
    backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20,
    marginBottom: 16,
  } as const,
  fieldLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 } as const,
  textInput: {
    backgroundColor: theme.colors.background, borderRadius: 14, padding: 14,
    fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 0,
  } as const,
  mealTypeRow: { flexDirection: 'row', gap: 8 } as const,
  mealTypeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: theme.colors.background,
    alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border.soft,
  } as const,
  mealTypeBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary } as const,
  mealTypeText: { fontSize: 12, fontWeight: '700', color: theme.colors.text.muted } as const,
  mealTypeTextActive: { color: '#FFFFFF' } as const,
  logBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 8 } as const,
  logBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 18, paddingHorizontal: 24,
  } as const,
  logBtnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' } as const,
  tryAgainBtn: { alignItems: 'center', paddingVertical: 16 } as const,
  tryAgainText: { fontSize: 14, fontWeight: '700', color: theme.colors.text.muted } as const,
};
