import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { parseFoodInput, analyzeFoodImage, MealLog } from '@/lib/nutritionAI';
import { transcribeAudio } from '@/lib/voiceLogger';
import { uploadImage } from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';

type Step = 'input' | 'parsing' | 'review';

export default function LogFoodModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUserStore();

  const selectedDate = params.date ? new Date(params.date as string) : new Date();

  const [step, setStep] = useState<Step>('input');
  const [foodText, setFoodText] = useState('');
  const [parsedMeal, setParsedMeal] = useState<MealLog | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyzingSource, setAnalyzingSource] = useState<'text' | 'voice' | 'vision'>('text');

  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone access is required.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        setAnalyzingSource('voice');
        setStep('parsing');
        const transcript = await transcribeAudio(uri);
        setFoodText(transcript);
        const result = await parseFoodInput(transcript);
        setParsedMeal(result);
        setStep('review');
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setStep('input');
      setRecording(null);
    }
  };

  const handleVisionAnalysis = async (uri: string) => {
    setAnalyzingSource('vision');
    setStep('parsing');
    try {
      const imageUrl = await uploadImage(uri);
      const mealData = await analyzeFoodImage(imageUrl);
      setParsedMeal(mealData);
      setStep('review');
    } catch (err: any) {
      Alert.alert('Vision Error', err.message);
      setStep('input');
    }
  };

  const handleParse = async () => {
    if (!foodText.trim()) return;
    setStep('parsing');
    try {
      const result = await parseFoodInput(foodText.trim());
      setParsedMeal(result);
      setStep('review');
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Could not parse food. Try again.');
      setStep('input');
    }
  };

  const handleConfirm = async () => {
    if (!parsedMeal || !user) return;
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('Not authenticated.');

      const rows = parsedMeal.items.map((item) => ({
        user_id: userId,
        food_name: item.name,
        calories: item.calories,
        protein_g: item.protein,
        carbs_g: item.carbs,
        fat_g: item.fat,
        meal_type: params.mealType || parsedMeal.mealType,
        logged_at: selectedDate.toISOString(),
      }));

      const { error } = await supabase.from('meal_logs').insert(rows);
      if (error) throw error;

      await syncUserData(userId);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Log Nutrition</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 'input' && (
          <Animated.View entering={FadeInUp}>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>What did you eat?</Text>
              <TextInput
                style={styles.textArea}
                placeholder="e.g. 2 eggs, avocado toast and black coffee..."
                placeholderTextColor={theme.colors.textMuted}
                value={foodText}
                onChangeText={setFoodText}
                multiline
              />
              
              <View style={styles.toolRow}>
                <TouchableOpacity 
                  onPressIn={startRecording} 
                  onPressOut={stopRecording}
                  style={[styles.toolBtn, !!recording && styles.toolBtnActive]}
                >
                  <Feather name="mic" size={20} color={!!recording ? '#FFF' : theme.colors.primaryDark} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={async () => {
                    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
                    if (!result.canceled) handleVisionAnalysis(result.assets[0].uri);
                  }}
                  style={styles.toolBtn}
                >
                  <Feather name="camera" size={20} color={theme.colors.primaryDark} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 });
                    if (!result.canceled) handleVisionAnalysis(result.assets[0].uri);
                  }}
                  style={styles.toolBtn}
                >
                  <Feather name="image" size={20} color={theme.colors.primaryDark} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.analyzeBtn} onPress={handleParse}>
                <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {step === 'parsing' && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>AI is calculating nutrients...</Text>
          </View>
        )}

        {step === 'review' && parsedMeal && (
          <Animated.View entering={FadeInDown} style={styles.reviewCard}>
            <Text style={styles.reviewHeader}>Summary</Text>
            
            <View style={styles.mainStats}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{parsedMeal.totalCalories}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
            </View>

            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{parsedMeal.totalProtein}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{parsedMeal.totalCarbs}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{parsedMeal.totalFat}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>

            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={saving}>
                {saving ? <ActivityIndicator color="#000" /> : <Text style={styles.confirmBtnText}>Log Meal</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.editBtn} onPress={() => setStep('input')}>
                <Text style={styles.editBtnText}>Edit Entry</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: theme.colors.surface,
    ...theme.shadow.navbar,
  },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  inputCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    padding: 24,
    ...theme.shadow.card,
  },
  inputLabel: { fontSize: 18, fontWeight: '800', color: theme.colors.text, marginBottom: 16 },
  textArea: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  toolRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  toolBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: { backgroundColor: theme.colors.danger },
  analyzeBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    ...theme.shadow.button,
  },
  analyzeBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },

  loadingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 20 },
  loadingText: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary },

  reviewCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    padding: 24,
    ...theme.shadow.card,
  },
  reviewHeader: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 24 },
  mainStats: { alignItems: 'center', marginBottom: 32 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 48, fontWeight: '900', color: theme.colors.primaryDark, letterSpacing: -1 },
  statLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase' },

  macroGrid: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  macroItem: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  macroValue: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  macroLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },

  footerActions: { gap: 12 },
  confirmBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    ...theme.shadow.button,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
  editBtn: { paddingVertical: 12, alignItems: 'center' },
  editBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary },
});
