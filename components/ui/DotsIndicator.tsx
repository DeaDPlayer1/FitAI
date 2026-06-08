/**
 * DotsIndicator — Horizontal pagination dots.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface DotsIndicatorProps {
  total: number;
  active: number;
  style?: ViewStyle;
}

export function DotsIndicator({ total, active, style }: DotsIndicatorProps) {
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === active ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  active: {
    width: 20,
    backgroundColor: theme.colors.primary,
  },
  inactive: {
    width: 6,
    backgroundColor: '#D1D5DB',
  },
});

export default DotsIndicator;
