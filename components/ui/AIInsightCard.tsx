import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import type { InsightCard } from '@/store/liveContextStore';

const TREND_ICONS: Record<string, { icon: string; color: string }> = {
  up: { icon: 'trending-up', color: '#22C55E' },
  down: { icon: 'trending-down', color: '#EF4444' },
  stable: { icon: 'minus', color: '#F59E0B' },
};

const TYPE_COLORS: Record<string, string> = {
  adherence: '#22C55E',
  recovery: '#8B5CF6',
  strength: '#F59E0B',
  nutrition: '#60A5FA',
  weight: '#EC4899',
  motivation: '#F97316',
  fatigue: '#EF4444',
  streak: '#10B981',
};

interface AIInsightCardProps {
  card: InsightCard;
  index: number;
  onPress?: () => void;
}

export default function AIInsightCard({ card, index, onPress }: AIInsightCardProps) {
  const trend = TREND_ICONS[card.trend] || TREND_ICONS.stable;
  const accent = TYPE_COLORS[card.type] || '#8B5CF6';

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 80).springify()}>
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: accent }]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={!onPress}
      >
        <View style={styles.topRow}>
          <Feather name={trend.icon as any} size={14} color={trend.color} />
          <View style={[styles.urgencyDot, { backgroundColor: card.urgency === 'high' ? '#EF4444' : card.urgency === 'medium' ? '#F59E0B' : '#22C55E' }]} />
        </View>
        <Text style={styles.headline}>{card.headline}</Text>
        <Text style={styles.body}>{card.body}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 3,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  body: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
});
