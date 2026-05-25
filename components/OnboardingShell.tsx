import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import { GlassCard } from './ui/GlassCard';

interface OnboardingShellProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showBack?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

export default function OnboardingShell({
  step,
  totalSteps = 4,
  title,
  subtitle,
  children,
  showBack = true,
  showSkip = true,
  onSkip,
}: OnboardingShellProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.TEXT.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        {/* Stepper Dots */}
        <View style={styles.stepperContainer}>
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isCompleted = i < step - 1;
            const isCurrent = i === step - 1;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  isCurrent && styles.dotCurrent,
                  isCompleted && styles.dotCompleted,
                ]}
              />
            );
          })}
        </View>

        {showSkip ? (
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipBtn} />
        )}
      </View>

      <Animated.View 
        entering={FadeInDown.duration(400).springify()} 
        style={styles.flex}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <GlassCard style={styles.card} variant="standard">
          {children}
        </GlassCard>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg.primary,
    paddingHorizontal: theme.layout.screenPaddingH,
  },
  flex: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.SPACING.md,
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.RADIUS.sm,
  },
  stepperContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.border.soft,
    backgroundColor: 'transparent',
  },
  dotCurrent: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderColor: theme.colors.accent.orange,
    backgroundColor: 'transparent',
  },
  dotCompleted: {
    backgroundColor: theme.colors.accent.orange,
    borderColor: theme.colors.accent.orange,
  },
  skipBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: theme.colors.text.muted,
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: '600',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: theme.SPACING.xs,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    flex: 1,
    marginBottom: theme.SPACING.xxl,
  },
});
