import React, { useEffect } from 'react';
import { StyleSheet, TextInput, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, useDerivedValue } from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface CountingTextProps {
  value: number;
  duration?: number;
  style?: TextStyle;
  suffix?: string;
  prefix?: string;
  fixed?: number;
}

export const CountingText = ({ 
  value, 
  duration = 2000, 
  style, 
  suffix = '', 
  prefix = '',
  fixed = 0
}: CountingTextProps) => {
  const count = useSharedValue(0);

  useEffect(() => {
    count.value = withTiming(value, { duration });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: `${prefix}${count.value.toFixed(fixed)}${suffix}`,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={`${prefix}0${suffix}`}
      style={[styles.text, style]}
      animatedProps={animatedProps}
    />
  );
};

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
    color: '#1A1A1A',
  },
});
