/**
 * OverlapCard — Floating white card that overlaps the bottom of a hero section.
 * The signature visual trick from the reference image.
 * Creates depth by hovering a card over a gradient/hero background.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface OverlapCardProps extends ViewProps {
  children: React.ReactNode;
  offset?: number;
  delay?: number;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
}

export function OverlapCard({
  children,
  offset = 32,
  delay = 200,
  style,
  elevated = false,
  noPadding = false,
  ...rest
}: OverlapCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay).springify().damping(18)}
      style={[
        styles.card,
        elevated ? theme.shadow.float : theme.shadow.card,
        { marginHorizontal: 20, marginTop: -offset },
        noPadding && { padding: 0 },
        style,
      ]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.cardPadding,
    borderWidth: 0,
  },
});

export default OverlapCard;
