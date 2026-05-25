import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useWorkoutTrackingStore, SetRecord } from '../../store/workoutTrackingStore';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { Colors } from '../../constants/theme'; // Assuming there is a theme, otherwise use raw colors

interface SetRowProps {
  exerciseId: string;
  set: SetRecord;
}

export default function SetRow({ exerciseId, set }: SetRowProps) {
  const { updateSet, toggleSetComplete } = useWorkoutTrackingStore();
  
  // Micro-animation for completion
  const scale = useSharedValue(1);
  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: set.isCompleted ? '#10B981' : '#F3F4F6'
  }));

  const handleComplete = () => {
    scale.value = withTiming(0.8, { duration: 100 }, () => {
      scale.value = withTiming(1, { duration: 100 });
    });
    toggleSetComplete(exerciseId, set.id);
  };

  return (
    <View style={styles.row}>
      <Text style={styles.setNumber}>{set.setNumber}</Text>
      
      {/* Previous Performance Display */}
      <View style={styles.previousBox}>
        <Text style={styles.previousText}>
          {set.previousWeight 
            ? `${set.previousWeight}kg × ${set.previousReps}${set.previousRir ? ` @${set.previousRir}` : ''}` 
            : '—'}
        </Text>
      </View>

      <TextInput 
        style={[styles.input, set.isCompleted && styles.inputCompleted]}
        keyboardType="numeric"
        value={set.weight}
        onChangeText={(val) => updateSet(exerciseId, set.id, 'weight', val)}
        placeholder="kg"
        placeholderTextColor="#9CA3AF"
        editable={!set.isCompleted}
      />
      
      <TextInput 
        style={[styles.input, set.isCompleted && styles.inputCompleted]}
        keyboardType="numeric"
        value={set.reps}
        onChangeText={(val) => updateSet(exerciseId, set.id, 'reps', val)}
        placeholder="reps"
        placeholderTextColor="#9CA3AF"
        editable={!set.isCompleted}
      />

      <TouchableOpacity onPress={handleComplete} activeOpacity={0.7} style={styles.checkContainer}>
        <Animated.View style={[styles.checkCircle, animatedCheckStyle]}>
          {set.isCompleted && <Text style={styles.checkIcon}>✓</Text>}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  setNumber: { 
    width: 30, 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#374151',
    textAlign: 'center',
  },
  previousBox: { 
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousText: { 
    fontSize: 13, 
    color: '#9CA3AF', 
    fontWeight: '500' 
  },
  input: { 
    width: 65, 
    height: 44, 
    backgroundColor: '#F3F4F6', 
    borderRadius: 8, 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111827', 
    marginHorizontal: 8 
  },
  inputCompleted: { 
    backgroundColor: '#D1FAE5', 
    color: '#065F46' 
  },
  checkContainer: {
    paddingLeft: 8,
    paddingRight: 16,
  },
  checkCircle: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkIcon: { 
    color: 'white', 
    fontWeight: 'bold',
    fontSize: 16,
  }
});
