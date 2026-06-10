import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, Platform, Keyboard, Dimensions, ScrollView, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useScaleOnPress } from '@/lib/premiumHooks';
import {
  searchFoods, ensureFoodDatabaseSeeded,
  getSavedMeals, logMeal, getRecentMealHistory,
  type FoodEntry, type SavedMeal, type MealHistoryGroup,
} from '@/lib/foodSearch';
import {
  type RestaurantBrand, type RestaurantFoodItem,
} from '@/lib/restaurantSearch';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { syncUserData } from '@/lib/sync';

type Section = 'initial' | 'results';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const C = theme.colors;
const H_PAD = 20;

interface RecentDisplayItem {
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_size: string;
  serving_grams: number;
  last_quantity: number;
  last_unit: string;
  last_meal_type: string;
  last_logged: string;
  log_count: number;
  source: string;
}

const quickActions = [
  { key: 'create-meal', label: 'Create Meal', icon: 'grid' as const },
  { key: 'barcode', label: 'Barcode', icon: 'maximize' as const },
  { key: 'chains', label: 'Chains', icon: 'globe' as const },
  { key: 'camera', label: 'Camera', icon: 'camera' as const },
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getMealTypeByTime(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 10 && h < 14) return 'lunch';
  if (h >= 14 && h < 18) return 'snack';
  if (h >= 18 && h < 22) return 'dinner';
  return 'snack';
}

function formatTimestamp(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const dayMs = 86400000;

    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    if (diff < dayMs && d.getDate() === now.getDate()) {
      return `Today · ${time}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (diff < 2 * dayMs && d.getDate() === yesterday.getDate()) {
      return `Yesterday · ${time}`;
    }
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  } catch { return ''; }
}

function getProteinDot(proteinGrams: number): { color: string; label: string } {
  if (proteinGrams > 15) return { color: '#22C55E', label: 'High protein' };
  if (proteinGrams >= 8) return { color: '#EAB308', label: 'Medium protein' };
  return { color: '#EF4444', label: 'Low protein' };
}

const FoodRow = React.memo(function FoodRow({
  item, index, onPress, onAdd,
  showMealChip, showTimestamp, showSourceBadge, sourceBadge,
}: {
  item: RecentDisplayItem | FoodEntry;
  index: number;
  onPress: () => void;
  onAdd?: () => void;
  showMealChip?: boolean;
  showTimestamp?: boolean;
  showSourceBadge?: boolean;
  sourceBadge?: { text: string; color: string; bg: string } | null;
}) {
  const { animatedStyle, onPressIn, onPressOut } = useScaleOnPress();
  const protein = 'protein_per_100g' in item ? item.protein_per_100g : 0;
  const calories100 = 'calories_per_100g' in item ? item.calories_per_100g : 0;
  const carbs = 'carbs_per_100g' in item ? item.carbs_per_100g : 0;
  const fat = 'fat_per_100g' in item ? item.fat_per_100g : 0;
  const name = 'display_name' in item && item.display_name ? item.display_name : 'food_name' in item ? item.food_name : 'canonical_name' in item ? capitalize(item.canonical_name) : '';
  const mealType = 'last_meal_type' in item ? item.last_meal_type : '';
  const logged = 'last_logged' in item ? item.last_logged : '';

  const dot = getProteinDot(protein);

  return (
    <Animated.View entering={FadeInDown.delay(index * 25).duration(200)}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPress}
          activeOpacity={0.85}
          style={styles.foodRow}
        >
          <View style={[styles.proteinDot, { backgroundColor: dot.color }]}>
            <View style={styles.proteinDotInner} />
          </View>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.foodRowName}>{name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              {showMealChip && mealType && (
                <View style={styles.mealChip}>
                  <Text style={styles.mealChipText}>{capitalize(mealType)}</Text>
                </View>
              )}
              <Text style={styles.foodRowMacro}>
                P {protein}g · C {carbs}g · F {fat}g
              </Text>
              {showSourceBadge && sourceBadge && (
                <View style={[styles.sourceBadge, { backgroundColor: sourceBadge.bg }]}>
                  <Text style={[styles.sourceBadgeText, { color: sourceBadge.color }]}>{sourceBadge.text}</Text>
                </View>
              )}
            </View>
            {showTimestamp && logged && (
              <Text style={styles.foodRowTimestamp}>{formatTimestamp(logged)}</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text style={styles.foodRowCal}>{Math.round(calories100)}</Text>
            <Text style={styles.foodRowCalLabel}>kcal</Text>
          </View>
          {onAdd && (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onAdd(); }}
              style={styles.addBtnSmall}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="plus" size={14} color="#6C3BFF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

function FoodSearchModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string; returnTo?: string; selectMode?: string; existingFoods?: string }>();
  const { user } = useUserStore();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [section, setSection] = useState<Section>('initial');
  const [restaurantResults, setRestaurantResults] = useState<RestaurantFoodItem[]>([]);
  const [detectedBrand, setDetectedBrand] = useState<string | null>(null);
  const [brandEmoji, setBrandEmoji] = useState<string | undefined>(undefined);

  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [mealHistory, setMealHistory] = useState<MealHistoryGroup[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchQueryRef = useRef('');
  const hasExplicitMealType = !!params.mealType;
  const mealType = params.mealType || getMealTypeByTime();
  const [showMealPicker, setShowMealPicker] = useState(false);
  const pendingQuickAdd = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        await ensureFoodDatabaseSeeded();
        if (user?.id) {
          const [meals, history] = await Promise.all([
            getSavedMeals(user.id),
            getRecentMealHistory(user.id, 7),
          ]);
          setSavedMeals(meals);
          setMealHistory(history);
        }
      } catch (e) {
        console.warn('[food-search] initial load error:', e);
      } finally {
        setInitialLoading(false);
      }
    })();
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => {
      clearTimeout(focusTimer);
    };
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [meals, history] = await Promise.all([
          getSavedMeals(user.id),
          getRecentMealHistory(user.id, 7),
        ]);
        setSavedMeals(meals);
        setMealHistory(history);
      } catch (e) {
        console.warn('[food-search] focus refresh error:', e);
      }
    })();
  }, [user?.id]));

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      setRestaurantResults([]); setDetectedBrand(null); setBrandEmoji(undefined);
      setSearching(false); setSection('initial');
      return;
    }
    setSection('results');
    searchQueryRef.current = text;
    debounceRef.current = setTimeout(async () => {
      const currentQuery = text;
      setSearching(true);
      try {
        const result = await searchFoods(currentQuery, user?.id, mealType);
        if (searchQueryRef.current !== currentQuery) return;
        setHasSearched(true);
        setResults(result.foods);
        setRestaurantResults(result.restaurantItems || []);
        setDetectedBrand(result.detectedBrand || null);
        setBrandEmoji(result.brandEmoji);
      } catch (e) {
        console.warn('[food-search] search error:', e);
        if (searchQueryRef.current !== currentQuery) return;
      } finally { setSearching(false); }
    }, 150);
  }, [user?.id, mealType]);

  const isSelectMode = params.selectMode === 'true';

  const handleSelectFood = useCallback((food: FoodEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSelectMode) {
      router.push({
        pathname: '/modals/food-detail',
        params: { foodId: food.id, foodName: food.canonical_name, mealType, createMeal: 'true', existingFoods: params.existingFoods || '', returnTo: 'create-meal' },
      });
    } else {
      router.push({
        pathname: '/modals/food-detail',
        params: { foodId: food.id, foodName: food.canonical_name, mealType, returnTo: params.returnTo || 'log-food' },
      });
    }
  }, [router, mealType, params.returnTo, isSelectMode, params.existingFoods]);

  const handleSelectRestaurant = useCallback((item: RestaurantFoodItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sw = item.serving_weight || 200;
    router.push({
      pathname: '/modals/restaurant-item-detail',
      params: {
        item_name: item.item_name,
        brand_name: item.brand_name || '',
        totalCal: String(Math.round(item.calories)),
        totalProt: String(Math.round(item.protein)),
        totalCarb: String(Math.round(item.carbs)),
        totalFat: String(Math.round(item.fat)),
        totalFiber: String(Math.round(item.fiber || 0)),
        totalSugar: String(Math.round(item.sugar || 0)),
        totalSodium: String(Math.round(item.sodium || 0)),
        serving_size: item.serving_size,
        serving_weight: String(Math.round(sw)),
        category: item.category || '',
        cuisine: item.country || '',
        is_verified: String(item.is_verified ?? 0),
        mealType, returnTo: params.returnTo || 'log-food',
      },
    });
  }, [router, mealType, params.returnTo]);

  const clearQuery = useCallback(() => handleSearch(''), [handleSearch]);

  const handleQuickAction = useCallback((action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const common = { mealType, returnTo: params.returnTo || 'log-food' };
    switch (action) {
      case 'create-meal': router.push({ pathname: '/modals/create-meal', params: common }); break;
      case 'barcode': router.push({ pathname: '/modals/barcode-scanner', params: common }); break;
      case 'camera': router.push({ pathname: '/modals/camera-capture', params: common }); break;
      case 'chains': router.push({ pathname: '/modals/chain-menu', params: common }); break;
    }
  }, [router, mealType, params.returnTo]);

  const handleSelectSavedMeal = useCallback((meal: SavedMeal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/modals/saved-meal-detail',
      params: { mealId: String(meal.id), mealType, returnTo: params.returnTo || 'log-food' },
    });
  }, [router, mealType, params.returnTo]);

  const handleQuickLogMeal = useCallback(async (meal: SavedMeal) => {
    if (!user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await logMeal(user.id, meal.id, mealType);
      await syncUserData(user.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Meal Logged', `"${meal.meal_name}" has been logged.`);
    } catch (e: any) {
      console.warn('[food-search] quick-log meal error:', e);
    }
  }, [user, mealType]);

  const getSourceBadge = (item: FoodEntry): { text: string; color: string; bg: string } | null => {
    if (item.verified === 1) return { text: 'Verified', color: '#22C55E', bg: '#F0FDF4' };
    if (item.brand_name) return { text: 'Chain', color: '#6C3BFF', bg: '#F5F3FF' };
    if (item.source === 'ai') return { text: 'AI', color: '#F59E0B', bg: '#FFFBEB' };
    return null;
  };

  const handleQuickAdd = useCallback(() => {
    if (!hasExplicitMealType) {
      pendingQuickAdd.current = true;
      setShowMealPicker(true);
      return;
    }
    router.push({ pathname: '/modals/food-detail', params: { quickAdd: 'true', mealType, returnTo: params.returnTo || 'log-food' } });
  }, [router, mealType, params.returnTo, hasExplicitMealType]);

  const handlePickMeal = useCallback((picked: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMealPicker(false);
    pendingQuickAdd.current = false;
    router.push({ pathname: '/modals/food-detail', params: { quickAdd: 'true', mealType: picked, returnTo: params.returnTo || 'log-food' } });
  }, [router, params.returnTo]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Search Bar (auto-focused) ── */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#6C3BFF" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search foods..."
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            underlineColorAndroid="transparent"
            onSubmitEditing={() => {
              if (query.trim()) handleSearch(query.trim());
            }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearQuery} style={styles.clearBtn}>
              <Feather name="x" size={14} color="#6C3BFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Select Mode Banner ── */}
      {isSelectMode && (
        <View style={styles.selectBanner}>
          <Feather name="edit-3" size={14} color="#6C3BFF" />
          <Text style={styles.selectBannerText}>Tap a food to add to your meal</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.selectCancelBtn}>
            <Text style={styles.selectCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Loading State ── */}
      {initialLoading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6C3BFF" />
          <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 14 }}>Loading food database...</Text>
        </View>
      )}
      {!initialLoading && section === 'initial' && !isSelectMode && (
        <View style={styles.chipRow}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={action.key}
              onPress={() => handleQuickAction(action.key)}
              activeOpacity={0.75}
              style={styles.chip}
            >
              <Feather name={action.icon} size={14} color="#6C3BFF" />
              <Text style={styles.chipLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {section === 'results' ? (
        <FlatList
          data={results as any}
          renderItem={({ item, index }: any) => {
            const f = item as FoodEntry;
            return (
              <FoodRow
                item={f}
                index={index}
                onPress={() => handleSelectFood(f)}
                showSourceBadge
                sourceBadge={getSourceBadge(f)}
              />
            );
          }}
          keyExtractor={(item: FoodEntry, index: number) => String(item.id || item.canonical_name || item.display_name || `food-${index}`)}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
          ListHeaderComponent={
            searching ? (
              <View style={styles.searchingBox}>
                <ActivityIndicator size="small" color="#6C3BFF" />
                <Text style={styles.searchingText}>Searching...</Text>
              </View>
            ) : hasSearched && results.length === 0 && restaurantResults.length === 0 ? (
              <View style={styles.emptyBase}>
                <View style={styles.emptyIconBox}>
                  <Feather name="search" size={22} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyTitle}>No results for "{query}"</Text>
                <Text style={styles.emptySub}>Try a different spelling or scan a barcode</Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: H_PAD, paddingTop: 4 }}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultsCount}>{results.length + restaurantResults.length} results</Text>
                  <TouchableOpacity onPress={() => { setSection('initial'); setQuery(''); }}>
                    <Text style={styles.backBrowseText}>Back to browse</Text>
                  </TouchableOpacity>
                </View>
                {detectedBrand && brandEmoji ? (
                  <TouchableOpacity style={styles.brandResultHeader} onPress={() => {
                    router.push({ pathname: '/modals/chain-menu', params: { brandName: detectedBrand } });
                  }}>
                    <Text style={{ fontSize: 18 }}>{brandEmoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.brandHeaderName}>{detectedBrand}</Text>
                      <Text style={styles.brandHeaderSub}>View full menu</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#6C3BFF" />
                  </TouchableOpacity>
                ) : null}
                {restaurantResults.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>Restaurant Items</Text>
                    {restaurantResults.map((item, i) => (
                      <TouchableOpacity
                        key={`rest-${item.id || i}`}
                        onPress={() => handleSelectRestaurant(item)}
                        activeOpacity={0.85}
                        style={styles.restaurantRow}
                      >
                        <View style={[styles.restaurantIcon, { backgroundColor: '#FFF0E0' }]}>
                          <Feather name="globe" size={16} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.restaurantName}>{item.item_name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6C3BFF' }}>{item.brand_name}</Text>
                            <View style={styles.verifiedBadge}><Feather name="check" size={8} color="#22C55E" /><Text style={styles.verifiedText}>Chain</Text></View>
                          </View>
                          <Text style={{ fontSize: 11, fontWeight: '500', color: '#9CA3AF', marginTop: 1 }}>{item.serving_size} · {Math.round(item.serving_weight)}g</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.restaurantCal}>{Math.round(item.calories)}</Text>
                          <Text style={styles.restaurantCalLabel}>kcal</Text>
                        </View>
                        <Feather name="chevron-right" size={14} color="#9CA3AF" style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── Create Meal Card ── */}
          {!isSelectMode && (
            <TouchableOpacity
              onPress={() => handleQuickAction('create-meal')}
              activeOpacity={0.85}
              style={styles.quickAddCard}
            >
              <View style={styles.quickAddIcon}>
                <Feather name="grid" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickAddTitle}>Create Meal</Text>
                <Text style={styles.quickAddSub}>Build & save custom meals</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#6C3BFF" />
            </TouchableOpacity>
          )}

          {/* ── Saved Meals ── */}
          {savedMeals.length > 0 && (
            <View style={{ paddingHorizontal: H_PAD, paddingTop: 16 }}>
              <Text style={styles.sectionTitle}>Saved Meals</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
                keyboardShouldPersistTaps="handled"
              >
                {savedMeals.map((meal) => (
                  <TouchableOpacity
                    key={meal.id}
                    activeOpacity={0.85}
                    onPress={() => handleSelectSavedMeal(meal)}
                    onLongPress={() => handleQuickLogMeal(meal)}
                    style={styles.mealCard}
                  >
                    <Text style={styles.mealCardEmoji}>{meal.meal_thumbnail || '🍽️'}</Text>
                    <Text style={styles.mealCardName} numberOfLines={1}>{meal.meal_name}</Text>
                    <View style={styles.mealCardMeta}>
                      <Text style={styles.mealCardKcal}>{Math.round(meal.total_calories)} kcal</Text>
                      <Text style={styles.mealCardCount}>{meal.foods.length} foods</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── History ── */}
          {mealHistory.length > 0 && (
            <View style={{ paddingHorizontal: H_PAD, paddingTop: 20 }}>
              <Text style={styles.sectionTitle}>History</Text>
              {mealHistory.map((day) => (
                <View key={day.dateKey} style={{ marginTop: 12 }}>
                  <Text style={styles.historyDate}>{day.dateLabel}</Text>
                  {day.meals.map((m) => (
                    <TouchableOpacity
                      key={`${day.dateKey}_${m.mealType}`}
                      activeOpacity={0.8}
                      style={styles.historyMealRow}
                    >
                      <View style={styles.historyMealLeft}>
                        <Text style={styles.historyMealType}>{m.mealLabel}</Text>
                        <Text style={styles.historyMealFoods} numberOfLines={1}>
                          {m.foods.map(f => f.foodName).join(', ')}
                        </Text>
                      </View>
                      <Text style={styles.historyMealKcal}>{Math.round(m.totalCalories)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* ── Bottom spacer ── */}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── Meal Type Picker Overlay ── */}
      {showMealPicker && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => { setShowMealPicker(false); pendingQuickAdd.current = false; }}
          />
          <Animated.View entering={FadeInDown.duration(200)} style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Which meal?</Text>
            <Text style={styles.pickerSub}>Choose where to log this food</Text>
            <View style={styles.pickerChips}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => handlePickMeal(type)}
                  activeOpacity={0.8}
                  style={styles.pickerChip}
                >
                  <Text style={styles.pickerChipEmoji}>
                    {type === 'breakfast' ? '🌅' : type === 'lunch' ? '☀️' : type === 'dinner' ? '🌙' : '🍪'}
                  </Text>
                  <Text style={styles.pickerChipLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },

  // ── Search Bar ──
  searchHeader: {
    paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    height: 44, gap: 8, paddingHorizontal: 14,
    backgroundColor: '#F5F3FF', borderRadius: 14,
  },
  searchInput: {
    flex: 1, fontSize: 15, fontWeight: '500', color: '#1F2937', padding: 0,
  },
  clearBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#DDD6FE', alignItems: 'center', justifyContent: 'center',
  },

  // ── Select Mode Banner ──
  selectBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: H_PAD, paddingVertical: 10,
    backgroundColor: '#F5F3FF', borderBottomWidth: 1, borderBottomColor: 'rgba(108,59,255,0.12)',
  },
  selectBannerText: {
    flex: 1, fontSize: 13, fontWeight: '600', color: '#6C3BFF',
  },
  selectCancelBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(108,59,255,0.2)',
  },
  selectCancelText: {
    fontSize: 12, fontWeight: '700', color: '#6C3BFF',
  },

  // ── Quick Action Chips ──
  chipRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: H_PAD, paddingTop: 10, paddingBottom: 6,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'rgba(108,59,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  chipLabel: {
    fontSize: 12, fontWeight: '600', color: '#4B5563',
  },

  // ── Tooltip ──
  tooltip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F5F3FF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(108,59,255,0.12)',
  },
  tooltipText: {
    fontSize: 11, fontWeight: '600', color: '#6C3BFF',
  },

  // ── Food Row ──
  foodRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 8, gap: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  proteinDot: {
    width: 10, height: 10, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  proteinDotInner: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  foodRowName: {
    fontSize: 14, fontWeight: '700', color: '#1F2937',
    textTransform: 'capitalize',
  },
  foodRowMacro: {
    fontSize: 11, fontWeight: '500', color: '#9CA3AF',
  },
  foodRowTimestamp: {
    fontSize: 11, fontWeight: '500', color: '#9CA3AF', marginTop: 2,
  },
  foodRowCal: {
    fontSize: 18, fontWeight: '800', color: '#1F2937', fontVariant: ['tabular-nums'],
  },
  foodRowCalLabel: {
    fontSize: 9, fontWeight: '600', color: '#9CA3AF',
  },
  addBtnSmall: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#6C3BFF',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F3FF',
  },
  mealChip: {
    backgroundColor: '#F3F4F6', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  mealChipText: {
    fontSize: 9, fontWeight: '700', color: '#6B7280',
  },
  sourceBadge: {
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  sourceBadgeText: {
    fontSize: 9, fontWeight: '700',
  },

  // ── Quick Add Card (MFP-style) ──
  quickAddCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: H_PAD, marginTop: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16,
    borderWidth: 1, borderColor: 'rgba(108,59,255,0.12)',
    shadowColor: '#6C3BFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  quickAddIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#6C3BFF', alignItems: 'center', justifyContent: 'center',
  },
  quickAddTitle: {
    fontSize: 15, fontWeight: '700', color: '#1F2937',
  },
  quickAddSub: {
    fontSize: 11, fontWeight: '500', color: '#9CA3AF', marginTop: 1,
  },

  // ── History ──
  historyDate: {
    fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 6,
  },
  historyMealRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, marginBottom: 6,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  historyMealLeft: { flex: 1, marginRight: 12 },
  historyMealType: {
    fontSize: 13, fontWeight: '700', color: '#6C3BFF', marginBottom: 2,
  },
  historyMealFoods: {
    fontSize: 12, fontWeight: '500', color: '#6B7280',
  },
  historyMealKcal: {
    fontSize: 16, fontWeight: '800', color: '#1F2937', fontVariant: ['tabular-nums'],
  },

  // ── Section Title ──
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 12,
  },

  // ── Saved Meal Cards ──
  mealCard: {
    width: 150, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  mealCardEmoji: {
    fontSize: 28, marginBottom: 6,
  },
  mealCardName: {
    fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4,
  },
  mealCardMeta: {
    gap: 1,
  },
  mealCardKcal: {
    fontSize: 15, fontWeight: '800', color: '#F97316', fontVariant: ['tabular-nums'],
  },
  mealCardCount: {
    fontSize: 10, fontWeight: '600', color: '#9CA3AF',
  },

  // ── Results ──
  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
  },
  resultsCount: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  backBrowseText: { fontSize: 13, fontWeight: '600', color: '#6C3BFF' },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F0FDF4', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1,
  },
  verifiedText: { fontSize: 9, fontWeight: '700', color: '#22C55E' },

  // ── Restaurant Row ──
  restaurantRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  restaurantIcon: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  restaurantName: {
    fontSize: 14, fontWeight: '700', color: '#1F2937',
  },
  restaurantCal: {
    fontSize: 16, fontWeight: '800', color: '#1F2937', fontVariant: ['tabular-nums'],
  },
  restaurantCalLabel: {
    fontSize: 9, fontWeight: '600', color: '#9CA3AF',
  },

  // ── Brand Result Header ──
  brandResultHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  brandHeaderName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  brandHeaderSub: { fontSize: 11, fontWeight: '500', color: '#6C3BFF', marginTop: 1 },

  // ── Searching ──
  searchingBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20,
  },
  searchingText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },

  // ── Empty ──
  emptyBase: { alignItems: 'center', padding: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  emptySub: { fontSize: 13, fontWeight: '500', color: '#9CA3AF', textAlign: 'center' },
  emptyIconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },

  // ── Meal Type Picker ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  pickerTitle: {
    fontSize: 18, fontWeight: '800', color: '#1F2937', textAlign: 'center',
  },
  pickerSub: {
    fontSize: 13, fontWeight: '500', color: '#9CA3AF', textAlign: 'center', marginTop: 4, marginBottom: 20,
  },
  pickerChips: {
    flexDirection: 'row', gap: 12,
  },
  pickerChip: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: '#F8F9FC', borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  pickerChipEmoji: {
    fontSize: 28,
  },
  pickerChipLabel: {
    fontSize: 13, fontWeight: '700', color: '#1F2937',
  },
});

export default withErrorBoundary(FoodSearchModal, 'Could not load food search');
