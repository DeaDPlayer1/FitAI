/**
 * MealAccordionPanel — Unified Collapsible Meal Section
 * Wraps Breakfast / Lunch / Dinner in one connected card
 * Performance: React.memo, useCallback, useMemo, lazy expanded content,
 *              Reanimated for 60fps height animations
 */
import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface FoodLogItem {
  id?: string;
  food_name: string;
  meal_type?: string;
  calories?: number;
  quantity?: number;
  unit?: string;
  protein_g?: number;
}

interface MealRowProps {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  calorieGoal: number;
  items: FoodLogItem[];
  onAdd: () => void;
  isLast?: boolean;
}

// Meal icon/color config — static, no recompute
const MEAL_META: Record<string, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  breakfast: { icon: 'sunrise', color: '#FF9500' },
  lunch: { icon: 'sun', color: theme.colors.accent.green },
  dinner: { icon: 'moon', color: theme.colors.accent.blue },
  snack: { icon: 'star', color: '#8B5CF6' },
};

// Individual expanded food item row — pure component, isolated from parent
const FoodItemRow = memo(({ item }: { item: FoodLogItem }) => (
  <View style={styles.foodRow}>
    <View style={styles.foodDot} />
    <View style={styles.foodInfo}>
      <Text style={styles.foodName} numberOfLines={1}>{item.food_name}</Text>
      <Text style={styles.foodQty}>{item.quantity} {item.unit}</Text>
    </View>
    <Text style={styles.foodKcal}>{Math.round(item.calories ?? 0)}</Text>
  </View>
));
FoodItemRow.displayName = 'FoodItemRow';

// Individual meal row — self-contained expand logic
const MealRow = memo(({ type, title, calorieGoal, items, onAdd, isLast }: MealRowProps) => {
  const [expanded, setExpanded] = useState(items.length > 0);
  const height = useSharedValue(items.length > 0 ? 1 : 0);
  const rotate = useSharedValue(items.length > 0 ? 1 : 0);

  const meta = MEAL_META[type] ?? MEAL_META.snack;

  const totalCalories = useMemo(
    () => items.reduce((s, i) => s + (i.calories ?? 0), 0),
    [items]
  );

  const expandStyle = useAnimatedStyle(() => ({
    maxHeight: height.value === 1 ? 500 : 0,
    opacity: height.value,
    overflow: 'hidden',
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${height.value * 180}deg` }],
  }));

  const toggle = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    height.value = withTiming(next ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
    rotate.value = withTiming(next ? 1 : 0, { duration: 260 });
  }, [expanded, height, rotate]);

  return (
    <View style={[styles.mealRow, !isLast && styles.mealRowBorder]}>
      {/* Header row — always visible */}
      <TouchableOpacity
        style={styles.mealHeader}
        onPress={toggle}
        activeOpacity={0.7}
      >
        {/* Icon + Name */}
        <View style={[styles.mealIcon, { backgroundColor: meta.color + '18' }]}>
          <Feather name={meta.icon} size={15} color={meta.color} />
        </View>

        <View style={styles.mealTitleBlock}>
          <Text style={styles.mealTitle}>{title}</Text>
          <Text style={styles.mealSub}>
            {items.length > 0
              ? `${items.length} item${items.length !== 1 ? 's' : ''}`
              : 'Nothing logged yet'}
          </Text>
        </View>

        {/* Calorie badge */}
        <View style={styles.calorieBadge}>
          <Text style={styles.calorieLogged}>{Math.round(totalCalories)}</Text>
          <Text style={styles.calorieGoalText}>/{calorieGoal}</Text>
        </View>

        {/* Add button */}
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: meta.color }]} onPress={onAdd} hitSlop={HIT_SLOP}>
          <Feather name="plus" size={14} color="white" />
        </TouchableOpacity>

        {/* Expand chevron */}
        <Animated.View style={arrowStyle}>
          <Feather name="chevron-down" size={15} color={theme.colors.text.muted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Expandable food list — lazy rendered: null when never expanded */}
      {items.length > 0 && (
        <Animated.View style={expandStyle}>
          <View style={styles.foodList}>
            {items.map((item, idx) => (
              <FoodItemRow key={item.id ?? idx} item={item} />
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
});
MealRow.displayName = 'MealRow';

// Static hitSlop to avoid inline object
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

interface MealAccordionPanelProps {
  meals: FoodLogItem[];
  calorieGoal: number;
  onAddMeal: () => void;
  selectedDate: Date;
}

const MealAccordionPanelComponent = ({
  meals,
  calorieGoal,
  onAddMeal,
  selectedDate,
}: MealAccordionPanelProps) => {
  // Memoized grouped data — only recomputes when meals array changes
  const grouped = useMemo(() => ({
    breakfast: meals.filter(m => m.meal_type?.toLowerCase() === 'breakfast'),
    lunch: meals.filter(m => m.meal_type?.toLowerCase() === 'lunch'),
    dinner: meals.filter(m => m.meal_type?.toLowerCase() === 'dinner'),
  }), [meals]);

  const mealGoal = useMemo(() => Math.round(calorieGoal / 3), [calorieGoal]);

  const handleAdd = useCallback(() => onAddMeal(), [onAddMeal]);

  const totalLogged = useMemo(
    () => meals.reduce((s, m) => s + (m.calories ?? 0), 0),
    [meals]
  );

  return (
    <View style={styles.panel}>
      {/* Panel Header */}
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleRow}>
          <Feather name="clipboard" size={14} color={theme.colors.accent.green} />
          <Text style={styles.panelTitle}>Meals</Text>
        </View>
        <Text style={styles.panelTotal}>
          {Math.round(totalLogged)} / {calorieGoal} kcal
        </Text>
      </View>

      {/* Separator */}
      <View style={styles.panelDivider} />

      {/* Meal Rows */}
      <MealRow
        type="breakfast"
        title="Breakfast"
        calorieGoal={mealGoal}
        items={grouped.breakfast as any}
        onAdd={handleAdd}
      />
      <MealRow
        type="lunch"
        title="Lunch"
        calorieGoal={mealGoal}
        items={grouped.lunch as any}
        onAdd={handleAdd}
      />
      <MealRow
        type="dinner"
        title="Dinner"
        calorieGoal={mealGoal}
        items={grouped.dinner as any}
        onAdd={handleAdd}
        isLast
      />
    </View>
  );
};

export const MealAccordionPanel = memo(MealAccordionPanelComponent);
export default MealAccordionPanel;

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  panelTitle: {
    fontSize: 14,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  panelTotal: {
    fontSize: 12,
    fontFamily: theme.family.medium,
    color: theme.colors.text.muted,
  },
  panelDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },

  // Meal row
  mealRow: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  mealRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  mealIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTitleBlock: {
    flex: 1,
    gap: 1,
  },
  mealTitle: {
    fontSize: 13,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
  },
  mealSub: {
    fontSize: 10,
    fontFamily: theme.family.body,
    color: theme.colors.text.muted,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  calorieLogged: {
    fontSize: 14,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
  },
  calorieGoalText: {
    fontSize: 11,
    fontFamily: theme.family.body,
    color: theme.colors.text.muted,
  },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Food items list
  foodList: {
    paddingBottom: 10,
    gap: 2,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingLeft: 8,
    gap: 8,
  },
  foodDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  foodInfo: {
    flex: 1,
    gap: 1,
  },
  foodName: {
    fontSize: 12,
    fontFamily: theme.family.medium,
    color: theme.colors.text.primary,
  },
  foodQty: {
    fontSize: 10,
    fontFamily: theme.family.body,
    color: theme.colors.text.muted,
  },
  foodKcal: {
    fontSize: 12,
    fontFamily: theme.family.heading,
    color: theme.colors.accent.green,
  },
});
