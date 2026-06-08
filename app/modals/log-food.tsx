import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StyleSheet, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import Animated, {
  FadeInUp, FadeInDown,
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { analyzeFood, analyzeImageWithAI, MealLog } from '@/lib/nutritionAI';

import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';
import { useToast } from '@/components/ui/ToastNotification';

type Step = 'input' | 'parsing' | 'review';

function AnimatedProgressFill({ pct, color, delay: delayMs }: { pct: number; color: string; delay: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delayMs, withTiming(pct, { duration: 600, easing: Easing.out(Easing.quad) }));
  }, []);
  const anim = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return <Animated.View style={[styles.macroProgressFill, { backgroundColor: color }, anim]} />;
}

export default function LogFoodModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUserStore();

  const rawDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const selectedDate = rawDate ? (() => {
    const d = new Date(rawDate as string);
    return isNaN(d.getTime()) ? new Date() : d;
  })() : new Date();

  const [step, setStep] = useState<Step>('input');
  const [foodText, setFoodText] = useState('');
  const [parsedMeal, setParsedMeal] = useState<MealLog | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [isVisionAnalysis, setIsVisionAnalysis] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const { showToast } = useToast();

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library access is needed to import food images.',
          [{ text: 'Open Settings', onPress: () => Linking.openSettings() }, { text: 'Cancel' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: false,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setSelectedImageUri(uri);
      setIsVisionAnalysis(true);
      setStep('parsing');

      const analysisResult = await analyzeImageWithAI(uri, user?.id);
      (router as any).replace({
        pathname: '/modals/confirm-food',
        params: {
          imageUri: uri,
          aiDescription: analysisResult.ai_description,
          foodName: analysisResult.name,
          calories: String(analysisResult.calories),
          protein: String(analysisResult.protein),
          carbs: String(analysisResult.carbs),
          fat: String(analysisResult.fat),
          fiber: String(analysisResult.fiber),
          serving: analysisResult.serving,
          inputType: 'gallery',
        },
      });
    } catch (err: any) {
      setStep('input');
      showToast('Could not analyse this image. Try a clearer photo or enter manually.', 'error');
    }
  };

  const handleParse = async () => {
    if (!foodText.trim()) return;
    setStep('parsing');
    try {
      const result = await analyzeFood({ text: foodText.trim(), userId: user?.id || '' });
      setParsedMeal(result);
      setStep('review');
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Could not parse food. Try again.');
      setStep('input');
    }
  };

  const handleConfirm = async () => {
    if (!parsedMeal || !user) return;
    if (savingRef.current) return;
    savingRef.current = true;
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
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={24} color={theme.colors.text.primary} />
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
                  onPress={() => router.push('/modals/camera-capture')}
                  style={styles.toolBtn}
                >
                  <Feather name="camera" size={20} color={theme.colors.primaryDeep} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={pickFromGallery}
                  style={styles.toolBtn}
                >
                  <Feather name="image" size={20} color={theme.colors.primaryDeep} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => router.push('/modals/barcode-scanner')}
                  style={styles.toolBtn}
                >
                  <Text style={{ fontSize: 20, lineHeight: 22 }}>📦</Text>
                </TouchableOpacity>
              </View>

              {selectedImageUri && (
                <View style={styles.thumbnailRow}>
                  <Animated.Image source={{ uri: selectedImageUri }} style={styles.thumbnailImage} />
                  <TouchableOpacity onPress={() => setSelectedImageUri(null)} style={styles.thumbnailClear}>
                    <Feather name="x" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.analyzeBtn} onPress={handleParse}>
                <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {step === 'parsing' && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              {isVisionAnalysis
                ? 'AI is analyzing the image...'
                : 'AI is calculating nutrients...'}
            </Text>
          </View>
        )}

        {step === 'review' && parsedMeal && (
          <Animated.View entering={FadeInDown} style={styles.reviewContainer}>
            {/* ── Premium Header ── */}
            <View style={styles.reviewHeader}>
              <View style={styles.successBadge}>
                <Feather name="check" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.reviewHeaderText}>
                <Text style={styles.reviewHeaderTitle}>Meal Logged</Text>
                <Text style={styles.reviewHeaderSub}>AI analysis complete</Text>
              </View>
              <TouchableOpacity onPress={() => setStep('input')} style={styles.editIconBtn} activeOpacity={0.7}>
                <Feather name="edit-2" size={16} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>

            {/* ── Calorie Hero Card ── */}
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1.2 }}
              style={styles.calorieHero}
            >
              <View style={styles.calorieHeroContent}>
                <View style={styles.mealTag}>
                  <Feather name="clock" size={10} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.mealTagText}>
                    {params.mealType || parsedMeal.mealType || 'Meal'} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.calorieValue}>{parsedMeal.totalCalories}</Text>
                <Text style={styles.calorieLabel}>calories</Text>
                <View style={styles.goalProgress}>
                  <View style={styles.goalProgressBg}>
                    {user?.goals?.calories ? (
                      <View style={[styles.goalProgressFill, { width: `${Math.min((parsedMeal.totalCalories / user.goals.calories) * 100, 100)}%` }]} />
                    ) : null}
                  </View>
                  <Text style={[styles.goalProgressText, parsedMeal.totalCalories > (user?.goals?.calories || 0) && { color: '#FF6B6B' }]}>
                    {user?.goals?.calories
                      ? (() => {
                          const diff = user.goals.calories - parsedMeal.totalCalories;
                          return diff < 0
                            ? `${diff} kcal over`
                            : `${diff} kcal remaining`;
                        })()
                      : 'Set a calorie goal in settings'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* ── Macro Breakdown ── */}
            <View style={styles.macroSection}>
              {[
                { label: 'Protein', value: parsedMeal.totalProtein, unit: 'g', color: '#FB7185', bgColor: 'rgba(251,113,133,0.12)', goal: user?.goals?.protein || 150 },
                { label: 'Carbs', value: parsedMeal.totalCarbs, unit: 'g', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.12)', goal: user?.goals?.carbs || 250 },
                { label: 'Fat', value: parsedMeal.totalFat, unit: 'g', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.12)', goal: user?.goals?.fat || 65 },
              ].map((macro, i) => {
                const pct = macro.value / macro.goal;
                const diff = macro.goal - macro.value;
                const diffText = diff < 0
                  ? `${diff}${macro.unit} over`
                  : `${diff}${macro.unit} left`;
                return (
                <Animated.View
                  key={macro.label}
                  entering={FadeInDown.delay(200 + i * 100)}
                  style={[styles.macroCard, { backgroundColor: macro.bgColor, borderColor: macro.color + '25' }] as any}
                >
                  <View style={styles.macroTop}>
                    <Text style={[styles.macroValue, { color: macro.color }]}>{macro.value}{macro.unit}</Text>
                    <Text style={[styles.macroPct, diff < 0 && { color: '#FF6B6B' }]}>{Math.round(pct * 100)}%</Text>
                  </View>
                  <Text style={styles.macroLabel}>{macro.label}</Text>
                  <View style={styles.macroProgressBg}>
                    <AnimatedProgressFill pct={Math.min(pct, 1)} color={macro.color} delay={300 + i * 100} />
                  </View>
                  <Text style={[styles.macroRemaining, diff < 0 && { color: '#FF6B6B' }]}>{diffText}</Text>
                </Animated.View>
                );
              })}
            </View>

            {/* ── AI Insight ── */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.insightCard}>
              <View style={styles.insightRow}>
                <Feather name="zap" size={14} color={theme.colors.primary} />
                <Text style={styles.insightText}>
                  {parsedMeal.totalProtein < (user?.goals?.protein || 150) * 0.3
                    ? 'Low protein detected. Consider adding a lean protein source.'
                    : parsedMeal.totalCarbs > (user?.goals?.carbs || 250) * 0.5
                    ? 'Higher-carb meal. Balance with protein-rich foods later.'
                    : 'Great macro balance. Stay hydrated and keep consistent.'}
                </Text>
              </View>
            </Animated.View>

            {/* ── CTAs ── */}
            <View style={styles.ctaSection}>
              <TouchableOpacity style={styles.primaryCta} onPress={handleConfirm} disabled={saving} activeOpacity={0.85}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryCtaGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryCtaText}>Log Meal</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryCta} onPress={() => setStep('input')} activeOpacity={0.7}>
                <Text style={styles.secondaryCtaText}>Edit Entry</Text>
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
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.text.primary },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },

  inputCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    padding: 24,
    ...theme.shadow.card,
  },
  inputLabel: { fontSize: 18, fontWeight: '800', color: theme.colors.text.primary, marginBottom: 16 },
  textArea: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 20,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
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
  thumbnailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 12,
    backgroundColor: theme.colors.background, borderRadius: 16,
  },
  thumbnailImage: { width: 56, height: 56, borderRadius: 12 },
  thumbnailClear: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
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

  reviewContainer: {
    gap: 20,
  },

  reviewHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 4,
  },
  successBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#34C759',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewHeaderText: { flex: 1 },
  reviewHeaderTitle: {
    fontSize: 20, fontWeight: '800', color: theme.colors.text.primary,
  },
  reviewHeaderSub: {
    fontSize: 13, fontWeight: '500', color: theme.colors.text.muted, marginTop: 2,
  },
  editIconBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: theme.colors.bg.secondary,
    alignItems: 'center', justifyContent: 'center',
  },

  calorieHero: {
    borderRadius: 24, padding: 24, overflow: 'hidden', ...theme.shadow.glow,
  },
  calorieHeroContent: { gap: 8 },
  mealTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, alignSelf: 'flex-start',
  },
  mealTagText: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)',
  },
  calorieValue: {
    fontSize: 56, fontWeight: '900', color: '#FFFFFF',
    letterSpacing: -2, fontVariant: ['tabular-nums'],
    marginTop: 4,
  },
  calorieLabel: {
    fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  goalProgress: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  goalProgressBg: {
    flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2,
    overflow: 'hidden',
  },
  goalProgressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2 },
  goalProgressText: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', minWidth: 110,
  },

  macroSection: {
    flexDirection: 'row', gap: 10,
  },
  macroCard: {
    flex: 1, borderRadius: 20, padding: 16, borderWidth: 1, gap: 6,
  },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  macroValue: {
    fontSize: 20, fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  macroPct: {
    fontSize: 11, fontWeight: '700', color: theme.colors.text.muted,
  },
  macroLabelDefault: {
    fontSize: 11, fontWeight: '600', color: theme.colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  macroLabel: {
    fontSize: 11, fontWeight: '600', color: theme.colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  macroProgressBg: {
    height: 3, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 2,
    overflow: 'hidden', marginTop: 4,
  },
  macroProgressFill: { height: '100%', borderRadius: 2 },
  macroRemaining: {
    fontSize: 11, fontWeight: '700', color: theme.colors.text.muted,
    marginTop: 2,
  },

  insightCard: {
    backgroundColor: 'rgba(106,73,250,0.06)', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(106,73,250,0.12)',
  },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  insightText: {
    flex: 1, fontSize: 13, fontWeight: '500', color: theme.colors.text.muted,
    lineHeight: 19,
  },

  ctaSection: { gap: 12, paddingBottom: 20 },
  primaryCta: { borderRadius: 20, overflow: 'hidden', ...theme.shadow.button },
  primaryCtaGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 18, paddingHorizontal: 24,
  },
  primaryCtaText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  secondaryCta: { alignItems: 'center', paddingVertical: 12 },
  secondaryCtaText: {
    fontSize: 14, fontWeight: '700', color: theme.colors.text.muted,
  },
});
