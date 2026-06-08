import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function NutritionLog() {
  const router = useRouter();
  const [mealType, setMealType] = useState('breakfast');
  const [food, setFood] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!food.trim()) {
      Alert.alert('Missing', 'Enter a food name');
      return;
    }
    if (!calories.trim()) {
      Alert.alert('Missing', 'Enter calories');
      return;
    }
    const calValue = parseInt(calories, 10);
    if (isNaN(calValue) || calValue < 0) {
      Alert.alert('Invalid', 'Calories must be a positive number');
      return;
    }
    if (calValue > 10000) {
      Alert.alert('Unusual', 'Calories seem very high. Please verify the amount.');
      return;
    }
    const proteinValue = Math.max(0, parseInt(protein, 10) || 0);
    const carbsValue = Math.max(0, parseInt(carbs, 10) || 0);
    const fatValue = Math.max(0, parseInt(fat, 10) || 0);
    if (proteinValue === 0 && carbsValue === 0 && fatValue === 0 && calValue > 0) {
      Alert.alert('Missing Macros', 'Protein, carbs, and fat are all 0. Please verify your macro entries or they will be saved as zeros.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('meal_logs').insert({
        user_id: user.id,
        meal_type: mealType,
        food_name: food.trim(),
        calories: calValue,
        protein_g: proteinValue,
        carbs_g: carbsValue,
        fat_g: fatValue,
        logged_at: new Date().toISOString(),
      });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error('Log error:', e);
      Alert.alert('Error', 'Could not save meal');
    } finally {
      setSaving(false);
    }
  }, [food, calories, protein, carbs, fat, mealType, router]);

  return (
    <LinearGradient colors={['#0F0A1A', '#1B1236']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="x" size={22} color="#C4B5FD" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Log Meal</Text>
          <View style={{ width: 22 }} />
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeInDown.duration(400).springify()}>
              <Text style={styles.label}>MEAL TYPE</Text>
              <View style={styles.chipRow}>
                {MEAL_TYPES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, mealType === m && styles.chipActive]}
                    onPress={() => setMealType(m)}
                  >
                    <Text style={[styles.chipText, mealType === m && styles.chipTextActive]}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(80).springify()}>
              <Text style={styles.label}>FOOD NAME</Text>
              <TextInput
                style={styles.input}
                value={food}
                onChangeText={setFood}
                placeholder="e.g. Chicken breast"
                placeholderTextColor="#6B7280"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(160).springify()}>
              <Text style={styles.label}>CALORIES</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                placeholder="250"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(240).springify()} style={{ flexDirection: 'row', gap: 12 }}>
              {[
                { label: 'PROTEIN (g)', value: protein, set: setProtein },
                { label: 'CARBS (g)', value: carbs, set: setCarbs },
                { label: 'FAT (g)', value: fat, set: setFat },
              ].map((f, i) => (
                <View key={i} style={{ flex: 1 }}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={f.value}
                    onChangeText={f.set}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={{ padding: 16 }}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Meal'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#F5F5F5' },
  label: { fontSize: 11, color: '#8B5CF6', letterSpacing: 1.5, marginBottom: 6 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chipActive: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  chipText: { fontSize: 13, color: '#C4B5FD' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  input: {
    height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, fontSize: 16, color: '#F5F5F5',
  },
  saveBtn: {
    height: 56, borderRadius: 16, backgroundColor: '#8B5CF6',
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
