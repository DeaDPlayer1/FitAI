import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS, FONT_SIZE } from '@/constants/theme';

interface BadgeProps {
  text: string;
  color: string;
  bgColor: string;
}

export default function Badge({ text, color, bgColor }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
});
