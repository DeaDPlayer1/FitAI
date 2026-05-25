import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { supabase } from '@/lib/supabase';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '@/constants/theme';

type Set = { weight: string; reps: string };
type ExerciseLog = { name: string; sets: Set[] };

export default function LogWorkoutModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUserStore();
  const { addWorkoutLog } = useWorkoutStore();

  const selectedDate = params.date ? new Date(params.date as string) : new Date();

  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [saving, setSaving] = useState(false);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: [{ weight: '', reps: '' }] }]);
  };

  const addSet = (exIndex: number) => {
    const newExs = [...exercises];
    newExs[exIndex].sets.push({ weight: '', reps: '' });
    setExercises(newExs);
  };

  const updateSet = (exIndex: number, setIndex: number, field: keyof Set, value: string) => {
    const newExs = [...exercises];
    newExs[exIndex].sets[setIndex][field] = value;
    setExercises(newExs);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!workoutName || exercises.length === 0 || !user) {
      Alert.alert('Error', 'Please enter a workout name and at least one exercise.');
      return;
    }

    setSaving(true);
    try {
      // FIX[1]: Always use session user id for writes.
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) console.error('[log-workout] getSession error:', sessionError);
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('Not authenticated. Please log in again.');

      // FIX[4]: Match new schema (plan_name + source + jsonb exercises).
      const logData = {
        user_id: userId,
        plan_name: workoutName,
        exercises,
        source: 'manual',
        duration_minutes: 0, // Could add a timer later
        logged_at: selectedDate.toISOString(),
      };

      const { data, error } = await supabase
        .from('workout_logs')
        .insert(logData)
        .select()
        .single();

      console.log('[log-workout] insert raw result:', { data, error }); // FIX[1]: log success/error
      if (error) throw error;

      addWorkoutLog({
        id: data.id,
        ...logData,
      });

      Alert.alert('Success', 'Workout logged successfully!');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Log Workout</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.workoutNameInput}
          placeholder="Workout Name (e.g. Leg Day)"
          placeholderTextColor={COLORS.textMuted}
          value={workoutName}
          onChangeText={setWorkoutName}
        />

        {exercises.map((ex, exIndex) => (
          <Card key={exIndex} style={styles.exCard}>
            <View style={styles.exHeader}>
              <TextInput
                style={styles.exNameInput}
                placeholder="Exercise Name"
                placeholderTextColor={COLORS.textMuted}
                value={ex.name}
                onChangeText={(val) => {
                  const newExs = [...exercises];
                  newExs[exIndex].name = val;
                  setExercises(newExs);
                }}
              />
              <TouchableOpacity onPress={() => removeExercise(exIndex)}>
                <Ionicons name="trash-outline" size={20} color={COLORS.red} />
              </TouchableOpacity>
            </View>

            <View style={styles.setGrid}>
              <Text style={styles.label}>Set</Text>
              <Text style={styles.label}>kg</Text>
              <Text style={styles.label}>Reps</Text>
              <View />
            </View>

            {ex.sets.map((set, sIndex) => (
              <View key={sIndex} style={styles.setRow}>
                <View style={styles.setNum}><Text style={styles.setNumText}>{sIndex + 1}</Text></View>
                <TextInput
                  style={styles.setInput}
                  keyboardType="numeric"
                  value={set.weight}
                  onChangeText={(v) => updateSet(exIndex, sIndex, 'weight', v)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
                <TextInput
                  style={styles.setInput}
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(v) => updateSet(exIndex, sIndex, 'reps', v)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Ionicons name="checkmark-circle" size={20} color={set.weight && set.reps ? COLORS.mint : COLORS.textMuted} />
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIndex)}>
              <Ionicons name="add" size={18} color={COLORS.mint} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </Card>
        ))}

        <TouchableOpacity style={styles.addExBtn} onPress={addExercise}>
          <Ionicons name="add-circle" size={24} color={COLORS.mint} />
          <Text style={styles.addExText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.screenPadding, paddingVertical: SPACING.md },
  title: { color: 'white', fontSize: FONT_SIZE.lg, fontWeight: 'bold' },
  saveText: { color: COLORS.mint, fontSize: FONT_SIZE.md, fontWeight: 'bold' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.screenPadding, paddingBottom: 40 },
  workoutNameInput: { color: 'white', fontSize: FONT_SIZE.xxl, fontWeight: 'bold', marginVertical: SPACING.lg },
  exCard: { padding: SPACING.md, marginBottom: SPACING.lg },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  exNameInput: { color: COLORS.mint, fontSize: FONT_SIZE.lg, fontWeight: 'bold', flex: 1 },
  setGrid: { flexDirection: 'row', gap: 10, marginBottom: 10, paddingHorizontal: 10 },
  label: { flex: 1, color: COLORS.textMuted, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, backgroundColor: COLORS.bgElevated, padding: 8, borderRadius: RADIUS.md },
  setNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' },
  setNumText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: 'bold' },
  setInput: { flex: 1, backgroundColor: COLORS.bgCard, color: 'white', textAlign: 'center', padding: 4, borderRadius: 4, fontSize: FONT_SIZE.md },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: SPACING.md, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  addSetText: { color: COLORS.mint, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  addExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: SPACING.lg, paddingVertical: 16, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  addExText: { color: COLORS.mint, fontSize: FONT_SIZE.md, fontWeight: 'bold' },
});
