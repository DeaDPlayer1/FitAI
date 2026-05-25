import React, { memo, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'orange' | 'green' | 'ghost' | 'danger';
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE = {
  large: { height: 60, radius: 22, fontSize: 18 },
  medium: { height: 50, radius: 18, fontSize: 16 },
  small: { height: 42, radius: 14, fontSize: 14 },
} as const;

const PrimaryButtonComponent = ({
  label,
  onPress,
  variant = 'orange',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: PrimaryButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const isDisabled = disabled || loading;
  const dims = SIZE[size];
  const wrapperStyle = [{ transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : undefined }, style];

  return (
    <Animated.View style={wrapperStyle}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        style={[
          styles.button,
          { height: dims.height, borderRadius: dims.radius },
          variant === 'ghost' && styles.ghost,
          variant === 'danger' && styles.danger,
          variant === 'green' && styles.green,
          isDisabled && styles.disabled,
        ]}
      >
        {(variant === 'orange' || variant === 'green') && !isDisabled ? (
          <LinearGradient
            colors={variant === 'orange' ? theme.colors.gradient.orange : theme.colors.gradient.green}
            style={[StyleSheet.absoluteFill, { borderRadius: dims.radius }]}
          />
        ) : null}
        {loading ? <ActivityIndicator color="#FFFFFF" /> : (
          <View style={styles.content}>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text style={[styles.label, { fontSize: dims.fontSize }, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const PrimaryButton = memo(PrimaryButtonComponent);
export default PrimaryButton;

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  green: {
    backgroundColor: theme.colors.accent.green,
    ...theme.shadow.green,
  },
  danger: {
    backgroundColor: theme.colors.danger,
    ...theme.shadow.orange,
  },
  ghost: { 
    backgroundColor: 'transparent', 
    borderWidth: 1.5, 
    borderColor: theme.colors.accent.orange,
  },
  disabled: { opacity: 0.4, shadowOpacity: 0, elevation: 0, backgroundColor: theme.colors.border.soft },
  content: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
  label: { color: '#FFFFFF', fontWeight: '600' },
  ghostLabel: { color: theme.colors.accent.orange },
});
