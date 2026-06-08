import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface ChatHubCardProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  gradient?: string[];
  onPress: () => void;
  large?: boolean;
}

export function ChatHubCard({ icon, title, subtitle, gradient, onPress, large }: ChatHubCardProps) {
  const colors = gradient || [theme.colors.accent.primary, theme.colors.accent.brand];

  if (large) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.largeWrapper}>
        <LinearGradient colors={colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.largeGradient}>
          <View style={styles.largeContent}>
            <View style={styles.largeIconCircle}>
              <Feather name={icon} size={28} color="white" />
            </View>
            <Text style={styles.largeTitle}>{title}</Text>
            {subtitle && <Text style={styles.largeSubtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.largeArrow}>
            <Feather name="arrow-right" size={20} color="white" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.smallCard}>
      <View style={[styles.smallIconCircle, { backgroundColor: theme.colors.accent.lavender + '25' }]}>
        <Feather name={icon} size={22} color={theme.colors.accent.primary} />
      </View>
      <Text style={styles.smallTitle}>{title}</Text>
      {subtitle && <Text style={styles.smallSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  largeWrapper: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    ...theme.shadow.premium,
  },
  largeGradient: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  largeContent: {
    flex: 1,
    gap: 6,
  },
  largeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  largeTitle: {
    fontSize: theme.font.size.xl,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
  largeSubtitle: {
    fontSize: theme.font.size.sm,
    fontFamily: theme.font.family.medium,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  largeArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCard: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: theme.radius.lg,
    padding: 18,
    gap: 8,
    flex: 1,
    ...theme.shadow.card,
  },
  smallIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallTitle: {
    fontSize: theme.font.size.sm,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  smallSubtitle: {
    fontSize: 11,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    lineHeight: 16,
  },
});
