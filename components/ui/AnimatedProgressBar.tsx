// UI: Animated progress bar with gradient fill and pill-shaped ends
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface AnimatedProgressBarProps {
  progress: number; // 0 to 1
  color?: string | string[]; // Single color or gradient array
  height?: number;
  label?: string;
  showPercent?: boolean;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  color = theme.colors.accent.primary,
  height = 8,
  label,
  showPercent = false,
}) => {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: clampedProgress,
      duration: 800,
      useNativeDriver: false, // width animation doesn't support native driver
    }).start();
  }, [clampedProgress]);

  const widthInterpolation = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const gradientColors: [string, string] = Array.isArray(color)
    ? [color[0] as string, (color[1] || color[0]) as string]
    : [color, color];

  return (
    <View style={styles.container}>
      {(label || showPercent) && (
        <View style={styles.header}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {showPercent && (
            <Text style={styles.percentText}>{Math.round(clampedProgress * 100)}%</Text>
          )}
        </View>
      )}
      
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View style={[styles.fillWrapper, { width: widthInterpolation as any }]}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradientFill, { borderRadius: height / 2 }]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: theme.text.secondary,
    fontSize: theme.font.size.sm,
    fontWeight: '500',
  },
  percentText: {
    color: theme.text.primary,
    fontSize: theme.font.size.sm,
    fontWeight: '600',
  },
  track: {
    backgroundColor: theme.colors.bg.tertiary,
    width: '100%',
    overflow: 'hidden',
  },
  fillWrapper: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  gradientFill: {
    flex: 1,
  },
});
