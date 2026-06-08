import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  Layout,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface FoodItem {
  id: string;
  foodName: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface MealCardData {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  iconColor: string;
  pastel: string;
  items: FoodItem[];
  onAddFood: () => void;
  onRemoveFood: (logId: string) => void;
  removingId?: string | null;
}

interface MealTimelineProps {
  meals: MealCardData[];
}

function MealCard({ meal, index }: { meal: MealCardData; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const mealCal = meal.items.reduce((s, l) => s + (l.calories || 0), 0);
  const mealProtein = meal.items.reduce((s, l) => s + (l.protein_g || 0), 0);
  const mealCarbs = meal.items.reduce((s, l) => s + (l.carbs_g || 0), 0);
  const mealFat = meal.items.reduce((s, l) => s + (l.fat_g || 0), 0);
  const hasItems = meal.items.length > 0;

  const qualityScore = hasItems
    ? Math.min(100, Math.round((mealProtein / 30 + mealCal / 500) * 50))
    : 0;
  const qualityLabel = qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : qualityScore >= 40 ? 'Fair' : 'Add food';

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).springify()}
      layout={Layout.springify()}
      style={cardAnim}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => { scale.value = withSpring(0.98); setExpanded(!expanded); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={styles.card}
      >
        <View style={styles.cardMain}>
          <View style={[styles.iconWrap, { backgroundColor: meal.pastel }]}>
            <Feather name={meal.icon} size={20} color={meal.iconColor} />
          </View>

          <View style={styles.cardCenter}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <View style={styles.macroRow}>
              {hasItems && (
                <>
                  <Text style={styles.macroText}>P {Math.round(mealProtein)}g</Text>
                  <Text style={styles.macroDot}>·</Text>
                  <Text style={styles.macroText}>C {Math.round(mealCarbs)}g</Text>
                  <Text style={styles.macroDot}>·</Text>
                  <Text style={styles.macroText}>F {Math.round(mealFat)}g</Text>
                </>
              )}
              {!hasItems && <Text style={styles.emptyHint}>No items logged</Text>}
            </View>
            {hasItems && (
              <View style={styles.qualityRow}>
                <View style={[styles.qualityDot, {
                  backgroundColor: qualityScore >= 60 ? theme.colors.success : qualityScore >= 40 ? theme.colors.warning : theme.colors.text.muted
                }]} />
                <Text style={styles.qualityText}>{qualityLabel}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardRight}>
            <Text style={styles.calValue}>{hasItems ? mealCal : '—'}</Text>
            {hasItems && <Text style={styles.calUnit}>kcal</Text>}
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.text.muted}
              style={{ marginTop: 4 }}
            />
          </View>
        </View>

        {expanded && (
          <Animated.View
            entering={FadeInDown.duration(250).springify()}
            style={styles.expandedArea}
          >
            <View style={styles.divider} />

            {hasItems ? (
              meal.items.map((item) => (
                <View key={item.id} style={styles.foodRow}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName} numberOfLines={1}>{item.foodName}</Text>
                    <Text style={styles.foodMacros}>
                      P {item.protein_g}g · C {item.carbs_g}g · F {item.fat_g}g
                    </Text>
                  </View>
                  <View style={styles.foodRightInner}>
                    <Text style={styles.foodCal}>{item.calories} kcal</Text>
                    <TouchableOpacity
                      onPress={() => meal.onRemoveFood(item.id)}
                      disabled={meal.removingId === item.id}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="x" size={16} color={theme.colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMeal}>No items logged yet.</Text>
            )}

            <TouchableOpacity style={styles.addBtn} onPress={meal.onAddFood} activeOpacity={0.7}>
              <Feather name="plus" size={14} color={theme.colors.primary} />
              <Text style={styles.addBtnText}>Log {meal.name}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function MealTimeline({ meals }: MealTimelineProps) {
  if (meals.length === 0) return null;

  return (
    <View style={styles.container}>
      {meals.map((meal, i) => (
        <MealCard key={meal.id} meal={meal} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    gap: 10,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    ...theme.shadow.card,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenter: {
    flex: 1,
    marginLeft: 14,
  },
  mealName: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  macroText: {
    fontSize: theme.font.size.micro,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  macroDot: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.muted,
  },
  emptyHint: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  qualityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  qualityText: {
    fontSize: theme.font.size.micro,
    fontWeight: '600',
    color: theme.colors.text.muted,
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  calValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  calUnit: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.muted,
    marginTop: -2,
  },
  expandedArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    marginBottom: 12,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  foodName: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  foodMacros: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  foodRightInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  foodCal: {
    fontSize: theme.font.size.caption,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  emptyMeal: {
    textAlign: 'center',
    fontSize: theme.font.size.caption,
    color: theme.colors.text.muted,
    paddingVertical: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primarySoft,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    marginTop: 10,
  },
  addBtnText: {
    fontSize: theme.font.size.caption,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});

export default MealTimeline;
