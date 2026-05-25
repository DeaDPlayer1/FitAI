import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface FoodLogItemProps {
  id: string;
  name: string;
  calories: number;
  protein: number;
  mealType: string;
  timestamp: string;
  onDelete: (id: string) => void;
}

export const FoodLogItem: React.FC<FoodLogItemProps> = ({ 
  id, 
  name, 
  calories, 
  protein, 
  mealType,
  timestamp,
  onDelete 
}) => {
  const renderRightActions = () => (
    <TouchableOpacity 
      onPress={() => onDelete(id)}
      style={styles.deleteAction}
    >
      <Ionicons name="trash-outline" size={24} color={theme.TEXT.onAccent} />
    </TouchableOpacity>
  );

  const getMealIcon = () => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast': return 'sunny-outline';
      case 'lunch': return 'fast-food-outline';
      case 'dinner': return 'moon-outline';
      default: return 'restaurant-outline';
    }
  };

  const getIconColor = () => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast': return theme.COLORS.warning;
      case 'lunch': return theme.COLORS.primary;
      case 'dinner': return theme.COLORS.purple;
      default: return theme.COLORS.success;
    }
  };

  return (
    <GestureHandlerRootView>
      <Swipeable renderRightActions={renderRightActions}>
        <View style={styles.container}>
          <View style={[styles.iconCircle, { backgroundColor: getIconColor() + '20' }]}>
            <Ionicons name={getMealIcon()} size={20} color={getIconColor()} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.details}>
              {calories} kcal · {protein}g protein · {timestamp}
            </Text>
          </View>
        </View>
      </Swipeable>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.lg,
    backgroundColor: theme.BACKGROUND.card,
    borderRadius: theme.RADIUS.md,
    marginBottom: theme.SPACING.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.SPACING.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: '600',
    color: theme.TEXT.primary,
  },
  details: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.TEXT.muted,
    marginTop: 2,
  },
  deleteAction: {
    backgroundColor: theme.COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: theme.RADIUS.md,
    marginBottom: theme.SPACING.sm,
  },
});
