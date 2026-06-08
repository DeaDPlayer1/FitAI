/**
 * InsightCard — Colored AI insight card with left accent strip.
 * Used for AI Insights, Coach Notes, Recovery alerts, etc.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

type InsightType = 'nutrition' | 'recovery' | 'coach' | 'motivation' | 'warning';

const TYPE_PRESETS: Record<InsightType, { gradient: [string, string]; accent: string; iconBg: string; iconColor: string; label: string; icon: React.ComponentProps<typeof Feather>['name'] }> = {
  nutrition: {
    gradient: [theme.colors.gradient.insightNutrition[0], theme.colors.gradient.insightNutrition[1]],
    accent: theme.colors.warning,
    iconBg: theme.colors.warningSoft,
    iconColor: theme.colors.warning,
    label: 'Nutrition Insight',
    icon: 'pie-chart',
  },
  recovery: {
    gradient: [theme.colors.gradient.insightRecovery[0], theme.colors.gradient.insightRecovery[1]],
    accent: theme.colors.success,
    iconBg: theme.colors.successSoft,
    iconColor: theme.colors.success,
    label: 'Recovery',
    icon: 'star',
  },
  coach: {
    gradient: [theme.colors.gradient.insightCoach[0], theme.colors.gradient.insightCoach[1]],
    accent: theme.colors.primary,
    iconBg: theme.colors.primarySoft,
    iconColor: theme.colors.primary,
    label: 'Coach Note',
    icon: 'message-circle',
  },
  motivation: {
    gradient: [theme.colors.gradient.insightMotivation[0], theme.colors.gradient.insightMotivation[1]],
    accent: '#FB7185',
    iconBg: theme.colors.tertiarySoft,
    iconColor: '#FB7185',
    label: 'Stay Strong',
    icon: 'heart',
  },
  warning: {
    gradient: ['#FEF2F2', '#FEE2E2'],
    accent: theme.colors.danger,
    iconBg: theme.colors.dangerSoft,
    iconColor: theme.colors.danger,
    label: 'Heads Up',
    icon: 'alert-triangle',
  },
};

interface InsightCardProps {
  type?: InsightType;
  label?: string;
  text: string;
  action?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function InsightCard({ type = 'coach', label, text, action, onPress, style }: InsightCardProps) {
  const preset = TYPE_PRESETS[type];
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.98, { damping: 18, stiffness: 200 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 18, stiffness: 200 }))}
      >
        <LinearGradient
          colors={preset.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, theme.shadow.soft, style]}
        >
          <View style={[styles.accent, { backgroundColor: preset.accent }]} />
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <View style={[styles.iconBubble, { backgroundColor: preset.iconBg }]}>
                <Feather name={preset.icon} size={14} color={preset.iconColor} />
              </View>
              <Text style={[styles.label, { color: preset.accent }]}>
                {label || preset.label}
              </Text>
            </View>
            <Text style={styles.text}>{text}</Text>
            {action && (
              <View style={styles.actionRow}>
                <Text style={[styles.actionText, { color: preset.accent }]}>{action}</Text>
                <Feather name="arrow-right" size={12} color={preset.accent} />
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    minHeight: 110,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: theme.font.size.micro,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: theme.font.size.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  actionText: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
  },
});

export default InsightCard;
