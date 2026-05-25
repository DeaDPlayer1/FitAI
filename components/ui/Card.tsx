import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  tinted?: boolean;
  padding?: number;
}

// SPACING: Card internal padding default changed to 24px for breathing room
export default function Card({ children, style, tinted = false, padding = 24 }: CardProps) {
  return (
    <View 
      style={[
        styles.card, 
        tinted && styles.tinted,
        { padding },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)', // Thin, light gray border
    ...theme.shadow.card,
  },
  tinted: {
    backgroundColor: theme.colors.bg.greenTint,
  }
});
