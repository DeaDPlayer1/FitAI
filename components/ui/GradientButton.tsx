/**
 * GradientButton — Purple gradient CTA button with spring scale animation.
 */
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'soft' | 'white' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  style?: ViewStyle;
  haptic?: boolean;
}

const VARIANT_GRADIENTS: Record<string, [string, string]> = {
  primary: [theme.colors.primary, theme.colors.primaryDeep],
  soft: [theme.colors.primarySoft, '#DDD6FE'],
  white: ['#FFFFFF', '#F3F0FF'],
  success: [theme.colors.success, '#16A34A'],
  warning: [theme.colors.warning, '#F97316'],
};

const VARIANT_TEXT_COLOR: Record<string, string> = {
  primary: '#FFFFFF',
  soft: theme.colors.primary,
  white: theme.colors.primary,
  success: '#FFFFFF',
  warning: '#FFFFFF',
};

export function GradientButton({
  title,
  onPress,
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  style,
  haptic = true,
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 14, stiffness: 200 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 200 });
  };
  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const heights = { sm: 40, md: 48, lg: 56 };
  const fontSizes = { sm: 14, md: 15, lg: 16 };
  const iconSizes = { sm: 14, md: 16, lg: 18 };

  return (
    <Animated.View style={[fullWidth ? { width: '100%' } : undefined, animatedStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[disabled && { opacity: 0.5 }, style]}
      >
        <LinearGradient
          colors={VARIANT_GRADIENTS[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            { height: heights[size] },
            variant === 'white' && theme.shadow.card,
            variant !== 'white' && theme.shadow.glow,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={VARIANT_TEXT_COLOR[variant]} />
          ) : (
            <View style={styles.content}>
              {icon && iconPosition === 'left' && (
                <Feather name={icon} size={iconSizes[size]} color={VARIANT_TEXT_COLOR[variant]} />
              )}
              <Text
                style={[
                  styles.text,
                  { color: VARIANT_TEXT_COLOR[variant], fontSize: fontSizes[size] },
                ]}
              >
                {title}
              </Text>
              {icon && iconPosition === 'right' && (
                <Feather name={icon} size={iconSizes[size]} color={VARIANT_TEXT_COLOR[variant]} />
              )}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default GradientButton;
