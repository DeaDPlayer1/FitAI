/**
 * HeroSection — Reusable gradient hero header with overlap card slot.
 * The signature header pattern for every major screen.
 */
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface HeroSectionProps {
  children: ReactNode;
  variant?: 'primary' | 'sky' | 'pink' | 'success';
  height?: number;
  bottomRadius?: number;
  style?: ViewStyle;
  noStatusBarPadding?: boolean;
}

const VARIANT_GRADIENTS = {
  primary: [theme.colors.gradient.hero[0], theme.colors.gradient.hero[1]] as [string, string],
  sky: theme.colors.gradient.heroSkyBlue,
  pink: theme.colors.gradient.heroPink,
  success: theme.colors.gradient.heroSuccess,
};

export function HeroSection({
  children,
  variant = 'primary',
  height = 280,
  bottomRadius = 0,
  style,
  noStatusBarPadding,
}: HeroSectionProps) {
  return (
    <LinearGradient
      colors={VARIANT_GRADIENTS[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.gradient,
        {
          height,
          borderBottomLeftRadius: bottomRadius,
          borderBottomRightRadius: bottomRadius,
          paddingTop: noStatusBarPadding ? 0 : (StatusBar.currentHeight || 0) + 12,
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    paddingHorizontal: 20,
  },
});

export default HeroSection;
