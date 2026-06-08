/**
 * ExerciseRow — Card for a single exercise in a list.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface ExerciseRowProps {
  name: string;
  setsReps: string;
  muscle: string;
  progress?: number;
  style?: ViewStyle;
  onPress?: () => void;
}

export function ExerciseRow({ name, setsReps, muscle, progress, style, onPress }: ExerciseRowProps) {
  return (
    <View style={[styles.container, theme.shadow.card, style]}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.setsReps}>{setsReps}</Text>
        </View>
        <View style={styles.musclePill}>
          <Text style={styles.muscleText}>{muscle.replace(/\b\w/g, c => c.toUpperCase())}</Text>
        </View>
      </View>
      {progress !== undefined && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(progress, 1)) * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  setsReps: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  musclePill: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  muscleText: {
    fontSize: theme.font.size.micro,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#F0EEFC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
});

export default ExerciseRow;
