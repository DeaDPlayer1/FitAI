import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import GlassCard from './GlassCard';

interface MealCardProps {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string;
  minKcal?: number;
  maxKcal?: number;
  loggedItems?: any[];
  image?: string;
  onAdd: () => void;
  onPress?: () => void;
}

const meta = (mealType: string) => {
  const key = mealType.toLowerCase();
  if (key === 'breakfast') return { icon: 'sunrise', bg: 'rgba(255,107,44,0.15)', color: theme.colors.accent.orange };
  if (key === 'lunch') return { icon: 'sun', bg: 'rgba(57,211,83,0.12)', color: theme.colors.accent.green };
  if (key === 'dinner') return { icon: 'moon', bg: 'rgba(59,130,246,0.12)', color: theme.colors.accent.blue };
  return { icon: 'star', bg: 'rgba(139,92,246,0.12)', color: theme.colors.accent.purple };
};

export const MealCard = ({ mealType, minKcal = 0, maxKcal = 0, image, onAdd, onPress }: MealCardProps) => {
  const mealMeta = meta(mealType);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <GlassCard style={styles.card} variant="standard">
        <View style={styles.row}>
          <View style={styles.left}>
            <View style={styles.titleRow}>
              <View style={[styles.iconCircle, { backgroundColor: mealMeta.bg }]}>
                <Feather name={mealMeta.icon as any} size={22} color={mealMeta.color} />
              </View>
              <Text style={styles.mealTitle}>{mealType[0]?.toUpperCase() + mealType.slice(1)}</Text>
            </View>
            <Text style={styles.kcalRange}>{minKcal}-{maxKcal} kcal</Text>
          </View>
          <View style={styles.right}>
            {image ? (
              <Image source={{ uri: image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Feather name="coffee" size={24} color={theme.colors.text.muted} />
              </View>
            )}
            <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.9}>
              <Feather name="plus" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};
export default MealCard;

const styles = StyleSheet.create({
  card: { marginBottom: 16, minHeight: theme.card.height.meal, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  mealTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary },
  kcalRange: { fontSize: 13, color: theme.colors.text.secondary, marginLeft: 58 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: 44, height: 44, borderRadius: 22 },
  imagePlaceholder: { backgroundColor: theme.colors.bg.secondary, alignItems: 'center', justifyContent: 'center' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.green,
  },
});
