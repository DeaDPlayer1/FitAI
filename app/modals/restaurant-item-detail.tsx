import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeInUp, BounceIn,
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withSpring, withTiming, Easing, Layout,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useScaleOnPress, useHapticTap } from '@/lib/premiumHooks';
import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';
import { getBrandEmoji } from '@/lib/restaurantSearch';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const SERVING_PRESETS = [0.5, 1, 2, 3];
const GRAM_PRESETS = [50, 100, 200, 300];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const C = theme.colors;

function getMealTypeByTime(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 10 && h < 14) return 'lunch';
  if (h >= 14 && h < 18) return 'snack';
  if (h >= 18 && h < 22) return 'dinner';
  return 'snack';
}

function AnimatedMacroRing({ pct, color, size = 72, strokeWidth = 6 }: { pct: number; color: string; size?: number; strokeWidth?: number }) {
  const progress = useSharedValue(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  useEffect(() => {
    progress.value = withTiming(Math.min(pct, 1), { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [pct]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - progress.value),
  }));
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={color + '1A'} strokeWidth={strokeWidth} fill="none" />
      <AnimatedCircle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const RestaurantItemDetail = function RestaurantItemDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<any>();
  const { user } = useUserStore();
  const insets = useSafeAreaInsets();
  const hapticTap = useHapticTap();

  // Params: item_name, brand_name, totalCal, totalProt, totalCarb, totalFat,
  //         totalFiber, totalSugar, totalSodium, serving_size, serving_weight,
  //         category, cuisine, is_verified, mealType, returnTo
  const itemName = params.item_name || '';
  const brandName = params.brand_name || '';
  const totalCal = parseFloat(params.totalCal || '0');
  const totalProt = parseFloat(params.totalProt || '0');
  const totalCarb = parseFloat(params.totalCarb || '0');
  const totalFat = parseFloat(params.totalFat || '0');
  const totalFiber = parseFloat(params.totalFiber || '0');
  const totalSugar = parseFloat(params.totalSugar || '0');
  const totalSodium = parseFloat(params.totalSodium || '0');
  const servingSize = params.serving_size || '';
  const servingWeight = parseFloat(params.serving_weight || '200');
  const category = params.category || '';
  const cuisine = params.cuisine || '';
  const isVerified = params.is_verified === '1' || params.is_verified === 'true';

  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<'serving' | 'g'>('serving');
  const [mealType, setMealType] = useState(params.mealType || getMealTypeByTime());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedNutrition, setExpandedNutrition] = useState(false);

  const saveAnim = useSharedValue(0);
  const saveBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(saveAnim.value ? 0.96 : 1) }],
    opacity: withTiming(saving ? 0.8 : 1, { duration: 200 }),
  }));

  // Data completeness
  const hasFiber = totalFiber > 0;
  const hasSugar = totalSugar > 0;
  const hasSodium = totalSodium > 0;
  const hasAllMacros = totalCal > 0 && totalProt > 0 && totalCarb > 0 && totalFat > 0;
  const hasFullData = hasFiber && hasSugar && hasSodium && hasAllMacros;
  const missingFields = [];
  if (!hasFiber && hasAllMacros) missingFields.push('fiber');
  if (!hasSugar && hasAllMacros) missingFields.push('sugar');
  if (!hasSodium && hasAllMacros) missingFields.push('sodium');
  if (!hasAllMacros) missingFields.push('protein', 'carbs', 'fat');

  // Scaled values for Serving mode (fixed per-serving, no per-100g)
  const servingScaled = useMemo(() => ({
    calories: Math.round(totalCal * quantity),
    protein: Math.round(totalProt * quantity * 10) / 10,
    carbs: Math.round(totalCarb * quantity * 10) / 10,
    fat: Math.round(totalFat * quantity * 10) / 10,
    fiber: Math.round(totalFiber * quantity * 10) / 10,
    sugar: Math.round(totalSugar * quantity * 10) / 10,
    sodium: Math.round(totalSodium * quantity * 10) / 10,
  }), [totalCal, totalProt, totalCarb, totalFat, totalFiber, totalSugar, totalSodium, quantity]);

  // Scaled values for Weight mode (per-100g × grams)
  const weightScaled = useMemo(() => {
    const f = quantity / 100;
    return {
      calories: Math.round(totalCal * f),
      protein: Math.round(totalProt * f * 10) / 10,
      carbs: Math.round(totalCarb * f * 10) / 10,
      fat: Math.round(totalFat * f * 10) / 10,
      fiber: Math.round(totalFiber * f * 10) / 10,
      sugar: Math.round(totalSugar * f * 10) / 10,
      sodium: Math.round(totalSodium * f * 10) / 10,
    };
  }, [totalCal, totalProt, totalCarb, totalFat, totalFiber, totalSugar, totalSodium, quantity]);

  const scaled = unit === 'serving' ? servingScaled : weightScaled;

  const per100g = useMemo(() => {
    if (servingWeight <= 0) return { cal: 0, prot: 0, carb: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
    const f = 100 / servingWeight;
    return {
      cal: Math.round(totalCal * f),
      prot: Math.round(totalProt * f * 10) / 10,
      carb: Math.round(totalCarb * f * 10) / 10,
      fat: Math.round(totalFat * f * 10) / 10,
      fiber: Math.round(totalFiber * f * 10) / 10,
      sugar: Math.round(totalSugar * f * 10) / 10,
      sodium: Math.round(totalSodium * f * 10) / 10,
    };
  }, [totalCal, totalProt, totalCarb, totalFat, totalFiber, totalSugar, totalSodium, servingWeight]);

  const { animatedStyle: logBtnAnim, onPressIn: logIn, onPressOut: logOut } = useScaleOnPress();

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaved(!saved);
  }, [saved]);

  const handleLog = useCallback(async () => {
    if (!user?.id) { Alert.alert('Error', 'You must be logged in to log food.'); return; }
    saveAnim.value = withSpring(1);
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id || user.id;
      const loggedAt = new Date().toISOString();
      const grams = unit === 'serving' ? quantity * servingWeight : quantity;
      const displayName = `${brandName ? brandName + ' — ' : ''}${itemName}`;

      await supabase.from('meal_logs').insert({
        user_id: userId, food_name: displayName,
        calories: scaled.calories, protein_g: scaled.protein,
        carbs_g: scaled.carbs, fat_g: scaled.fat,
        fiber_g: scaled.fiber || 0, sugar_g: scaled.sugar || 0,
        sodium_mg: scaled.sodium || 0,
        meal_type: mealType, logged_at: loggedAt,
      });

      await syncUserData(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Logged ✓', `${scaled.calories} kcal added to ${mealType}.`);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not log food.');
    } finally {
      setSaving(false);
      saveAnim.value = withSpring(0);
    }
  }, [user, itemName, brandName, scaled, quantity, unit, servingWeight, mealType, router]);

  const handleChainNav = useCallback(() => {
    router.push({ pathname: '/modals/chain-menu', params: { brandName } });
  }, [router, brandName]);

  const emoji = getBrandEmoji(brandName);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[C.bg.primary, C.surfaceTint, C.bg.primary]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

      {/* ── Custom Two-Line Header ── */}
      <Animated.View entering={FadeInDown.duration(250)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          {brandName ? (
            <Text style={styles.headerChain} numberOfLines={1}>{brandName}</Text>
          ) : null}
          <Text style={styles.headerTitle} numberOfLines={2}>{itemName}</Text>
        </View>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Feather name={saved ? 'heart' : 'heart'} size={18} color={saved ? '#FB7185' : C.text.muted} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Data Source Badge ── */}
        {brandName ? (
          <Animated.View entering={BounceIn.duration(250)} style={{ marginBottom: 14 }}>
            <TouchableOpacity onPress={handleChainNav} activeOpacity={0.8}>
              <LinearGradient
                colors={['rgba(147,51,234,0.12)', 'rgba(147,51,234,0.04)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.sourceBadge}
              >
                <Text style={{ fontSize: 14 }}>{emoji}</Text>
                <Text style={styles.sourceBadgeText}>{brandName}</Text>
                <View style={styles.verifiedDot}>
                  <Feather name="check" size={8} color="#22C55E" />
                </View>
                <Text style={styles.verifiedText}>Verified Chain</Text>
                <Feather name="chevron-right" size={12} color="#A78BFA" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        {/* ── Main Nutrition Card ── */}
        <Animated.View entering={BounceIn.duration(250)} style={styles.nutritionHero}>
          <LinearGradient colors={['rgba(108,59,255,0.08)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.calorieHeroRow}>
            <Text style={styles.calValue}>{scaled.calories}</Text>
            <Text style={styles.calUnit}>kcal</Text>
          </View>
          <View style={styles.macroRingRow}>
            {[
              { label: 'Protein', value: scaled.protein, pct: (scaled.protein || 0) / ((user?.goals?.protein || 150) / (2000 / (scaled.calories || 1))), color: C.protein },
              { label: 'Carbs', value: scaled.carbs, pct: (scaled.carbs || 0) / ((user?.goals?.carbs || 250) / (2000 / (scaled.calories || 1))), color: C.carbs },
              { label: 'Fat', value: scaled.fat, pct: (scaled.fat || 0) / ((user?.goals?.fat || 65) / (2000 / (scaled.calories || 1))), color: C.fat },
            ].map((m, i) => (
              <Animated.View key={m.label} entering={FadeInUp.delay(i * 80).duration(250)} style={{ alignItems: 'center', gap: 4 }}>
                <AnimatedMacroRing pct={Math.min(m.pct, 1)} color={m.color} size={64} strokeWidth={5} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: m.color }}>{m.value}g</Text>
                <Text style={{ fontSize: 9, fontWeight: '600', color: C.text.muted, textTransform: 'uppercase' }}>{m.label}</Text>
              </Animated.View>
            ))}
          </View>
          <View style={styles.servingDescription}>
            <Text style={styles.servingDescText}>
              1 serving = {servingSize} · {Math.round(servingWeight)}g
            </Text>
          </View>
          <View style={styles.dataCompleteness}>
            {hasFullData ? (
              <Text style={[styles.completenessText, { color: '#22C55E' }]}>
                ✓ Full nutrition data
              </Text>
            ) : (
              <Text style={[styles.completenessText, { color: '#F59E0B' }]}>
                ⓘ Partial data{missingFields.length > 0 ? ` — ${missingFields.join(', ')} not available` : ''}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ── Serving Size Section ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(250)} style={styles.glassCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={styles.sectionTitle}>Serving</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity
                onPress={() => { setUnit('serving'); setQuantity(1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.modeToggle, unit === 'serving' && styles.modeToggleActive]}
              >
                <Feather name="grid" size={12} color={unit === 'serving' ? '#FFF' : '#6C3BFF'} />
                <Text style={[styles.modeToggleText, unit === 'serving' && styles.modeToggleTextActive]}>Serving</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setUnit('g'); setQuantity(servingWeight); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.modeToggle, unit === 'g' && styles.modeToggleActive]}
              >
                <Feather name="bar-chart-2" size={12} color={unit === 'g' ? '#FFF' : '#6C3BFF'} />
                <Text style={[styles.modeToggleText, unit === 'g' && styles.modeToggleTextActive]}>Weight</Text>
              </TouchableOpacity>
            </View>
          </View>

          {unit === 'serving' ? (
            <>
              <View style={styles.servingQuantityRow}>
                <TextInput
                  style={styles.quantityInputLarge}
                  value={String(quantity)}
                  onChangeText={(t) => setQuantity(Math.max(0, parseFloat(t) || 0))}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={styles.quantityLabel}>serving ({servingSize} · {Math.round(servingWeight)}g)</Text>
              </View>
              <View style={styles.presetRow}>
                {SERVING_PRESETS.map(m => (
                  <TouchableOpacity
                    key={`s${m}`}
                    onPress={() => { setQuantity(m); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[styles.presetChip, quantity === m && styles.presetChipActive]}
                  >
                    <Text style={[styles.presetChipText, quantity === m && styles.presetChipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.servingQuantityRow}>
                <TextInput
                  style={styles.quantityInputLarge}
                  value={String(Math.round(quantity))}
                  onChangeText={(t) => setQuantity(Math.max(0, parseFloat(t) || 0))}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={styles.quantityLabel}>grams</Text>
              </View>
              <View style={styles.presetRow}>
                {GRAM_PRESETS.map(g => (
                  <TouchableOpacity
                    key={`g${g}`}
                    onPress={() => { setQuantity(g); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[styles.presetChip, quantity === g && styles.presetChipActive]}
                  >
                    <Text style={[styles.presetChipText, quantity === g && styles.presetChipTextActive]}>{g}g</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.weightWarning}>
                <Feather name="info" size={11} color="#F59E0B" />
                <Text style={styles.weightWarningText}>Weight mode uses estimated per-100g values</Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* ── Nutrition Facts ── */}
        <Animated.View entering={FadeInDown.delay(150).duration(250)} style={styles.glassCard}>
          <TouchableOpacity
            onPress={() => setExpandedNutrition(!expandedNutrition)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={styles.sectionTitle}>
              Nutrition Facts — {unit === 'serving' ? `${quantity} serving${quantity !== 1 ? 's' : ''} (${Math.round(quantity * servingWeight)}g)` : `${quantity}g`}
            </Text>
            <Feather name={expandedNutrition ? 'chevron-up' : 'chevron-down'} size={18} color={C.text.muted} />
          </TouchableOpacity>

          <View style={styles.nutriList}>
            <NutriRow label="Calories" value={String(scaled.calories)} unit="kcal" color={C.primary} />
            <NutriRow label="Protein" value={String(scaled.protein)} unit="g" color={C.protein} />
            <NutriRow label="Carbs" value={String(scaled.carbs)} unit="g" color={C.carbs} />
            <NutriRow label="Fat" value={String(scaled.fat)} unit="g" color={C.fat} />
            <NutriRow label="Fiber" value={String(scaled.fiber)} unit="g" color="#22C55E" />
            {expandedNutrition && (
              <Animated.View entering={FadeInDown.duration(250)}>
                <NutriRow label="Sugar" value={String(scaled.sugar)} unit="g" color={C.text.secondary} />
                <NutriRow label="Sodium" value={String(scaled.sodium)} unit="mg" color={C.text.secondary} />
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* ── Meal Type ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(250)} style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Log to</Text>
          <View style={styles.mealRow}>
            {MEAL_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => { setMealType(type); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.mealChip, mealType === type && styles.mealChipActive]}
              >
                <Text style={[styles.mealChipText, mealType === type && styles.mealChipTextActive]}>
                  {capitalize(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Bottom Log Button ── */}
      <Animated.View entering={FadeInUp.duration(250)} style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={() => { logIn(); handleLog(); }}
          onPressOut={logOut}
          disabled={saving}
          activeOpacity={0.85}
          style={{ flex: 1 }}
        >
          <Animated.View style={[styles.logBtnGrad, logBtnAnim, saveBtnStyle]}>
            <LinearGradient colors={['#6C3BFF', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logBtnFill}>
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFF" />
                  <Text style={styles.logBtnText}>
                    Log to {capitalize(mealType)} · {scaled.calories} kcal
                  </Text>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

function NutriRow({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={styles.nutriRow}>
      <Text style={styles.nutriLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text style={[styles.nutriValue, { color }]}>{value}</Text>
        <Text style={styles.nutriUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 10, gap: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center',
    ...theme.shadow.soft,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerChain: {
    fontSize: 13, fontWeight: '500', color: C.text.muted,
  },
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: C.text.primary,
  },
  saveBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center',
    ...theme.shadow.soft,
  },
  sourceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(147,51,234,0.2)',
    alignSelf: 'flex-start',
  },
  sourceBadgeText: {
    fontSize: 12, fontWeight: '700', color: '#A78BFA',
  },
  verifiedDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 11, fontWeight: '600', color: '#22C55E',
  },
  nutritionHero: {
    borderRadius: 28, padding: 28, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', ...theme.shadow.float,
    alignItems: 'center', marginBottom: 18,
  },
  calorieHeroRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4,
  },
  calValue: {
    fontSize: 56, fontWeight: '900', color: C.text.primary,
    letterSpacing: -2, fontVariant: ['tabular-nums'],
  },
  calUnit: { fontSize: 18, fontWeight: '600', color: C.text.muted },
  macroRingRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    width: '100%', marginTop: 20,
  },
  servingDescription: {
    backgroundColor: C.bg.tertiary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 12,
  },
  servingDescText: {
    fontSize: 12, fontWeight: '600', color: C.text.muted,
    textAlign: 'center',
  },
  dataCompleteness: {
    marginTop: 8,
  },
  completenessText: {
    fontSize: 11, fontWeight: '600',
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: 22,
    padding: 22, marginBottom: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', ...theme.shadow.glass,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: C.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  servingQuantityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, marginTop: 6,
  },
  quantityInputLarge: {
    fontSize: 36, fontWeight: '900', color: C.text.primary,
    minWidth: 60, textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1.5, borderColor: 'rgba(108,59,255,0.15)',
    fontVariant: ['tabular-nums'],
  },
  quantityLabel: {
    flex: 1, fontSize: 13, fontWeight: '600', color: C.text.secondary,
  },
  presetRow: {
    flexDirection: 'row', gap: 8,
  },
  presetChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(108,59,255,0.1)',
  },
  presetChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  presetChipText: {
    fontSize: 15, fontWeight: '700', color: C.text.secondary,
  },
  presetChipTextActive: { color: '#FFF' },
  weightWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)',
  },
  weightWarningText: {
    flex: 1, fontSize: 10, fontWeight: '500', color: '#D97706',
  },
  modeToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(108,59,255,0.15)',
  },
  modeToggleActive: { backgroundColor: '#6C3BFF', borderColor: '#6C3BFF' },
  modeToggleText: { fontSize: 11, fontWeight: '700', color: '#6C3BFF' },
  modeToggleTextActive: { color: '#FFF' },
  nutriList: { gap: 0, marginTop: 14 },
  nutriRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border.solid,
  },
  nutriLabel: { fontSize: 14, fontWeight: '600', color: C.text.secondary },
  nutriValue: { fontSize: 18, fontWeight: '800' },
  nutriUnit: { fontSize: 11, fontWeight: '500', color: C.text.muted },
  mealRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  mealChip: {
    flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(108,59,255,0.1)',
  },
  mealChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  mealChipText: { fontSize: 12, fontWeight: '600', color: C.text.secondary },
  mealChipTextActive: { color: '#FFF' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: 'rgba(247,246,252,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(108,59,255,0.06)',
  },
  logBtnFill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 18, paddingVertical: 16,
  },
  logBtnGrad: {
    borderRadius: 18, overflow: 'hidden',
    ...theme.shadow.glow,
  },
  logBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});

export default withErrorBoundary(RestaurantItemDetail, 'Could not load restaurant item details');
