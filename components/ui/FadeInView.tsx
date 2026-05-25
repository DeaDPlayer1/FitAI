import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface FadeInViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  delay?: number;
}

export const FadeInView = ({ children, style, delay = 0 }: FadeInViewProps) => {
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay).springify().damping(16)}
      style={style}
    >
      {children}
    </Animated.View>
  );
};
