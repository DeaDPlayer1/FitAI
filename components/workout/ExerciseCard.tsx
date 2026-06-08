import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ExerciseRecord } from '../../store/workoutTrackingStore';
import SetRow from './SetRow';
import { Feather } from '@expo/vector-icons';

interface ExerciseCardProps {
  exercise: ExerciseRecord;
  onEdit?: () => void;
}

export default function ExerciseCard({ exercise, onEdit }: ExerciseCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="more-horizontal" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.columnLabel, { width: 30, textAlign: 'center' }]}>Set</Text>
        <Text style={[styles.columnLabel, { flex: 1, textAlign: 'center' }]}>Previous</Text>
        <Text style={[styles.columnLabel, { width: 65, textAlign: 'center', marginHorizontal: 8 }]}>kg</Text>
        <Text style={[styles.columnLabel, { width: 65, textAlign: 'center', marginHorizontal: 8 }]}>Reps</Text>
        <Text style={[styles.columnLabel, { width: 48, textAlign: 'center' }]}>Done</Text>
      </View>

      {exercise.sets.map((set) => (
        <SetRow key={set.id} exerciseId={exercise.id} set={set} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  editBtn: { padding: 4 },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
});

