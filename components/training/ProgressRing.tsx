import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing, interpolate } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

export default function ProgressRing({
  size = 80, strokeWidth = 6, progress, color = '#6A49FA', bgColor = 'rgba(106,73,250,0.12)',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(progress, 0), 1);

  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withTiming(pct, { duration: 800, easing: Easing.out(Easing.quad) });
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - anim.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={bgColor} strokeWidth={strokeWidth} fill="none"
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          animatedProps={animatedProps}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
