import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useWorkoutTrackingStore } from '../../store/workoutTrackingStore';
import { Feather } from '@expo/vector-icons';

export default function RestTimerOverlay() {
  const { activeRestTimer, clearRestTimer } = useWorkoutTrackingStore();

  if (activeRestTimer === null) return null;

  const minutes = Math.floor(activeRestTimer / 60);
  const seconds = activeRestTimer % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Animated.View 
      entering={FadeInDown.duration(300)} 
      exiting={FadeOutDown.duration(300)}
      style={styles.container}
    >
      <View style={styles.timerContent}>
        <Feather name="clock" size={24} color="#10B981" />
        <View style={styles.textContainer}>
          <Text style={styles.label}>Rest Timer</Text>
          <Text style={styles.time}>{timeString}</Text>
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={clearRestTimer}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above tab bar if any
    left: 20,
    right: 20,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  time: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  skipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
