import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 72;

interface SwipeInsightCard {
  id: string;
  gradient: [string, string];
  accentColor: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  headline: string;
  body: string;
  confidence?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface AISwipeInsightsProps {
  cards: SwipeInsightCard[];
  onCardPress?: (index: number) => void;
  emptyMessage?: string;
}

function InsightCard({ card, index, onPress }: { card: SwipeInsightCard; index: number; onPress?: () => void }) {
  const scale = useSharedValue(1);

  const animatedCard = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.cardWrap, animatedCard]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 20, stiffness: 200 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 200 }); }}
        activeOpacity={1}
      >
        <LinearGradient
          colors={card.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, theme.shadow.soft]}
        >
          {/* Accent bar */}
          <View style={[styles.accentBar, { backgroundColor: card.accentColor }]} />

          <View style={styles.cardBody}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: card.accentColor + '20' }]}>
                <Feather name={card.icon} size={16} color={card.accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardLabel, { color: card.accentColor }]}>{card.label}</Text>
                <Text style={styles.cardHeadline}>{card.headline}</Text>
              </View>
              {card.confidence != null && (
                <View style={[styles.confidenceBadge, { backgroundColor: card.accentColor + '15' }]}>
                  <Text style={[styles.confidenceText, { color: card.accentColor }]}>
                    {Math.round(card.confidence * 100)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Body text */}
            <Text style={styles.cardBodyText} numberOfLines={3}>{card.body}</Text>

            {/* Action */}
            {card.actionLabel && (
              <View style={styles.cardActionRow}>
                <Text style={[styles.cardActionText, { color: card.accentColor }]}>{card.actionLabel}</Text>
                <Feather name="arrow-right" size={12} color={card.accentColor} />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function AISwipeInsights({ cards, onCardPress, emptyMessage }: AISwipeInsightsProps) {
  const scrollX = useSharedValue(0);

  if (cards.length === 0) {
    return emptyMessage ? (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    ) : null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        onScroll={(e) => {
          scrollX.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      >
        {cards.map((card, i) => (
          <InsightCard
            key={card.id}
            card={card}
            index={i}
            onPress={() => onCardPress?.(i)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // no extra styles
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  cardWrap: {
    width: CARD_W,
  },
  card: {
    flexDirection: 'row',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    minHeight: 150,
  },
  accentBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 18,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardLabel: {
    fontSize: theme.font.size.micro,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardHeadline: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 2,
    lineHeight: 20,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  confidenceText: {
    fontSize: theme.font.size.micro,
    fontWeight: '700',
  },
  cardBodyText: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardActionText: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.muted,
  },
});

export default AISwipeInsights;
