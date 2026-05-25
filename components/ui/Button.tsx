import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { COLORS, RADIUS, FONT_SIZE } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const bgColor = () => {
    if (isDisabled) return COLORS.borderMid;
    switch (variant) {
      case 'secondary':
        return 'transparent';
      case 'danger':
        return COLORS.red;
      default:
        return COLORS.orange;
    }
  };

  const borderStyle = variant === 'secondary' ? {
    borderWidth: 1,
    borderColor: COLORS.orange,
  } : {};

  const textColor = variant === 'secondary' && !isDisabled
    ? COLORS.orange
    : COLORS.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: bgColor() },
        borderStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.textPrimary} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});
