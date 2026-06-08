/**
 * AIResponseCard — Rich AI response card with left accent border.
 * Used inside the AI Coach conversation for structured responses.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

type ResponseType = 'workout' | 'nutrition' | 'recovery' | 'motivation';

const TYPE_PRESETS: Record<ResponseType, { accent: string; bg: [string, string]; icon: React.ComponentProps<typeof Feather>['name']; label: string }> = {
  workout: {
    accent: theme.colors.primary,
    bg: [theme.colors.surface, '#FAF7FF'],
    icon: 'zap',
    label: 'Workout Adjustment',
  },
  nutrition: {
    accent: theme.colors.warning,
    bg: ['#FFFBF5', '#FEF7E8'],
    icon: 'pie-chart',
    label: 'Nutrition Plan',
  },
  recovery: {
    accent: theme.colors.success,
    bg: ['#F4FEF7', '#E8F9EE'],
    icon: 'activity',
    label: 'Recovery Analysis',
  },
  motivation: {
    accent: '#FB7185',
    bg: [theme.colors.tertiarySoft, theme.colors.tertiary],
    icon: 'heart',
    label: 'Stay Strong',
  },
};

interface AIResponseCardProps {
  type?: ResponseType;
  title?: string;
  body: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function AIResponseCard({ type = 'workout', title, body, action, style }: AIResponseCardProps) {
  const preset = TYPE_PRESETS[type];

  return (
    <View style={[styles.card, theme.shadow.soft, style]}>
      <View style={[styles.accent, { backgroundColor: preset.accent }]} />
      <LinearGradient
        colors={preset.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.headerRow}>
          <View style={[styles.iconBubble, { backgroundColor: preset.accent + '20' }]}>
            <Feather name={preset.icon} size={14} color={preset.accent} />
          </View>
          <Text style={[styles.label, { color: preset.accent }]}>
            {title || preset.label}
          </Text>
        </View>
        <Text style={styles.body}>{body}</Text>
        {action && (
          <Pressable
            style={[styles.actionBtn, { borderColor: preset.accent + '40' }]}
            onPress={action.onPress}
          >
            <Text style={[styles.actionText, { color: preset.accent }]}>{action.label}</Text>
            <Feather name="arrow-right" size={12} color={preset.accent} />
          </Pressable>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  accent: {
    width: 4,
  },
  gradient: {
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
  body: {
    fontSize: theme.font.size.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    marginTop: 4,
  },
  actionText: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
  },
});

export default AIResponseCard;
