import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import ProgressRing from '@/components/ui/ProgressRingV2';
import MacroBar from '@/components/ui/MacroBar';

interface MacroData {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
}

interface PerformanceSnapshotProps {
  calories: number;
  calorieGoal: number;
  calorieRemaining: number;
  macros: MacroData[];
  workoutConsistency?: number;
  consistencyLabel?: string;
  hydration?: { value: number; target: number };
}

export function PerformanceSnapshot({
  calories,
  calorieGoal,
  calorieRemaining,
  macros,
  workoutConsistency = 0,
  consistencyLabel = 'This week',
  hydration,
}: PerformanceSnapshotProps) {
  const calorieProgress = calorieGoal > 0 ? Math.min(calories / calorieGoal, 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.ringsRow}>
        <View style={styles.ringCard}>
          <ProgressRing
            progress={calorieProgress}
            size={96}
            strokeWidth={9}
            color={theme.colors.primary}
            trackColor={theme.colors.primarySoft}
            centerLabel={`${Math.round(calories)}`}
            centerSub="kcal"
            duration={1200}
          />
          <Text style={styles.ringCardLabel}>Calories</Text>
          <Text style={styles.ringCardSub}>{calorieRemaining.toLocaleString()} remaining</Text>
        </View>

        {hydration && (
          <View style={styles.ringCard}>
            <ProgressRing
              progress={Math.min(hydration.value / hydration.target, 1)}
              size={96}
              strokeWidth={9}
              color={theme.colors.skyBlue}
              trackColor={theme.colors.secondarySoft}
              centerLabel={`${Math.round(hydration.value)}`}
              centerSub="glasses"
              duration={1200}
            />
            <Text style={styles.ringCardLabel}>Hydration</Text>
            <Text style={styles.ringCardSub}>Goal: {hydration.target}</Text>
          </View>
        )}
      </View>

      <View style={styles.macroSection}>
        <View style={styles.macroRow}>
          <View style={styles.macroIconWrap}>
            <Feather name="activity" size={14} color={theme.colors.primary} />
          </View>
          <Text style={styles.macroSectionTitle}>Macronutrients</Text>
        </View>
        <View style={styles.macroBars}>
          {macros.map((m, i) => (
            <MacroBar
              key={m.label}
              label={m.label}
              value={m.value}
              target={m.target}
              color={m.color}
              unit={m.unit || 'g'}
              delay={i * 100}
            />
          ))}
        </View>
      </View>

      {workoutConsistency > 0 && (
        <View style={styles.consistencyRow}>
          <LinearGradient
            colors={[theme.colors.successSoft, theme.colors.primarySoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.consistencyCard}
          >
            <View style={styles.consistencyLeft}>
              <Text style={styles.consistencyValue}>{Math.round(workoutConsistency * 100)}%</Text>
              <Text style={styles.consistencyLabel}>{consistencyLabel}</Text>
            </View>
            <View style={styles.consistencyBars}>
              {Array.from({ length: 7 }).map((_, i) => {
                const isFull = i / 7 < workoutConsistency;
                return (
                  <View
                    key={i}
                    style={[
                      styles.consistencyBar,
                      { backgroundColor: isFull ? theme.colors.success : theme.colors.border.subtle },
                    ]}
                  />
                );
              })}
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, marginHorizontal: 20 },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  ringCard: {
    flex: 1,
    maxWidth: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 16,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  ringCardLabel: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  ringCardSub: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  macroSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 18,
    ...theme.shadow.card,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  macroIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroSectionTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  macroBars: { gap: 12 },
  consistencyRow: {},
  consistencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radius.xl,
    padding: 16,
    ...theme.shadow.card,
  },
  consistencyLeft: {},
  consistencyValue: {
    fontSize: theme.font.size.h3,
    fontWeight: '800',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  consistencyLabel: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginTop: 2,
  },
  consistencyBars: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
  },
  consistencyBar: {
    width: 8,
    height: 28,
    borderRadius: 4,
  },
});

export default PerformanceSnapshot;
