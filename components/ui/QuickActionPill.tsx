/**
 * QuickActionPill — Pill button for quick actions on Home.
 */
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

type Variant = 'primary' | 'warning' | 'purple' | 'danger' | 'success';

const VARIANT_PRESETS: Record<Variant, { bg: string; fg: string }> = {
  primary: { bg: theme.colors.primary, fg: '#FFFFFF' },
  warning: { bg: theme.colors.warningSoft, fg: theme.colors.warning },
  purple: { bg: theme.colors.primarySoft, fg: theme.colors.primary },
  danger: { bg: theme.colors.tertiary, fg: theme.colors.danger },
  success: { bg: theme.colors.successSoft, fg: theme.colors.success },
};

interface QuickActionPillProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  variant?: Variant;
  onPress: () => void;
  style?: ViewStyle;
}

export function QuickActionPill({ icon, label, variant = 'primary', onPress, style }: QuickActionPillProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const preset = VARIANT_PRESETS[variant];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.pill, { backgroundColor: preset.bg }, style]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={() => (scale.value = withSpring(0.94, { damping: 14, stiffness: 200 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 200 }))}
      >
        <Feather name={icon} size={16} color={preset.fg} strokeWidth={2.5} />
        <Text style={[styles.label, { color: preset.fg }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.pill,
    height: 44,
  },
  label: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
  },
});

export default QuickActionPill;
