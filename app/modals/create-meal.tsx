import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { saveMeal, updateMealFoods, updateSavedMeal } from '@/lib/foodSearch';
import { safeJsonParse } from '@/utils/safeRender';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: 'sunrise' },
  { id: 'lunch', label: 'Lunch', icon: 'sun' },
  { id: 'dinner', label: 'Dinner', icon: 'moon' },
  { id: 'snack', label: 'Snack', icon: 'coffee' },
  { id: 'pre_workout', label: 'Pre Workout', icon: 'zap' },
  { id: 'post_workout', label: 'Post Workout', icon: 'activity' },
] as const;

export default function CreateMealModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    foods?: string;
    editMealId?: string;
    editName?: string;
    editType?: string;
  }>();
  const { user } = useUserStore();
  const insets = useSafeAreaInsets();

  const initialFoods = safeJsonParse(params.foods, []);
  const isEditing = !!params.editMealId;

  const [mealName, setMealName] = useState(params.editName || '');
  const [mealType, setMealType] = useState(params.editType || 'lunch');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!mealName.trim()) { Alert.alert('Name required', 'Please enter a meal name.'); return; }
    if (!user?.id) { Alert.alert('Error', 'You must be logged in.'); return; }
    if (initialFoods.length === 0) { Alert.alert('No foods', 'Add at least one food to create a meal.'); return; }
    setSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isEditing && params.editMealId) {
        await updateMealFoods(parseInt(params.editMealId), initialFoods);
        await updateSavedMeal(parseInt(params.editMealId), {
          meal_name: mealName.trim(),
          meal_type: mealType,
        });
      } else {
        await saveMeal(user.id, mealName.trim(), mealType, initialFoods);
      }
      Alert.alert(isEditing ? 'Meal Updated' : 'Meal Saved', `${mealName.trim()} has been ${isEditing ? 'updated' : 'saved'}.`, [
        { text: 'OK', onPress: () => {
          router.navigate('/modals/food-search');
        }},
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || `Could not ${isEditing ? 'update' : 'save'} meal.`);
    } finally {
      setSaving(false);
    }
  }, [mealName, mealType, initialFoods, user, router, isEditing, params.editMealId]);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(250)} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Meal' : 'Save as Meal'}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.delay(50).duration(250)}>
          <Text style={styles.label}>Meal Name</Text>
          <TextInput
            style={styles.input}
            value={mealName}
            onChangeText={setMealName}
            placeholder="e.g. High Protein Lunch"
            placeholderTextColor="#9CA3AF"
            autoFocus
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(250)} style={{ marginTop: 20 }}>
          <Text style={styles.label}>Meal Type</Text>
          <View style={styles.typeRow}>
            {MEAL_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMealType(t.id); }}
                style={[styles.typeChip, mealType === t.id && styles.typeChipActive]}
              >
                <Feather name={t.icon as any} size={14} color={mealType === t.id ? '#FFF' : '#6B7280'} />
                <Text style={[styles.typeChipText, mealType === t.id && styles.typeChipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(250)} style={{ marginTop: 20 }}>
          <Text style={styles.label}>Foods ({initialFoods.length})</Text>
          {initialFoods.map((f: any, i: number) => (
            <View key={i} style={styles.foodRow}>
              <View style={styles.foodDot} />
              <Text style={styles.foodName}>{f.foodName}</Text>
              <Text style={styles.foodQty}>{f.quantity}{f.unit === 'g' ? 'g' : f.unit}</Text>
              <Text style={styles.foodCal}>{Math.round(f.calories)} kcal</Text>
            </View>
          ))}
          {initialFoods.length === 0 && (
            <Text style={styles.emptyText}>No foods added yet. Log foods first, then save as meal.</Text>
          )}
        </Animated.View>

        <TouchableOpacity
          style={styles.addFoodBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const existing = params.foods || '';
            router.push({ pathname: '/modals/food-search', params: { selectMode: 'true', existingFoods: existing, returnTo: 'create-meal', mealType } });
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus-circle" size={16} color="#6C3BFF" />
          <Text style={styles.addFoodText}>Add Another Food</Text>
        </TouchableOpacity>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(250)} style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.85} style={styles.saveBtn}>
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Feather name="check" size={18} color="#FFF" />
              <Text style={styles.saveText}>{isEditing ? 'Update Meal' : 'Save Meal'}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  label: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, fontSize: 16, fontWeight: '600',
    color: '#1F2937', borderWidth: 1, borderColor: '#E5E7EB',
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
  },
  typeChipActive: { backgroundColor: '#6C3BFF', borderColor: '#6C3BFF' },
  typeChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  typeChipTextActive: { color: '#FFFFFF' },
  foodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8 },
  foodDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6C3BFF', marginRight: 10 },
  foodName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' },
  foodQty: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginRight: 8 },
  foodCal: { fontSize: 13, fontWeight: '700', color: '#6C3BFF' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', padding: 20 },
  addFoodBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, marginTop: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#6C3BFF', borderStyle: 'dashed' },
  addFoodText: { fontSize: 14, fontWeight: '700', color: '#6C3BFF' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 10, backgroundColor: 'rgba(248,249,252,0.95)',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6C3BFF', borderRadius: 16, paddingVertical: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  saveText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
