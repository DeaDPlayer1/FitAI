import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '@/constants/theme';

interface AnimatedBarProps {
  progress: number;
  color?: string;
  height?: number;
  radius?: number;
  label?: string;
  value?: string;
  showPercent?: boolean;
  delay?: number;
}

const AnimatedBarComponent = ({
  progress,
  color = theme.colors.accent.orange,
  height = 6,
  radius = theme.radius.pill,
  label,
  value,
  showPercent = false,
  delay = 0,
}: AnimatedBarProps) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(progress, 1));

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clamped,
      duration: 600 + delay,
      delay,
      useNativeDriver: false,
    }).start();
  }, [clamped, delay, widthAnim]);

  const width = widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View>
      {(label || value || showPercent) ? (
        <View style={styles.top}>
          <Text style={styles.label}>{label ?? ''}</Text>
          <Text style={styles.value}>{value ?? (showPercent ? `${Math.round(clamped * 100)}%` : '')}</Text>
        </View>
      ) : null}
      <View style={[styles.track, { height, borderRadius: radius }]}>
        <Animated.View style={[styles.fill, { width, backgroundColor: color, borderRadius: radius }]} />
      </View>
    </View>
  );
};

export const AnimatedBar = memo(AnimatedBarComponent);
export default AnimatedBar;

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: theme.colors.text.secondary, fontSize: 12 },
  value: { color: theme.colors.text.secondary, fontSize: 12, fontWeight: '600' },
  track: { backgroundColor: theme.colors.border.soft, overflow: 'hidden' },
  fill: { height: '100%' },
});

