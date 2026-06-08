import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface ActionPill {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  variant?: 'primary' | 'purple' | 'warning' | 'success' | 'neutral';
  onPress?: () => void;
}

interface TodayFocusCardProps {
  workoutName?: string;
  hasWorkoutToday: boolean;
  isRestDay: boolean;
  primaryAction: () => void;
  secondaryActions: ActionPill[];
  onActionPress?: (label: string) => void;
}

export function TodayFocusCard({
  workoutName,
  hasWorkoutToday,
  isRestDay,
  primaryAction,
  secondaryActions,
  onActionPress,
}: TodayFocusCardProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={primaryAction} activeOpacity={0.9}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1.2 }}
          style={[styles.primaryCard, theme.shadow.glow]}
        >
          {hasWorkoutToday && !isRestDay ? (
            <View style={styles.content}>
              <View style={styles.topRow}>
                <View style={styles.iconWrap}>
                  <Feather name="zap" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.tag}>Today's Workout</Text>
              </View>
              <Text style={styles.workoutName}>{workoutName || 'Workout'}</Text>
              <View style={styles.startRow}>
                <Text style={styles.startLabel}>Start Workout</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </View>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.emptyIcon}>
                <Feather name="calendar" size={24} color="rgba(255,255,255,0.40)" />
              </View>
              <Text style={styles.emptyTitle}>{isRestDay ? 'Rest Day' : 'No Workout Today'}</Text>
              <Text style={styles.emptySub}>
                {isRestDay ? 'Focus on recovery and mobility' : 'Set up your training split'}
              </Text>
              <View style={styles.startRow}>
                <Text style={styles.startLabel}>{isRestDay ? 'Mobility & Recovery' : 'Start Workout'}</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </View>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {secondaryActions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsRow}
        >
          {secondaryActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.actionPill,
                action.variant === 'primary' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                action.variant === 'purple' && { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primaryGlow },
                action.variant === 'warning' && { backgroundColor: theme.colors.warningSoft, borderColor: 'rgba(245,158,11,0.20)' },
                action.variant === 'success' && { backgroundColor: theme.colors.successSoft, borderColor: 'rgba(16,185,129,0.20)' },
              ]}
              onPress={() => { onActionPress?.(action.label); action.onPress?.(); }}
              activeOpacity={0.7}
            >
              <Feather
                name={action.icon}
                size={14}
                color={
                  action.variant === 'primary' ? '#FFFFFF'
                  : action.variant === 'purple' ? theme.colors.primary
                  : action.variant === 'success' ? theme.colors.success
                  : action.variant === 'warning' ? theme.colors.warning
                  : theme.colors.text.secondary
                }
              />
              <Text style={[
                styles.actionPillText,
                action.variant === 'primary' && { color: '#FFFFFF' },
                action.variant === 'purple' && { color: theme.colors.primary },
                action.variant === 'success' && { color: theme.colors.success },
                action.variant === 'warning' && { color: theme.colors.warning },
              ]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  primaryCard: {
    borderRadius: theme.radius.xl,
    padding: 20,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  content: { gap: 12 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  workoutName: {
    color: '#FFFFFF',
    fontSize: theme.font.size.h3,
    fontWeight: '800',
    fontFamily: theme.font.family.heading,
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  startLabel: {
    color: '#FFFFFF',
    fontSize: theme.font.size.body,
    fontWeight: '700',
  },
  emptyIcon: {
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: theme.font.size.title,
    fontWeight: '700',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: theme.font.size.caption,
  },
  actionsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: theme.colors.border.soft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
  },
  actionPillText: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});

export default TodayFocusCard;
