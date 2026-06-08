/**
 * AvatarCircle — Circular avatar with initials fallback.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { theme } from '@/constants/theme';

interface AvatarCircleProps {
  name?: string | null;
  uri?: string | null;
  size?: number;
  variant?: 'glass' | 'solid' | 'gradient';
  borderColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AvatarCircle({
  name,
  uri,
  size = 42,
  variant = 'glass',
  borderColor,
  textColor = '#FFFFFF',
  style,
}: AvatarCircleProps) {
  const variantStyle =
    variant === 'glass'
      ? { backgroundColor: 'rgba(255,255,255,0.20)' }
      : variant === 'solid'
      ? { backgroundColor: theme.colors.primary }
      : {};

  const fontSize = size * 0.36;

  return (
    <View
      style={[
        styles.container,
        variantStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: borderColor ? 2 : 0,
          borderColor: borderColor || 'transparent',
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={{ color: textColor, fontSize, fontWeight: '700' }}>{initials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

export default AvatarCircle;
