import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '@/constants/theme';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  centerLabel?: string;
  centerSub?: string;
  glowEffect?: boolean;
  animateOnMount?: boolean;
  label?: string;
  labelStyle?: any;
}

const ProgressRingComponent = ({
  progress,
  size = 160,
  strokeWidth = 14,
  color = theme.colors.accent.green,
  bgColor = theme.colors.border.subtle,
  centerLabel,
  centerSub,
  glowEffect = false,
  animateOnMount = true,
  label,
  labelStyle,
}: ProgressRingProps) => {
  const animated = useRef(new Animated.Value(animateOnMount ? 0 : progress)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: Math.max(0, Math.min(progress, 1)),
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(progress, 1));
  const strokeDashoffset = circumference - (clamped * circumference);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {glowEffect ? <View style={[styles.glow, { width: size, height: size, borderRadius: size / 2, shadowColor: color }]} /> : null}
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          {(centerLabel || label) ? <Text style={[styles.mainLabel, labelStyle]}>{centerLabel ?? label}</Text> : null}
          {centerSub ? <Text style={styles.subLabel}>{centerSub}</Text> : null}
        </View>
      </View>
    </View>
  );
};

export const ProgressRing = memo(ProgressRingComponent);
export default ProgressRing;

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', shadowOpacity: 0.24, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mainLabel: { color: theme.colors.text.primary, fontSize: theme.font.size.xxl, fontWeight: theme.font.weight.bold },
  subLabel: { color: theme.colors.text.secondary, fontSize: theme.font.size.xs, marginTop: 2 },
});
