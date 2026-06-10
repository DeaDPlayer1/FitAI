import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Dimensions, TextInput, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeInUp, FadeOutDown, SlideInUp, SlideOutDown,
  useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useScaleOnPress } from '@/lib/premiumHooks';
import {
  getAllBrandsFromDb, getBrandById, getBrandFoodsByCategory,
  getBrandCategoriesWithCounts, getBrandEmoji, getChainIcon,
  searchRestaurantFoods, getAllBrandFoods,
  type RestaurantBrand, type RestaurantFoodItem,
} from '@/lib/restaurantSearch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const C = theme.colors;
const H_PAD = 20;
const TRAY_HEIGHT = 100;

interface PendingItem {
  item: RestaurantFoodItem;
  quantity: number;
}

function FadeGradient() {
  return (
    <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 2, pointerEvents: 'none' }}>
      <Svg style={{ flex: 1 }} width={40} height="100%">
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#F8F9FC" stopOpacity="0" />
            <Stop offset="100%" stopColor="#F8F9FC" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width={40} height="100%" fill="url(#grad)" />
      </Svg>
    </View>
  );
}

function BrandCard({ brand, index, onPress }: { brand: RestaurantBrand; index: number; onPress: () => void }) {
  const { animatedStyle, onPressIn, onPressOut } = useScaleOnPress();
  const chainIcon = getChainIcon(brand.brand_name, brand.cuisine);
  const itemCount = brand.item_count ?? 0;
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(250)}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={() => { onPressIn(); onPress(); }}
          onPressOut={onPressOut}
          activeOpacity={0.85}
          style={s.brandCard}
        >
          <View style={[s.brandIconWrap, { backgroundColor: chainIcon.bg }]}>
            <Feather name={chainIcon.icon as any} size={20} color="#FFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.brandName}>{brand.brand_name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {brand.cuisine ? <Text style={s.brandMeta}>{brand.cuisine}</Text> : null}
              <Text style={s.brandMetaSep}>·</Text>
              {brand.country ? <Text style={s.brandMeta}>{brand.country}</Text> : null}
              {brand.is_verified === 1 && (
                <View style={s.brandVerified}>
                  <Feather name="check" size={7} color="#22C55E" />
                  <Text style={s.brandVerifiedText}>Verified</Text>
                </View>
              )}
              <Text style={s.brandItemCount}>{itemCount} items</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

function MenuItemRow({
  item, index, pending, onAdd, onUpdateQuantity,
}: {
  item: RestaurantFoodItem; index: number;
  pending: PendingItem | undefined;
  onAdd: () => void;
  onUpdateQuantity: (qty: number) => void;
}) {
  const { animatedStyle, onPressIn, onPressOut } = useScaleOnPress();
  const plusAnim = useSharedValue(0);
  const qty = pending?.quantity || 0;
  const isAdded = qty > 0;

  const plusBtnStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isAdded ? '#6C3BFF' : 'transparent', { duration: 200 }),
    borderColor: withTiming(isAdded ? '#6C3BFF' : '#6C3BFF', { duration: 200 }),
  }));

  const plusIconStyle = useAnimatedStyle(() => ({
    color: withTiming(isAdded ? '#FFF' : '#6C3BFF', { duration: 200 }),
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 25).duration(200)}>
      <View style={s.menuCard}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={s.menuName} numberOfLines={1}>{item.item_name}</Text>
          <Text style={s.menuServing}>{item.serving_size} · {Math.round(item.serving_weight)}g</Text>
          <Text style={s.menuMacro}>P {item.protein}g · C {item.carbs}g · F {item.fat}g</Text>
        </View>
        <View style={{ alignItems: 'flex-end', marginRight: 6 }}>
          <Text style={s.menuCal}>{Math.round(item.calories)}</Text>
          <Text style={s.menuCalLabel}>kcal</Text>
        </View>
        {isAdded ? (
          <View style={s.stepperRow}>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpdateQuantity(qty - 1); }}
              style={s.stepperBtn}
            >
              <Feather name="minus" size={14} color="#6C3BFF" />
            </TouchableOpacity>
            <Text style={s.stepperCount}>{qty}</Text>
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpdateQuantity(qty + 1); }}
              style={s.stepperBtn}
            >
              <Feather name="plus" size={14} color="#6C3BFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onAdd(); }}
            activeOpacity={0.7}
          >
            <Animated.View style={[s.addBtnCircle, plusBtnStyle]}>
              <Animated.Text style={[s.addBtnPlus, plusIconStyle]}>+</Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ paddingHorizontal: H_PAD, paddingTop: 16 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <View key={i} style={s.skeletonCard}>
          <View style={{ flex: 1 }}>
            <View style={s.skeletonLineWide} />
            <View style={[s.skeletonLine, { width: '50%', marginTop: 6 }]} />
          </View>
          <View style={[s.skeletonLine, { width: 40, height: 28 }]} />
        </View>
      ))}
    </View>
  );
}

export default function ChainMenuModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ brandId?: string; brandName?: string; returnTo?: string; mealType?: string }>();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const tabListRef = useRef<ScrollView>(null);
  const trayAnim = useSharedValue(0);
  const searchQuery = useRef('');

  const [brand, setBrand] = useState<RestaurantBrand | null>(null);
  const [allBrands, setAllBrands] = useState<RestaurantBrand[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [items, setItems] = useState<RestaurantFoodItem[]>([]);
  const [allItems, setAllItems] = useState<RestaurantFoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chainQuery, setChainQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pending, setPending] = useState<PendingItem[]>([]);

  const filteredBrands = useMemo(() => {
    let list = allBrands;
    if (selectedCategory !== 'All') {
      list = list.filter(b => (b.cuisine || '').toLowerCase() === selectedCategory.toLowerCase());
    }
    if (chainQuery.trim()) {
      const q = chainQuery.trim().toLowerCase();
      list = list.filter(b =>
        b.brand_name.toLowerCase().includes(q) ||
        (b.cuisine || '').toLowerCase().includes(q) ||
        (b.country || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allBrands, chainQuery, selectedCategory]);

  const cuisineCategories = useMemo(() => {
    const cats = new Set<string>();
    allBrands.forEach(b => { if (b.cuisine) cats.add(b.cuisine); });
    return ['All', ...Array.from(cats).sort()];
  }, [allBrands]);

  const isBrowseAll = !params.brandId;

  const trayVisible = pending.length > 0;

  useEffect(() => {
    trayAnim.value = withSpring(trayVisible ? 1 : 0, { stiffness: 200, damping: 20 });
  }, [trayVisible]);

  const trayStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(trayVisible ? 0 : 120, { duration: 250 }) }],
    opacity: withTiming(trayVisible ? 1 : 0, { duration: 200 }),
  }));

  const headerShadow = useAnimatedStyle(() => ({
    shadowOpacity: withSpring(scrollY.value > 5 ? 0.1 : 0),
    elevation: withSpring(scrollY.value > 5 ? 2 : 0),
  }));

  const trayTotalKcal = useMemo(() => {
    return pending.reduce((sum, p) => sum + Math.round(p.item.calories) * p.quantity, 0);
  }, [pending]);

  useEffect(() => {
    (async () => {
      try {
        if (params.brandId) {
          const b = await getBrandById(parseInt(params.brandId));
          if (b) {
            setBrand(b);
            const cats = await getBrandCategoriesWithCounts(b.id);
            setCategories([{ category: 'All', count: 0 }, ...cats]);
            setActiveCategory('All');
            const all = await getAllBrandFoods(b.id);
            setItems(all);
            setAllItems(all);
          }
        } else {
          const brands = await getAllBrandsFromDb();
          setAllBrands(brands);
        }
      } finally { setLoading(false); }
    })();
  }, [params.brandId]);

  const handleCategoryPress = async (cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(cat);
    if (brand) {
      if (cat === 'All') {
        const all = await getAllBrandFoods(brand.id);
        setItems(all);
      } else {
        const catItems = await getBrandFoodsByCategory(brand.id, cat);
        setItems(catItems);
      }
    }
  };

  const handleItemAdd = useCallback((item: RestaurantFoodItem) => {
    setPending(prev => {
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        return prev.map(p => p.item.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { item, quantity: 1 }];
    });
  }, []);

  const handleUpdateQuantity = useCallback((item: RestaurantFoodItem, qty: number) => {
    if (qty <= 0) {
      setPending(prev => prev.filter(p => p.item.id !== item.id));
      return;
    }
    setPending(prev => prev.map(p => p.item.id === item.id ? { ...p, quantity: qty } : p));
  }, []);

  const handleItemPress = (item: RestaurantFoodItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sw = item.serving_weight || 200;
    router.push({
      pathname: '/modals/restaurant-item-detail',
      params: {
        item_name: item.item_name,
        brand_name: item.brand_name || brand?.brand_name || '',
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
        cuisine: item.country || brand?.cuisine || '',
        is_verified: String(item.is_verified ?? brand?.is_verified ?? 0),
        mealType: params.mealType || 'snack',
      },
    });
  };

  const handleConfirmItems = () => {
    const itemsPayload = pending.map(p => ({
      name: p.item.item_name,
      grams: Math.round(p.item.serving_weight * p.quantity),
      calories_per_100g: Math.round((p.item.calories / p.item.serving_weight) * 100),
      protein_per_100g: Math.round((p.item.protein / p.item.serving_weight) * 100 * 10) / 10,
      carbs_per_100g: Math.round((p.item.carbs / p.item.serving_weight) * 100 * 10) / 10,
      fat_per_100g: Math.round((p.item.fat / p.item.serving_weight) * 100 * 10) / 10,
      fiber_per_100g: Math.round(((p.item.fiber || 0) / p.item.serving_weight) * 100 * 10) / 10,
      chain: p.item.brand_name || brand?.brand_name || '',
      servingLabel: p.item.serving_size,
      isRestaurant: true,
      totalCalories: Math.round(p.item.calories * p.quantity),
      totalProtein: Math.round(p.item.protein * p.quantity),
      totalCarbs: Math.round(p.item.carbs * p.quantity),
      totalFat: Math.round(p.item.fat * p.quantity),
      totalFiber: Math.round((p.item.fiber || 0) * p.quantity),
    }));
    router.push({
      pathname: '/modals/confirm-food',
      params: { items: JSON.stringify(itemsPayload), inputType: 'camera' },
    });
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => { scrollY.value = e.contentOffset.y; },
  });

  const emoji = brand ? getBrandEmoji(brand.brand_name) : '🍽️';

  // ── Loading state ──
  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>Loading...</Text>
          <View style={{ width: 36 }} />
        </View>
        <LoadingSkeleton />
      </View>
    );
  }

  // ── Browse all chains ──
  if (isBrowseAll) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInDown.duration(250)}>
          <Animated.View style={[s.header, headerShadow]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color="#1F2937" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.browseTitle}>Restaurant Chains</Text>
            <Text style={s.browseSubtitle}>{allBrands.length} chains · Official verified nutrition data</Text>
          </View>
          </Animated.View>
        </Animated.View>

        <View style={s.searchBarWrap}>
          <Feather name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={s.searchBarInput}
            placeholder="Search chains..."
            placeholderTextColor="#9CA3AF"
            value={chainQuery}
            onChangeText={setChainQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoFocus
          />
          {chainQuery.length > 0 && Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setChainQuery('')} style={{ padding: 4 }}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterChipsScroll} contentContainerStyle={s.filterChipsContent} keyboardShouldPersistTaps="handled">
          {cuisineCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[s.filterChip, selectedCategory === cat && s.filterChipActive]}
            >
              <Text style={[s.filterChipText, selectedCategory === cat && s.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: 4, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredBrands.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Feather name="search" size={36} color="#9CA3AF" />
              <Text style={{ marginTop: 8, fontSize: 15, fontWeight: '600', color: '#1F2937' }}>
                {chainQuery ? `No chains matching "${chainQuery}"` : 'No chains found'}
              </Text>
            </View>
          ) : null}
          {filteredBrands.map((b, i) => (
            <BrandCard
              key={b.id}
              brand={b}
              index={i}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/modals/chain-menu',
                  params: { brandId: String(b.id), brandName: b.brand_name, mealType: params.mealType, returnTo: params.returnTo },
                });
              }}
            />
          ))}
        </ScrollView>
      </View>
    );
  }

  // ── Chain not found ──
  if (!brand) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', padding: H_PAD }]}>
        <Feather name="alert-circle" size={36} color="#9CA3AF" />
        <Text style={{ marginTop: 8, fontSize: 15, fontWeight: '600', color: '#1F2937' }}>Chain not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.errBackBtn}>
          <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main brand menu view ──
  return (
    <View style={s.container}>
      {/* Sticky Header */}
      <Animated.View style={[s.header, { paddingTop: insets.top + 4 }, headerShadow]}>
        <View style={s.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color="#1F2937" />
          </TouchableOpacity>
          <View style={s.headerLogoWrap}>
            <Text style={s.headerLogoEmoji}>{emoji}</Text>
          </View>
          <Text style={s.headerTitle} numberOfLines={1}>{brand.brand_name}</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity style={s.headerIconBtn}>
              <Feather name="search" size={18} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerIconBtn}>
              <Feather name="heart" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Scrollable content */}
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: trayVisible ? TRAY_HEIGHT + 20 : 40 }}
        style={{ flex: 1 }}
      >
        {/* ── Hero ── */}
        <View style={s.hero}>
          <View style={s.heroRow}>
            <View style={s.heroIcon}>
              <Text style={s.heroEmoji}>{emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.heroName} numberOfLines={1}>{brand.brand_name}</Text>
              {brand.cuisine && (
                <Text style={s.heroCuisine}>{brand.cuisine} · {brand.country || ''}</Text>
              )}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                {brand.is_verified === 1 && (
                  <View style={s.heroBadgeVerified}>
                    <Feather name="check" size={8} color="#22C55E" />
                    <Text style={s.heroBadgeTextVerified}>Verified</Text>
                  </View>
                )}
                <View style={s.heroBadge}>
                  <Text style={s.heroBadgeText}>{allItems.length} items</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Horizontal Pill Category Tabs ── */}
        {categories.length > 0 && (
          <View style={s.tabsWrapper}>
            <FadeGradient />
            <ScrollView
              ref={tabListRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 8 }}
            >
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.category}
                  onPress={() => handleCategoryPress(cat.category)}
                  activeOpacity={0.75}
                  style={[s.tab, activeCategory === cat.category && s.tabActive]}
                >
                  <Text style={[s.tabText, activeCategory === cat.category && s.tabTextActive]}>
                    {cat.category}
                  </Text>
                  {cat.category !== 'All' && (
                    <View style={[s.tabCount, activeCategory === cat.category && s.tabCountActive]}>
                      <Text style={[s.tabCountText, activeCategory === cat.category && s.tabCountTextActive]}>
                        {cat.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Menu Items ── */}
        <View style={{ paddingHorizontal: H_PAD, paddingTop: 4 }}>
          {items.length > 0 ? (
            <>
              {activeCategory && activeCategory !== 'All' && (
                <Text style={s.sectionLabel}>{activeCategory}</Text>
              )}
              {items.map((item, i) => {
                const p = pending.find(p => p.item.id === item.id);
                return (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    index={i}
                    pending={p}
                    onAdd={() => handleItemAdd(item)}
                    onUpdateQuantity={(qty) => handleUpdateQuantity(item, qty)}
                  />
                );
              })}
            </>
          ) : (
            <Text style={s.emptyText}>No items in this category</Text>
          )}
        </View>
      </Animated.ScrollView>

      {/* ── Bottom Tray ── */}
      <Animated.View
        entering={SlideInUp.duration(250)}
        exiting={SlideOutDown.duration(200)}
        style={[s.tray, { paddingBottom: Math.max(insets.bottom, 8) }, trayStyle]}
      >
        <View style={s.trayContent}>
          <View style={s.trayInfo}>
            <Text style={s.trayCount}>
              {pending.reduce((s, p) => s + p.quantity, 0)} item{pending.reduce((s, p) => s + p.quantity, 0) !== 1 ? 's' : ''} added
            </Text>
            <Text style={s.trayKcal}>· {trayTotalKcal} kcal</Text>
          </View>
          <TouchableOpacity onPress={handleConfirmItems} activeOpacity={0.85} style={s.trayBtn}>
            <Text style={s.trayBtnText}>Continue to Confirm</Text>
            <Feather name="arrow-right" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FC' },

  // ── Header ──
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
    zIndex: 10,
  },
  headerInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: H_PAD - 4, paddingBottom: 10,
    height: 56,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  headerLogoWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  headerLogoEmoji: { fontSize: 20 },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: '700', color: '#1F2937',
    marginHorizontal: 10,
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero Section ──
  hero: {
    marginHorizontal: H_PAD,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  heroRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  heroIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 24 },
  heroName: {
    fontSize: 18, fontWeight: '700', color: '#1F2937',
  },
  heroCuisine: {
    fontSize: 12, fontWeight: '500', color: '#9CA3AF', marginTop: 1,
  },
  heroBadgeVerified: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  heroBadgeTextVerified: { fontSize: 10, fontWeight: '600', color: '#22C55E' },
  heroBadge: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },

  // ── Category Tabs (Horizontal Pills) ──
  tabsWrapper: {
    paddingVertical: 8,
    position: 'relative',
  },
  tab: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingLeft: 14, paddingRight: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    height: 38,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  tabActive: {
    backgroundColor: '#6C3BFF',
    borderColor: '#6C3BFF',
  },
  tabText: {
    fontSize: 13, fontWeight: '600', color: '#4B5563',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCount: {
    marginLeft: 6,
    backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabCountText: {
    fontSize: 10, fontWeight: '600', color: '#6B7280',
  },
  tabCountTextActive: {
    color: 'rgba(255,255,255,0.9)',
  },

  // ── Menu Cards ──
  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginBottom: 10, marginTop: 4,
  },
  menuCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 14, paddingRight: 12,
    marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  menuName: {
    fontSize: 16, fontWeight: '700', color: '#1F2937',
  },
  menuServing: {
    fontSize: 13, fontWeight: '500', color: '#9CA3AF', marginTop: 3,
  },
  menuMacro: {
    fontSize: 12, fontWeight: '500', color: '#9CA3AF', marginTop: 4,
  },
  menuCal: {
    fontSize: 18, fontWeight: '700', color: '#1F2937', fontVariant: ['tabular-nums'],
  },
  menuCalLabel: {
    fontSize: 9, fontWeight: '600', color: '#9CA3AF', marginTop: -1,
  },
  addBtnCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: '#6C3BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnPlus: {
    fontSize: 18, fontWeight: '700', color: '#6C3BFF', lineHeight: 20,
  },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  stepperBtn: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: '#6C3BFF',
    backgroundColor: '#F5F3FF',
    alignItems: 'center', justifyContent: 'center',
  },
  stepperCount: {
    fontSize: 16, fontWeight: '800', color: '#1F2937', minWidth: 20, textAlign: 'center',
  },

  // ── Bottom Tray ──
  tray: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
    zIndex: 100,
  },
  trayContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  trayInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  trayCount: {
    fontSize: 14, fontWeight: '700', color: '#1F2937',
  },
  trayKcal: {
    fontSize: 14, fontWeight: '600', color: '#6C3BFF',
  },
  trayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#6C3BFF', borderRadius: 14,
    paddingVertical: 14,
  },
  trayBtnText: {
    fontSize: 15, fontWeight: '800', color: '#FFF',
  },

  // ── Browse All Brands ──
  brandCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 18,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  brandIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  brandMeta: { fontSize: 11, fontWeight: '500', color: '#9CA3AF' },
  brandMetaSep: { fontSize: 11, fontWeight: '400', color: '#D1D5DB' },
  brandVerified: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#F0FDF4', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  brandVerifiedText: { fontSize: 9, fontWeight: '600', color: '#22C55E' },
  brandItemCount: { fontSize: 10, fontWeight: '500', color: '#9CA3AF' },
  browseTitle: {
    fontSize: 20, fontWeight: '700', color: '#1A1A2E',
  },
  browseSubtitle: {
    fontSize: 13, color: '#9CA3AF', fontWeight: '400', marginTop: 1,
  },
  filterChipsScroll: {
    maxHeight: 36, marginTop: 8, marginBottom: 4,
  },
  filterChipsContent: {
    paddingHorizontal: H_PAD, gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#6C3CE1',
  },
  filterChipText: {
    fontSize: 12, fontWeight: '600', color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // ── Search Bar ──
  searchBarWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: H_PAD, marginTop: 8, marginBottom: 4,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14,
    height: 42, borderWidth: 1, borderColor: 'rgba(108,59,255,0.1)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  searchBarInput: {
    flex: 1, fontSize: 14, fontWeight: '500', color: '#1F2937', padding: 0,
  },
  resultCount: {
    fontSize: 11, fontWeight: '600', color: '#9CA3AF',
    marginBottom: 6, marginTop: 2,
  },

  // ── Error ──
  errBackBtn: {
    marginTop: 16, backgroundColor: '#6C3BFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  emptyText: {
    textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontWeight: '500', marginTop: 32,
  },

  // ── Skeleton ──
  skeletonCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  skeletonLine: {
    height: 12, backgroundColor: '#F3F4F6', borderRadius: 6,
  },
  skeletonLineWide: {
    height: 14, width: '70%', backgroundColor: '#F3F4F6', borderRadius: 6,
  },
});
