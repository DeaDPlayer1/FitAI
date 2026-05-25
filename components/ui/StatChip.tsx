import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface StatChipProps {
  value: string | number;
  label: string;
}

export const StatChip: React.FC<StatChipProps> = ({ value, label }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.BACKGROUND.card,
    paddingVertical: theme.SPACING.md,
    paddingHorizontal: theme.SPACING.lg,
    borderRadius: theme.RADIUS.md,
    borderWidth: 1,
    borderColor: theme.BACKGROUND.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    ...theme.SHADOW,
  },
  value: {
    fontSize: theme.FONT_SIZE.xl,
    fontWeight: '700',
    color: theme.COLORS.primary,
  },
  label: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.TEXT.muted,
    marginTop: 2,
  },
});
