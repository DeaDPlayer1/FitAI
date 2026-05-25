import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import Card from './Card';

interface StatWidgetProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  iconBg?: string;
  onPress?: () => void;
}

export const StatWidget = ({ icon, label, value, unit, color, iconBg, onPress }: StatWidgetProps) => {
  const scale = useSharedValue(1);
  const ripple = useSharedValue(0);

  useEffect(() => {
    if (icon === 'heart') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    }
  }, [icon]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ripple.value * 2 }],
    opacity: interpolate(ripple.value, [0, 1], [0.3, 0], Extrapolate.CLAMP),
  }));

  const handlePress = () => {
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 600 });
    onPress?.();
  };

  return (
    <Card style={styles.card} padding={0}>
      <Pressable onPress={handlePress} style={styles.pressable} android_ripple={{ color: 'transparent' }}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: iconBg || theme.colors.bg.secondary }]}>
            <Animated.View style={icon === 'heart' ? animatedIconStyle : null}>
              <Feather name={icon} size={20} color={color || theme.colors.accent.green} />
            </Animated.View>
            <Animated.View style={[styles.ripple, rippleStyle, { backgroundColor: color || theme.colors.accent.green }]} />
          </View>
          <View style={styles.content}>
            <Text style={styles.value}>
              {value} <Text style={styles.unit}>{unit}</Text>
            </Text>
            <Text style={styles.label}>{label}</Text>
          </View>
        </View>
      </Pressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 80, overflow: 'hidden' },
  pressable: { flex: 1, padding: 16, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    zIndex: -1,
  },
  content: { flex: 1 },
  value: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  unit: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  label: {
    color: theme.colors.text.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    marginTop: 2,
    fontWeight: '500',
  },
});
