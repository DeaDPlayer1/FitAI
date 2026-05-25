import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';

interface MacroBarProps {
  label: string;
  value: string;
  percentage: number;
  color: string;
}

export const MacroBar: React.FC<MacroBarProps> = ({ label, value, percentage, color }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animatedWidth, {
      toValue: Math.min(Math.max(percentage, 0), 100),
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [percentage]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View 
          style={[
            styles.bar, 
            { 
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.SPACING.xs,
  },
  label: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.colors.text.secondary,
    fontFamily: theme.family.heading,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.colors.text.primary,
    fontFamily: theme.family.number,
  },
  track: {
    height: 8,
    backgroundColor: theme.BACKGROUND.input,
    borderRadius: theme.RADIUS.pill,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: theme.RADIUS.pill,
  },
});
