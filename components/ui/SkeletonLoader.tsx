import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { theme } from '@/constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  radius?: number;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

const SkeletonLoaderComponent = ({ width = '100%', height = 20, radius, borderRadius, style }: SkeletonLoaderProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeleton, { width, height, borderRadius: radius ?? borderRadius ?? theme.radius.md, opacity }, style]} />
  );
};

export const SkeletonLoader = memo(SkeletonLoaderComponent);
export default SkeletonLoader;

const styles = StyleSheet.create({
  skeleton: { backgroundColor: theme.colors.border.soft },
});
