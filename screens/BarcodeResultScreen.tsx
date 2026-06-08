import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';
import { getDb } from '@/lib/db';
import { parseServingGrams, autoDetectMealType } from '@/lib/barcodeService';
import {
  estimateBaseNutrition, scaleNutrition,
  type BaseNutrition, type ScaledNutrition,
} from '@/lib/nutritionScale';
import ServingSizeEditor from '@/components/ui/ServingSizeEditor';
import { useToast } from '@/components/ui/ToastNotification';

export default function BarcodeResultModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUserStore();
  const { showToast } = useToast();

  const product = {
    barcode: (params.barcode as string) || '',
    name: (params.name as string) || 'Unknown Product',
    brand: (params.brand as string) || '',
    serving_size: (params.serving_size as string) || '100g',
    quantity: (params.quantity as string) || '',
    image_url: (params.image_url as string) || null,
    calories_100g: parseFloat(params.calories_100g as string) || 0,
    protein_100g: parseFloat(params.protein_100g as string) || 0,
    carbs_100g: parseFloat(params.carbs_100g as string) || 0,
    fat_100g: parseFloat(params.fat_100g as string) || 0,
    fiber_100g: parseFloat(params.fiber_100g as string) || 0,
    sugar_100g: parseFloat(params.sugar_100g as string) || 0,
    sodium_100g: parseFloat(params.sodium_100g as string) || 0,
  };

  const servingGrams = parseServingGrams(product.serving_size);

  // Build BaseNutrition from per-100g values
  const baseNutrition: BaseNutrition = estimateBaseNutrition(
    {
      calories: product.calories_100g,
      protein: product.protein_100g,
      carbs: product.carbs_100g,
      fat: product.fat_100g,
      fiber: product.fiber_100g,
      sugar: product.sugar_100g,
      sodium: product.sodium_100g,
    },
    product.serving_size,
    servingGrams || 100,
  );

  const [mealType, setMealType] = useState(autoDetectMealType());
  const [logging, setLogging] = useState(false);
  const [scaled, setScaled] = useState<ScaledNutrition>(() =>
    scaleNutrition({
      base: baseNutrition,
      quantity: baseNutrition.baseServingValue,
      unit: baseNutrition.baseServingUnit,
    })
  );

  const handleNutritionChange = useCallback((s: ScaledNutrition) => {
    setScaled(s);
  }, []);

  const handleLog = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to log food.');
      return;
    }
    if (scaled.servingQuantity <= 0) {
      showToast('Please enter a valid serving size.', 'warning');
      return;
    }
    setLogging(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id || user.id;

      const { error } = await supabase.from('meal_logs').insert({
        user_id: userId,
        food_name: product.name,
        calories: scaled.calories,
        protein_g: scaled.protein_g,
        carbs_g: scaled.carbs_g,
        fat_g: scaled.fats_g,
        meal_type: mealType.toLowerCase(),
        logged_at: new Date().toISOString(),
      });
      if (error) throw error;

      await syncUserData(userId);

      try {
        const db = await getDb();
        const existing = await db.getFirstAsync<any>(
          `SELECT id FROM user_food_history WHERE user_id = ? AND LOWER(food_name) = ?`,
          userId, product.name.toLowerCase()
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
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'barcode')`,
            userId, product.name.toLowerCase(), '[]',
            scaled.calories, scaled.protein_g, scaled.carbs_g, scaled.fats_g, scaled.fiber_g,
            scaled.servingLabel, scaled.servingQuantity,
            new Date().toISOString()
          );
        }
      } catch (dbErr) {
        console.error('[barcode] User history error:', dbErr);
      }

      showToast(`Logged ${product.name} ✓`, 'success');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save food log.');
    } finally {
      setLogging(false);
    }
  };

  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Product image */}
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ fontSize: 48 }}>📦</Text>
        </View>
      )}

      {/* Product info */}
      <View style={styles.card}>
        <Text style={styles.productName}>{product.name}</Text>
        {product.brand ? <Text style={styles.brandName}>{product.brand}</Text> : null}
        <Text style={styles.barcodeText}>{product.barcode}</Text>
      </View>

      {/* ── Dynamic Serving Editor ── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>How much did you eat?</Text>
        <ServingSizeEditor
          baseNutrition={baseNutrition}
          isPackaged={true}
          initialQuantity={scaled.servingQuantity}
          initialUnit={scaled.servingUnit}
          onNutritionChange={handleNutritionChange}
        />
      </View>

      {/* Per 100g reference */}
      <View style={styles.per100gCard}>
        <Feather name="info" size={12} color={theme.colors.text.muted} />
        <Text style={styles.per100gText}>
          Per 100g: {product.calories_100g} kcal · P {product.protein_100g}g · C {product.carbs_100g}g · F {product.fat_100g}g
        </Text>
      </View>

      {/* Meal type */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Meal Type</Text>
        <View style={styles.mealChips}>
          {mealTypes.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMealType(m)}
              style={[styles.mealChip, mealType === m && styles.mealChipActive]}
            >
              <Text style={[styles.mealChipText, mealType === m && styles.mealChipTextActive]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Log button */}
      <TouchableOpacity
        onPress={handleLog}
        style={[styles.logBtn, logging && styles.logBtnDisabled]}
        disabled={logging}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logBtnGradient}
        >
          {logging ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={styles.logBtnText}>Log {scaled.calories} kcal</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  productImage: { width: '100%', height: 200, backgroundColor: theme.colors.bg.secondary },
  imagePlaceholder: {
    width: '100%', height: 200, backgroundColor: theme.colors.bg.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20,
    marginHorizontal: 16, marginTop: 16, ...theme.shadow.card,
  },
  per100gCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: 16, marginTop: 8,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 12,
  },
  per100gText: {
    fontSize: 11, fontWeight: '500', color: theme.colors.text.muted,
    textAlign: 'center',
  },
  productName: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary },
  brandName: { fontSize: 14, fontWeight: '600', color: theme.colors.text.muted, marginTop: 4 },
  barcodeText: { fontSize: 11, fontWeight: '500', color: theme.colors.text.muted, marginTop: 8 },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 12 },
  mealChips: { flexDirection: 'row', gap: 8 },
  mealChip: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    backgroundColor: theme.colors.background, alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border.soft,
  },
  mealChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  mealChipText: { fontSize: 12, fontWeight: '700', color: theme.colors.text.muted },
  mealChipTextActive: { color: '#FFFFFF' },
  logBtn: { marginHorizontal: 16, marginTop: 20, borderRadius: 20, overflow: 'hidden', ...theme.shadow.button },
  logBtnDisabled: { opacity: 0.5 },
  logBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 18,
  },
  logBtnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
});
