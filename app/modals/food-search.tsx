import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  ActivityIndicator, Platform, Keyboard, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeOutUp, Layout,
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import {
  searchFoods, getRecentFoods, getFrequentFoods, getSavedMeals,
  ensureFoodDatabaseSeeded,
  type FoodEntry, type RecentFood, type SavedMeal,
} from '@/lib/foodSearch';

type Section = 'initial' | 'results' | 'saved_meals' | 'verified';

const C = {
  bg: '#F8F7FF',
  surface: '#FFFFFF',
  primary: '#6C3CE1',
  text: '#1A1A2E',
  muted: '#9CA3AF',
  border: '#F0EDFF',
  inputBg: '#F5F3FF',
};

export default function FoodSearchModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mealType?: string; returnTo?: string }>();
  const { user } = useUserStore();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodEntry[]>([]);
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [frequentFoods, setFrequentFoods] = useState<RecentFood[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [section, setSection] = useState<Section>('initial');

  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const mealType = params.mealType || getMealTypeByTime();

  useEffect(() => {
    (async () => {
      await ensureFoodDatabaseSeeded();
      setSeeded(true);
      if (user?.id) {
        loadInitial(user.id);
      }
    })();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [user]);

  const loadInitial = async (uid: string) => {
    const [recent, frequent, meals] = await Promise.all([
      getRecentFoods(uid, mealType),
      getFrequentFoods(uid),
      getSavedMeals(uid),
    ]);
    setRecentFoods(recent);
    setFrequentFoods(frequent);
    setSavedMeals(meals);
  };

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setResults([]);
      setSuggestions([]);
      setSearching(false);
      setSection('initial');
      return;
    }
    setSection('results');
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchFoods(text, user?.id, mealType);
        setResults(result.foods);
        setSuggestions(result.suggestions);
      } finally {
        setSearching(false);
      }
    }, 150);
  }, [user?.id, mealType]);

  const handleSelectFood = useCallback((food: FoodEntry) => {
    router.push({
      pathname: '/modals/food-detail',
      params: {
        foodId: food.id,
        foodName: food.canonical_name,
        mealType,
        returnTo: params.returnTo || 'log-food',
      },
    });
  }, [router, mealType, params.returnTo]);

  const handleSelectRecent = useCallback((food: RecentFood) => {
    router.push({
      pathname: '/modals/food-detail',
      params: {
        foodId: food.food_id || 0,
        foodName: food.food_name,
        mealType,
        returnTo: params.returnTo || 'log-food',
        prefillGrams: food.last_quantity,
        prefillUnit: food.last_unit,
      },
    });
  }, [router, mealType, params.returnTo]);

  const handleSelectSavedMeal = useCallback((meal: SavedMeal) => {
    router.push({
      pathname: '/modals/food-detail',
      params: {
        mealId: meal.id,
        mealName: meal.meal_name,
        mealType,
        isSavedMeal: 'true',
        returnTo: params.returnTo || 'log-food',
      },
    });
  }, [router, mealType, params.returnTo]);

  const handleBarcode = useCallback(() => {
    router.push('/modals/barcode-scanner');
  }, [router]);

  const handleQuickAdd = useCallback(() => {
    router.push({
      pathname: '/modals/food-detail',
      params: {
        quickAdd: 'true',
        mealType,
        returnTo: params.returnTo || 'log-food',
      },
    });
  }, [router, mealType, params.returnTo]);

  const searchBarAnim = useSharedValue(0);

  const renderFoodItem = useCallback(({ item, index }: { item: FoodEntry; index: number }) => {
    const perc = Math.round(item.calories_per_100g);
    return (
      <Animated.View entering={FadeInDown.delay(index * 30)}>
        <TouchableOpacity
          style={s.resultItem}
          onPress={() => handleSelectFood(item)}
          activeOpacity={0.7}
        >
          <View style={s.resultLeft}>
            <Text style={s.resultName} numberOfLines={1}>{capitalize(item.canonical_name)}</Text>
            <View style={s.resultMeta}>
              {item.verified === 1 && (
                <View style={s.verifiedBadge}>
                  <Feather name="check" size={8} color="#22C55E" />
                  <Text style={s.verifiedText}>Verified</Text>
                </View>
              )}
              {item.brand_name ? (
                <Text style={s.brandText} numberOfLines={1}>{item.brand_name}</Text>
              ) : null}
            </View>
            <Text style={s.servingText}>{item.serving_size} · {item.serving_grams}g</Text>
          </View>
          <View style={s.resultRight}>
            <Text style={s.calText}>{perc}</Text>
            <Text style={s.calLabel}>kcal</Text>
            <Text style={s.macroText}>P{item.protein_per_100g} C{item.carbs_per_100g} F{item.fat_per_100g}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={C.muted} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleSelectFood]);

  const renderRecentItem = useCallback(({ item, index }: { item: RecentFood; index: number }) => {
    const perc = Math.round(item.calories_per_100g);
    const isFrequent = item.log_count > 1;
    return (
      <Animated.View entering={FadeInDown.delay(index * 40)}>
        <TouchableOpacity
          style={s.recentItem}
          onPress={() => handleSelectRecent(item)}
          activeOpacity={0.7}
        >
          <View style={s.recentIcon}>
            <Feather name={isFrequent ? 'star' : 'clock'} size={14} color={isFrequent ? '#F59E0B' : C.muted} />
          </View>
          <View style={s.recentContent}>
            <Text style={s.recentName} numberOfLines={1}>{capitalize(item.food_name)}</Text>
            <View style={s.recentMeta}>
              <Text style={s.recentCal}>{perc} kcal</Text>
              {item.log_count > 1 && (
                <Text style={s.recentCount}>· {item.log_count}x</Text>
              )}
              {item.last_meal_type === mealType && (
                <View style={s.mealTag}>
                  <Text style={s.mealTagText}>{item.last_meal_type}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={s.recentGrams}>{Math.round(item.last_quantity)}{item.last_unit}</Text>
          <Feather name="chevron-right" size={14} color={C.muted} />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleSelectRecent, mealType]);

  const renderSavedMealItem = useCallback(({ item, index }: { item: SavedMeal; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 40)}>
      <TouchableOpacity
        style={s.recentItem}
        onPress={() => handleSelectSavedMeal(item)}
        activeOpacity={0.7}
      >
        <View style={[s.recentIcon, { backgroundColor: '#EDE9FE' }]}>
          <Feather name="folder" size={14} color={C.primary} />
        </View>
        <View style={s.recentContent}>
          <Text style={s.recentName} numberOfLines={1}>{item.meal_name}</Text>
          <Text style={s.recentCal}>
            {Math.round(item.total_calories)} kcal · {item.foods.length} items
          </Text>
        </View>
        {item.is_favorite === 1 && (
          <Feather name="heart" size={12} color="#EC4899" style={{ marginRight: 8 }} />
        )}
        <Feather name="chevron-right" size={14} color={C.muted} />
      </TouchableOpacity>
    </Animated.View>
  ), [handleSelectSavedMeal]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View style={s.searchRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={s.searchBar}>
            <Feather name="search" size={16} color={C.muted} style={{ marginRight: 8 }} />
            <TextInput
              ref={inputRef}
              style={s.searchInput}
              placeholder="Search 1000+ foods..."
              placeholderTextColor={C.muted}
              value={query}
              onChangeText={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Feather name="x" size={16} color={C.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={s.shortcutRow}>
          <TouchableOpacity style={s.shortcutBtn} onPress={handleBarcode}>
            <Feather name="maximize" size={16} color={C.primary} />
            <Text style={s.shortcutText}>Barcode</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.shortcutBtn} onPress={handleQuickAdd}>
            <Feather name="plus-circle" size={16} color={C.primary} />
            <Text style={s.shortcutText}>Quick Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {section === 'initial' && (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View style={{ paddingBottom: 40 }}>
              {suggestions.length > 0 && query.length > 0 && (
                <View style={s.suggestionsBox}>
                  <Text style={s.sectionTitle}>Suggestions</Text>
                  {suggestions.map((sug, i) => (
                    <TouchableOpacity
                      key={i}
                      style={s.suggestionItem}
                      onPress={() => { setQuery(sug); handleSearch(sug); }}
                    >
                      <Feather name="search" size={12} color={C.muted} />
                      <Text style={s.suggestionText}>{capitalize(sug)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {savedMeals.length > 0 && (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Saved Meals</Text>
                    <TouchableOpacity onPress={() => setSection('saved_meals')}>
                      <Text style={s.seeAllText}>See all</Text>
                    </TouchableOpacity>
                  </View>
                  {savedMeals.slice(0, 3).map((meal, i) => (
                    <View key={meal.id}>{renderSavedMealItem({ item: meal, index: i } as any)}</View>
                  ))}
                </View>
              )}

              {frequentFoods.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Most Logged</Text>
                  {frequentFoods.slice(0, 5).map((food, i) => (
                    <View key={food.id}>{renderRecentItem({ item: food, index: i } as any)}</View>
                  ))}
                </View>
              )}

              {recentFoods.length > 0 && (
                <View style={s.section}>
                  <Text style={s.sectionTitle}>Recent — {capitalize(mealType)}</Text>
                  {recentFoods.slice(0, 5).map((food, i) => (
                    <View key={food.id}>{renderRecentItem({ item: food, index: i } as any)}</View>
                  ))}
                </View>
              )}

              {!seeded && (
                <View style={s.loadingBox}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <Text style={s.loadingText}>Loading food database...</Text>
                </View>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {section === 'results' && (
        <FlatList
          data={results}
          renderItem={renderFoodItem}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={
            searching ? (
              <View style={s.searchingBox}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={s.searchingText}>Searching...</Text>
              </View>
            ) : results.length === 0 && query.length > 1 ? (
              <View style={s.emptyBox}>
                <Feather name="search" size={32} color={C.muted} />
                <Text style={s.emptyTitle}>No results for "{query}"</Text>
                <Text style={s.emptySub}>Try a different spelling or use barcode scan</Text>
              </View>
            ) : (
              <Text style={s.resultsCount}>{results.length} results</Text>
            )
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

function getMealTypeByTime(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 10 && h < 14) return 'lunch';
  if (h >= 14 && h < 18) return 'snack';
  if (h >= 18 && h < 22) return 'dinner';
  return 'snack';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    backgroundColor: C.surface, paddingHorizontal: 16, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inputBg, borderRadius: 12,
    paddingHorizontal: 12, height: 44,
  },
  searchInput: {
    flex: 1, fontSize: 16, fontWeight: '500', color: C.text,
    padding: 0,
  },
  shortcutRow: {
    flexDirection: 'row', gap: 8, marginTop: 8,
  },
  shortcutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.inputBg, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  shortcutText: {
    fontSize: 13, fontWeight: '600', color: C.primary,
  },
  section: {
    paddingHorizontal: 16, marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 16, marginBottom: 8, marginTop: 16,
  },
  seeAllText: {
    fontSize: 12, fontWeight: '600', color: C.primary,
  },
  recentItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 12,
    padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: C.border,
  },
  recentIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.inputBg, alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  recentContent: { flex: 1 },
  recentName: {
    fontSize: 14, fontWeight: '700', color: C.text,
    textTransform: 'capitalize',
  },
  recentMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
  },
  recentCal: { fontSize: 12, fontWeight: '600', color: C.muted },
  recentCount: { fontSize: 11, fontWeight: '500', color: C.muted },
  recentGrams: {
    fontSize: 13, fontWeight: '700', color: C.primary,
    marginRight: 8,
  },
  mealTag: {
    backgroundColor: '#EDE9FE', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1,
  },
  mealTagText: {
    fontSize: 9, fontWeight: '700', color: C.primary, textTransform: 'uppercase',
  },
  resultItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 12,
    padding: 14, marginHorizontal: 16, marginBottom: 6,
    borderWidth: 1, borderColor: C.border,
  },
  resultLeft: { flex: 1, marginRight: 8 },
  resultName: {
    fontSize: 15, fontWeight: '700', color: C.text,
    textTransform: 'capitalize',
  },
  resultMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F0FDF4', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1,
  },
  verifiedText: { fontSize: 9, fontWeight: '700', color: '#22C55E' },
  brandText: { fontSize: 11, fontWeight: '500', color: C.muted },
  servingText: {
    fontSize: 11, fontWeight: '500', color: C.muted, marginTop: 2,
  },
  resultRight: { alignItems: 'flex-end' },
  calText: {
    fontSize: 20, fontWeight: '800', color: C.text,
    fontVariant: ['tabular-nums'],
  },
  calLabel: { fontSize: 10, fontWeight: '600', color: C.muted, marginTop: -2 },
  macroText: {
    fontSize: 10, fontWeight: '500', color: C.muted, marginTop: 2,
  },
  suggestionsBox: {
    paddingHorizontal: 16, marginTop: 8,
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 4,
  },
  suggestionText: {
    fontSize: 14, fontWeight: '500', color: C.text,
  },
  loadingBox: {
    alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 12,
  },
  loadingText: { fontSize: 13, fontWeight: '600', color: C.muted },
  searchingBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 20,
  },
  searchingText: { fontSize: 13, fontWeight: '600', color: C.muted },
  resultsCount: {
    fontSize: 12, fontWeight: '600', color: C.muted,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  emptyBox: {
    alignItems: 'center', padding: 40, gap: 8,
  },
  emptyTitle: {
    fontSize: 16, fontWeight: '700', color: C.text,
  },
  emptySub: {
    fontSize: 13, fontWeight: '500', color: C.muted, textAlign: 'center',
  },
});
