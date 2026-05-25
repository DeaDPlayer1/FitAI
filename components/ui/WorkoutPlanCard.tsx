import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { GlassCard } from './GlassCard';
import { PrimaryButton } from './PrimaryButton';

interface Exercise {
  exercise: string;
  sets: number;
  reps: string | number;
}

interface WorkoutPlanCardProps {
  planName: string;
  source: 'AI' | 'Manual' | string;
  date: string;
  exercises: Exercise[];
  onStart: () => void;
}

export const WorkoutPlanCard: React.FC<WorkoutPlanCardProps> = ({
  planName,
  source,
  date,
  exercises,
  onStart,
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const isAI = source?.toLowerCase().includes('ai');

  return (
    <GlassCard style={styles.container} padding={0}>
      <TouchableOpacity 
        onPress={toggleExpand} 
        activeOpacity={0.7} 
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.titleSection}>
            <Text style={styles.planName}>{planName}</Text>
            <View style={[
              styles.badge, 
              { backgroundColor: isAI ? theme.COLORS.primaryLight : theme.BACKGROUND.input }
            ]}>
              <Text style={[
                styles.badgeText, 
                { color: isAI ? theme.COLORS.primary : theme.TEXT.secondary }
              ]}>
                {isAI ? 'AI Generated' : 'Manual Plan'}
              </Text>
            </View>
          </View>
          <Feather 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.TEXT.muted} 
          />
        </View>
        <Text style={styles.date}>{date}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.details}>
          <View style={styles.exerciseList}>
            {exercises.map((ex, idx) => (
              <View key={idx} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>{ex.exercise}</Text>
                <Text style={styles.exerciseStats}>{ex.sets} × {ex.reps}</Text>
              </View>
            ))}
          </View>
          <PrimaryButton 
            label="Start Workout" 
            onPress={onStart} 
            style={styles.startButton} 
          />
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.SPACING.md,
  },
  header: {
    padding: theme.SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  planName: {
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: '700',
    color: theme.TEXT.primary,
    marginBottom: theme.SPACING.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.RADIUS.xs,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: theme.FONT_SIZE.xs,
    color: theme.TEXT.muted,
  },
  details: {
    paddingHorizontal: theme.SPACING.lg,
    paddingBottom: theme.SPACING.lg,
  },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: theme.BACKGROUND.cardBorder,
    paddingTop: theme.SPACING.md,
    marginBottom: theme.SPACING.lg,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  exerciseName: {
    fontSize: theme.FONT_SIZE.md,
    color: theme.TEXT.secondary,
  },
  exerciseStats: {
    fontSize: theme.FONT_SIZE.md,
    fontWeight: '600',
    color: theme.COLORS.primary,
  },
  startButton: {
    height: 44,
  },
});
