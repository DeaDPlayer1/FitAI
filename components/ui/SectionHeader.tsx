import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';

interface SectionHeaderProps {
  label: string;
  onActionPress?: () => void;
  actionLabel?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  label, 
  onActionPress, 
  actionLabel 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      {onActionPress && (
        <TouchableOpacity onPress={onActionPress}>
          <Text style={styles.action}>{actionLabel || 'See All'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
    marginTop: theme.SPACING.lg,
    paddingHorizontal: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.TEXT.muted,
    letterSpacing: 1.2,
  },
  action: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.COLORS.primary,
    fontWeight: '500',
  },
});
