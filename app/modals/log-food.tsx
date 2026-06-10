import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StyleSheet, Linking,
  Dimensions, Platform, Keyboard, KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeInUp, FadeInDown, FadeIn, BounceIn, Layout,
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withSpring, withTiming, withSequence, withRepeat, withDelay,
  Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { analyzeFood, analyzeImageWithAI, type FoodItem as OldFoodItem, type FoodAnalysisItem } from '@/lib/nutritionAI';
import { useScaleOnPress, useHapticTap, usePulseAnimation } from '@/lib/premiumHooks';
import { premiumStyles as P, macroColors } from '@/lib/premiumTokens';
import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';
import { useToast } from '@/components/ui/ToastNotification';
import { getRecentFoods } from '@/lib/foodSearch';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

function oldToAnalysis(old: OldFoodItem): FoodAnalysisItem {
  const grams = parseInt(old.quantity) || 100;
  const r = 100 / grams;
  return {
    name: old.name,
    grams,
    calories_per_100g: Math.round(old.calories * r),
    protein_per_100g: Math.round(old.protein * r * 10) / 10,
    carbs_per_100g: Math.round(old.carbs * r * 10) / 10,
    fat_per_100g: Math.round(old.fat * r * 10) / 10,
    fiber_per_100g: Math.round(old.fiber * r * 10) / 10,
    chain: old.chain,
    servingLabel: old.servingLabel,
    isRestaurant: old.isRestaurant,
    totalCalories: old.totalCalories,
    totalProtein: old.totalProtein,
    totalCarbs: old.totalCarbs,
    totalFat: old.totalFat,
    totalFiber: old.totalFiber,
  };
}

type Step = 'input' | 'parsing' | 'review';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const C = theme.colors;

function MacroRing({ pct, color, size = 80, strokeWidth = 6, label, value }: {
  pct: number; color: string; size?: number; strokeWidth?: number; label?: string; value?: string;
}) {
  const progress = useSharedValue(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  useEffect(() => {
    progress.value = withTiming(Math.min(pct, 1), { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [pct]);
  const animatedProps = useAnimatedProps(() => {
    const offset = circ * (1 - progress.value);
    return { strokeDashoffset: offset };
  });
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={color + '1A'} strokeWidth={strokeWidth} fill="none" />
          <AnimatedCircle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            animatedProps={animatedProps}
          />
        </Svg>
        {value && (
          <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: size * 0.22, fontWeight: '800', color: color }}>{value}</Text>
          </View>
        )}
      </View>
      {label && <Text style={{ fontSize: 10, fontWeight: '600', color: C.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>}
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ── Method config: consistent icon colors, white cards ──
const methodActions = [
  { icon: 'camera', label: 'Scan', color: '#6C3CE1', route: '/modals/camera-capture' },
  { icon: 'maximize', label: 'Barcode', color: '#3B82F6', route: '/modals/barcode-scanner' },
  { icon: 'mic', label: 'Voice', color: '#10B981', route: undefined },
  { icon: 'image', label: 'Gallery', color: '#F59E0B', route: 'gallery' },
  { icon: 'plus-circle', label: 'Quick Add', color: '#EC4899', route: '/modals/food-detail?quickAdd=true' },
  { icon: 'search', label: 'Search', color: '#4F46E5', route: '/modals/food-search' },
];

function MethodButton({ action, index, onPress }: {
  action: typeof methodActions[0]; index: number; onPress: () => void;
}) {
  const { animatedStyle, onPressIn, onPressOut } = useScaleOnPress();
  return (
    <Animated.View entering={FadeInUp.delay(250 + index * 50).springify()}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.85}
          style={styles.methodBtn}
        >
          <Feather name={action.icon as any} size={26} color={action.color} />
          <Text style={styles.methodLabel}>{action.label}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function RecentFoodCard({ item, index }: { item: any; index: number }) {
  const { animatedStyle, onPressIn, onPressOut } = useScaleOnPress();
  const router = useRouter();
  return (
    <Animated.View entering={FadeInDown.delay(400 + index * 80).springify()}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={() => {
            router.push({
              pathname: '/modals/food-detail',
              params: {
                foodId: 0, foodName: item.food_name,
                returnTo: 'log-food',
                recentCal: String(Math.round(item.calories_per_100g)),
                recentProt: String(item.protein_per_100g),
                recentCarb: String(item.carbs_per_100g),
                recentFat: String(item.fat_per_100g),
              },
            });
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.9}
          style={styles.recentCard}
        >
          <View style={[styles.recentCardDot, { backgroundColor: C.primary }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.recentFoodName} numberOfLines={1}>{item.food_name}</Text>
            <Text style={styles.recentFoodCals}>{Math.round(item.calories_per_100g)} kcal/100g</Text>
          </View>
          <Feather name="chevron-right" size={16} color={C.text.muted} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function LogFoodModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useUserStore();
  const { showToast } = useToast();
  const hapticTap = useHapticTap();
  const { animatedStyle: pulseStyle, loopPulse } = usePulseAnimation();

  const [step, setStep] = useState<Step>('input');
  const [foodText, setFoodText] = useState('');
  const [saving] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [recentFoods, setRecentFoods] = useState<any[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputFocus = useSharedValue(0);
  const shimmerX = useSharedValue(-300);
  const inputRef = useRef<TextInput>(null);

  const inputAnim = useAnimatedStyle(() => ({
    borderColor: inputFocus.value ? 'rgba(108,59,255,0.4)' : 'rgba(108,59,255,0.12)',
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  useEffect(() => {
    getRecentFoods(user?.id, undefined, 8).then(setRecentFoods).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    loopPulse();
    shimmerX.value = withRepeat(
      withTiming(SCREEN_WIDTH + 300, { duration: 2000, easing: Easing.linear }),
      -1, false,
    );
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  function getMealType(): string {
    const mt = (params.meal_type as string) || '';
    if (mt) return mt;
    const h = new Date().getHours();
    if (h >= 5 && h < 10) return 'breakfast';
    if (h >= 10 && h < 14) return 'lunch';
    if (h >= 14 && h < 18) return 'dinner';
    return 'snack';
  }

  function getMealPrompt(): string {
    const h = new Date().getHours();
    const firstName = user?.name?.split(' ')[0] || 'there';
    if (h >= 5 && h < 10) return `Good morning, ${firstName} — what did you have for breakfast?`;
    if (h >= 10 && h < 14) return `Good afternoon, ${firstName} — what are you having for lunch?`;
    if (h >= 14 && h < 18) return `Good evening, ${firstName} — dinner time, what did you eat?`;
    return `Hey ${firstName} — late snack?`;
  }

  function getMealTitle(): string {
    const mt = getMealType();
    const titles: Record<string, string> = {
      breakfast: 'Log Breakfast',
      lunch: 'Log Lunch',
      dinner: 'Log Dinner',
      snack: 'Log Snack',
    };
    return titles[mt] || 'Log Food';
  }

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed to import food images.', [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel' },
        ]);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      setStep('parsing');
      setProgressText('Analyzing your meal image...');
      const analysisResult = await analyzeImageWithAI(uri, user?.id);
      (router as any).replace({
        pathname: '/modals/confirm-food',
        params: {
          imageUri: uri,
          aiDescription: analysisResult.ai_description,
          items: JSON.stringify(analysisResult.items),
          inputType: 'gallery',
        },
      });
    } catch {
      setStep('input');
      showToast('Could not analyse this image. Try a clearer photo.', 'error');
    }
  };

  const handleParse = async () => {
    if (!foodText.trim()) return;
    hapticTap();
    setStep('parsing');
    setProgressText('Identifying food items...');
    try {
      setProgressText('Looking up nutrition data...');
      const result = await analyzeFood({ text: foodText.trim(), userId: user?.id || '' });
      if (!result.items || result.items.length === 0) throw new Error('No food found');
      const analysisItems: FoodAnalysisItem[] = result.items.map(oldToAnalysis);
      (router as any).replace({
        pathname: '/modals/confirm-food',
        params: {
          voiceTranscript: foodText,
          items: JSON.stringify(analysisItems),
          inputType: 'text',
        },
      });
    } catch (e: any) {
      Alert.alert('AI Error', e.message || 'Could not parse food.');
      setStep('input');
    }
  };

  const suggestionChips = useMemo(() => {
    const base = ['2 rotis', 'paneer sabzi', 'rice bowl', 'protein shake', 'oats', 'banana'];
    if (recentFoods.length > 0) {
      const fromRecent = recentFoods.slice(0, 6).map(r => r.food_name);
      return [...new Set([...fromRecent, ...base])].slice(0, 8);
    }
    return base;
  }, [recentFoods]);

  return (
    <View style={P.container}>
      <LinearGradient colors={[C.bg.primary, C.surfaceTint, C.bg.primary]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="x" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getMealTitle()}</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      {step === 'input' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: keyboardVisible ? 120 : 160 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Contextual prompt */}
            <Animated.View entering={FadeInUp.springify()} style={{ marginBottom: 20 }}>
              <Text style={styles.prompt}>{getMealPrompt()}</Text>
            </Animated.View>

            {/* Text Input Card */}
            <Animated.View entering={FadeInUp.delay(80).springify()}>
              <Animated.View style={[styles.inputCard, inputAnim]}>
                <TextInput
                  ref={inputRef}
                  style={styles.inputField}
                  placeholder="e.g. 2 eggs, 200g rice, 100g chicken..."
                  placeholderTextColor={C.text.muted}
                  value={foodText}
                  onChangeText={setFoodText}
                  multiline
                  onFocus={() => { inputFocus.value = withSpring(1); }}
                  onBlur={() => { inputFocus.value = withSpring(0); }}
                />
              </Animated.View>
            </Animated.View>

            {/* Quick suggestion chips — OUTSIDE the input card */}
            <Animated.View entering={FadeInUp.delay(120).springify()} style={{ marginTop: 14 }}>
              <Text style={styles.sectionLabel}>QUICK ADD</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
              >
                {suggestionChips.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    onPress={() => setFoodText((p) => (p ? `${p}, ${chip}` : chip))}
                    style={styles.suggestionChip}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionChipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>

            {/* Method buttons — 2×3 grid, consistent style */}
            <Animated.View entering={FadeInUp.delay(180).springify()} style={{ marginTop: 20 }}>
              <Text style={styles.sectionLabel}>OR USE</Text>
              <View style={styles.methodGrid}>
                {methodActions.map((action, i) => (
                  <MethodButton
                    key={action.label}
                    action={action}
                    index={i}
                    onPress={() => {
                      hapticTap();
                      if (action.route === 'gallery') { pickFromGallery(); return; }
                      if (action.label === 'Voice') { showToast('Voice input coming soon', 'info'); return; }
                      if (action.route) router.push(action.route as any);
                    }}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Analyze with AI button — no dot */}
            <Animated.View entering={FadeInUp.delay(300).springify()}>
              <Animated.View style={[pulseStyle, { marginTop: 20 }]}>
              <TouchableOpacity
                onPress={handleParse}
                activeOpacity={0.85}
                style={styles.analyzeBtn}
              >
                <LinearGradient
                  colors={['#6C3BFF', '#8B5CF6', '#6C3BFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.analyzeGradient}
                >
                  <View style={styles.analyzeShimmerWrap}>
                    <Animated.View style={[styles.analyzeShimmer, shimmerStyle]} />
                  </View>
                  <Text style={styles.analyzeIcon}>⚡</Text>
                  <Text style={styles.analyzeText}>Analyze with AI</Text>
                </LinearGradient>
              </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {/* Recent Foods */}
            {recentFoods.length > 0 && (
              <Animated.View entering={FadeInUp.delay(350).springify()} style={{ marginTop: 20 }}>
                <View style={P.spaceBetween}>
                  <Text style={P.sectionTitle}>Recent Meals</Text>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/modals/food-search', params: { returnTo: 'log-food' } })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: C.primary }}>See All</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ marginTop: 12, gap: 8 }}>
                  {recentFoods.slice(0, 5).map((item, i) => (
                    <RecentFoodCard key={item.id || i} item={item} index={i} />
                  ))}
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Keyboard dismiss bar */}
          {keyboardVisible && (
            <Animated.View entering={FadeIn.duration(150)} style={styles.keyboardBar}>
              <TouchableOpacity
                onPress={() => { Keyboard.dismiss(); }}
                style={styles.keyboardDismissBtn}
              >
                <Text style={styles.keyboardDismissText}>⌄ Done</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      )}

      {step === 'parsing' && (
        <View style={styles.parsingContainer}>
          <Animated.View entering={BounceIn.springify()} style={styles.parsingRing}>
            <Animated.View
              style={{
                width: 120, height: 120, borderRadius: 60,
                borderWidth: 6, borderColor: C.primary + '20',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Animated.View
                style={{
                  position: 'absolute', width: 120, height: 120, borderRadius: 60,
                  borderWidth: 6, borderColor: 'transparent',
                  borderTopColor: C.primary, borderRightColor: C.primary,
                }}
              />
              <Feather name="zap" size={32} color={C.primary} />
            </Animated.View>
          </Animated.View>
          <Animated.Text entering={FadeInUp.delay(200).springify()} style={styles.parsingText}>
            {progressText || 'Analyzing...'}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(350).springify()} style={styles.parsingSub}>
            AI is identifying foods & looking up nutrition data
          </Animated.Text>
          <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 24 }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingHorizontal: 20, paddingBottom: 8,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0EDFF',
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: '#1F2937',
    textAlign: 'center',
  },
  prompt: {
    fontSize: 14, fontWeight: '500', color: '#6E6E73', lineHeight: 20,
  },

  // ── Input Card ──
  inputCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5,
    borderColor: 'rgba(108,59,255,0.12)', padding: 16,
    shadowColor: '#6C3BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  inputField: {
    fontSize: 15, fontWeight: '500', color: '#1A1A2E',
    minHeight: 80, maxHeight: 140, textAlignVertical: 'top', lineHeight: 22,
  },

  // ── Sections ──
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#AEAEB2',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4,
  },

  // ── Suggestion Chips ──
  suggestionChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#EBE5FF',
  },
  suggestionChipText: {
    fontSize: 13, fontWeight: '600', color: '#6C3BFF',
  },

  // ── Method Grid (2×3) ──
  methodGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8,
  },
  methodBtn: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    width: (SCREEN_WIDTH - 40 - 20) / 3 - 14,
    height: 90,
    backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#F0EDFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  methodLabel: {
    fontSize: 13, fontWeight: '500', color: '#6E6E73', textAlign: 'center',
  },

  // ── Analyze Button ──
  analyzeBtn: {
    borderRadius: 14, overflow: 'hidden',
    height: 52,
    shadowColor: '#6C3BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4,
  },
  analyzeGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52, paddingHorizontal: 24, overflow: 'hidden',
  },
  analyzeShimmerWrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  analyzeShimmer: {
    width: 100, height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  analyzeIcon: {
    fontSize: 18,
  },
  analyzeText: {
    fontSize: 16, fontWeight: '700', color: '#FFF',
  },

  // ── Recent Foods ──
  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: '#F0EDFF',
    shadowColor: '#6C3BFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  recentCardDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  recentFoodName: {
    fontSize: 14, fontWeight: '700', color: '#1F2937',
  },
  recentFoodCals: {
    fontSize: 11, fontWeight: '500', color: '#AEAEB2', marginTop: 1,
  },

  // ── Keyboard Dismiss Bar ──
  keyboardBar: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0EDFF',
    paddingVertical: 6, paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  keyboardDismissBtn: {
    paddingVertical: 4, paddingHorizontal: 12,
  },
  keyboardDismissText: {
    fontSize: 15, fontWeight: '600', color: '#6C3BFF',
  },

  // ── Parsing ──
  parsingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  parsingRing: {
    width: 120, height: 120, alignItems: 'center', justifyContent: 'center',
  },
  parsingRingInner: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  parsingText: {
    fontSize: 20, fontWeight: '800', color: '#1F2937', marginTop: 24,
  },
  parsingSub: {
    fontSize: 13, fontWeight: '500', color: '#6E6E73', marginTop: 6, textAlign: 'center',
  },
});

export default withErrorBoundary(LogFoodModal, 'Could not load food logger');
