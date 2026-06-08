/**
 * FloatingCard — White card on light background.
 * Use OverlapCard for the floating-over-hero pattern.
 * Use this for general content cards.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps, TouchableOpacity, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

interface FloatingCardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  noPadding?: boolean;
  padding?: number;
  onPress?: () => void;
  variant?: 'default' | 'subtle' | 'elevated';
  haptic?: boolean;
}

export function FloatingCard({
  children,
  style,
  noPadding,
  padding,
  onPress,
  variant = 'default',
  haptic = true,
  ...rest
}: FloatingCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    if (!onPress) return;
    scale.value = withSpring(0.98, { damping: 18, stiffness: 200 });
  };
  const handlePressOut = () => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 18, stiffness: 200 });
  };
  const handlePress = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const shadowStyle = variant === 'elevated' ? theme.shadow.float : theme.shadow.card;
  const paddingStyle = noPadding ? { padding: 0 } : padding !== undefined ? { padding } : { padding: 20 };

  const card = (
    <View style={[styles.card, paddingStyle, shadowStyle, style as any]} {...rest}>
      {children}
    </View>
  );

  if (!onPress) return card;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: theme.colors.primaryGlow, borderless: false }}
      >
        {card}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 0,
  },
});

export default FloatingCard;
