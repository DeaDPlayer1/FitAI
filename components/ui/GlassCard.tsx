import React, { memo, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'hero' | 'standard' | 'compact';
  glowColor?: 'orange' | 'green' | 'purple' | 'none';
  onPress?: () => void;
  disabled?: boolean;
  padding?: number;
  gradient?: boolean;
}

const VARIANT_STYLES = {
  hero: {
    backgroundColor: theme.colors.bg.tertiary,
    padding: theme.card.padding.hero,
    borderRadius: theme.card.radius.hero,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadow.hero,
  },
  standard: {
    backgroundColor: theme.colors.bg.secondary,
    padding: theme.card.padding.medium,
    borderRadius: theme.card.radius.standard,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadow.card,
  },
  compact: {
    backgroundColor: theme.colors.bg.elevated,
    padding: theme.card.padding.compact,
    borderRadius: theme.card.radius.compact,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadow.card,
  },
} as const;

const glowStyle = (glowColor: GlassCardProps['glowColor']) => {
  if (glowColor === 'orange') return theme.shadow.orange;
  if (glowColor === 'green') return theme.shadow.green;
  if (glowColor === 'purple') return { shadowColor: theme.colors.accent.purple, shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 };
  return null;
};

const GlassCardComponent: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'standard',
  glowColor = 'none',
  onPress,
  disabled = false,
  padding,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const baseStyle = [VARIANT_STYLES[variant], glowStyle(glowColor), padding !== undefined ? { padding } : null, style];

  if (!onPress) return <View style={baseStyle}>{children}</View>;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, ...theme.animation.spring }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, ...theme.animation.spring }).start()}
        style={baseStyle}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const GlassCard = memo(GlassCardComponent);
export default GlassCard;

const styles = StyleSheet.create({});
