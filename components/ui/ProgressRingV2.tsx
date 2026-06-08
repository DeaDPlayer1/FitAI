/**
 * ProgressRing v2 — Animated SVG progress ring with center content.
 * Refined with reanimated, supports gradient and segments.
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, useDerivedValue } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  gradient?: [string, string];
  centerLabel?: string;
  centerSub?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
  rotate?: number;
  duration?: number;
}

export function ProgressRing({
  progress,
  size = 88,
  strokeWidth = 8,
  color = theme.colors.primary,
  trackColor = '#F0EEFC',
  gradient,
  centerLabel,
  centerSub,
  children,
  style,
  rotate = -90,
  duration = 1200,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.max(0, Math.min(progress, 1)), { duration });
  }, [progress, duration, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (animatedProgress.value * circumference),
  }));

  const strokeRef = gradient ? `url(#ringGrad-${Math.round(size)})` : color;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        {gradient && (
          <Defs>
            <LinearGradient id={`ringGrad-${Math.round(size)}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradient[0]} />
              <Stop offset="100%" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
        )}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeRef as string}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(${rotate} ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          {children}
          {centerLabel != null && (
            <Text style={[styles.mainLabel, { fontSize: size * 0.22 }]}>{centerLabel}</Text>
          )}
          {centerSub != null && <Text style={styles.subLabel}>{centerSub}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLabel: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  subLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.font.size.micro,
    marginTop: 2,
  },
});

export default ProgressRing;
