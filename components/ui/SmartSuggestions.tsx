import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface SuggestionCard {
  id: string;
  title: string;
  calories: number;
  protein: number;
  cookTime: string;
  tag: string;
  gradient: [string, string];
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
}

interface SmartSuggestionsProps {
  suggestions: SuggestionCard[];
}

function SuggestionCard({ item }: { item: SuggestionCard }) {
  return (
    <TouchableOpacity onPress={item.onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.tagBadge}>
          <Feather name="zap" size={9} color={theme.colors.primary} />
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
        <View style={styles.iconCircle}>
          <Feather name={item.icon} size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.calories} kcal</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{item.protein}g protein</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{item.cookTime}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function SmartSuggestions({ suggestions }: SmartSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      decelerationRate="fast"
      snapToInterval={200 + 14}
    >
      {suggestions.map((item) => (
        <SuggestionCard key={item.id} item={item} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 200,
    borderRadius: theme.radius.xl,
    padding: 16,
    gap: 8,
    ...theme.shadow.card,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.70)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: theme.font.size.micro,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  metaDot: {
    fontSize: theme.font.size.micro,
    color: 'rgba(255,255,255,0.40)',
  },
});

export default SmartSuggestions;
