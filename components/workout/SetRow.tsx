import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Vibration, Platform } from 'react-native';
import { useWorkoutTrackingStore, SetRecord } from '../../store/workoutTrackingStore';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming, withSpring,
  interpolate, interpolateColor, Easing, ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

interface SetRowProps {
  exerciseId: string;
  set: SetRecord;
}

function CompletionGlow({ visible }: { visible: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = 0;
      opacity.value = 0.6;
      scale.value = withTiming(2.5, { duration: 500, easing: Easing.out(Easing.quad) });
      opacity.value = withTiming(0, { duration: 500 });
    }
  }, [visible]);

  const glow = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;
  return <Animated.View style={[styles.glowBurst, glow]} />;
}

export default function SetRow({ exerciseId, set }: SetRowProps) {
  const { updateSet, toggleSetComplete } = useWorkoutTrackingStore();
  const [justCompleted, setJustCompleted] = useState(false);

  const scale = useSharedValue(1);
  const bg = useSharedValue(0);

  const animatedRow = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: set.isCompleted
      ? 'rgba(0,214,143,0.06)'
      : interpolateColor(bg.value, [0, 1], ['rgba(255,255,255,0.04)', 'rgba(106,73,250,0.06)']),
    borderColor: set.isCompleted
      ? 'rgba(0,214,143,0.2)'
      : interpolateColor(bg.value, [0, 1], ['transparent', 'rgba(106,73,250,0.3)']),
  }));

  const handleComplete = () => {
    if (!set.isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate(30);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    scale.value = withSpring(0.94, { damping: 12, stiffness: 200, mass: 0.5 });
    scale.value = withSpring(1, { damping: 10, stiffness: 150 });
    toggleSetComplete(exerciseId, set.id);
  };

  const handlePressIn = () => {
    bg.value = withTiming(1, { duration: 150 });
  };
  const handlePressOut = () => {
    bg.value = withTiming(0, { duration: 200 });
  };

  return (
    <Animated.View style={[styles.row, animatedRow]}>
      <CompletionGlow visible={justCompleted} />
      <View style={[styles.setNumBox, set.isCompleted && styles.setNumBoxDone]}>
        <Text style={[styles.setNumber, set.isCompleted && styles.setNumberDone]}>{set.setNumber}</Text>
      </View>

      <View style={styles.previousBox}>
        <Text style={styles.previousText}>
          {set.previousWeight
            ? `${set.previousWeight}kg × ${set.previousReps}${set.previousRir ? ` @${set.previousRir}` : ''}`
            : '—'}
        </Text>
      </View>

      <TextInput
        style={[styles.input, set.isCompleted && styles.inputDone]}
        keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
        value={set.weight}
        onChangeText={(val) => updateSet(exerciseId, set.id, 'weight', val)}
        placeholder={set.previousWeight || 'kg'}
        placeholderTextColor="rgba(255,255,255,0.2)"
        editable={!set.isCompleted}
      />

      <TextInput
        style={[styles.input, set.isCompleted && styles.inputDone]}
        keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
        value={set.reps}
        onChangeText={(val) => updateSet(exerciseId, set.id, 'reps', val)}
        placeholder={set.previousReps || 'reps'}
        placeholderTextColor="rgba(255,255,255,0.2)"
        editable={!set.isCompleted}
      />

      <TouchableOpacity
        onPress={handleComplete}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        style={styles.checkContainer}
      >
        <View style={[styles.checkCircle, set.isCompleted && styles.checkCircleDone]}>
          {set.isCompleted
            ? <Feather name="check" size={18} color="#0D0D0F" />
            : <Feather name="circle" size={18} color="rgba(255,255,255,0.2)" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 16, marginBottom: 6, borderWidth: 1, overflow: 'hidden',
  },
  glowBurst: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(0,214,143,0.15)', top: -30, left: -20,
  },
  setNumBox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  setNumBoxDone: { backgroundColor: '#00D68F' },
  setNumber: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  setNumberDone: { color: '#0D0D0F' },
  previousBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previousText: { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: '500' },
  input: {
    width: 60, height: 40,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    textAlign: 'center', fontSize: 16, fontWeight: '700',
    color: '#FFFFFF', marginHorizontal: 4, fontVariant: ['tabular-nums'],
  },
  inputDone: { backgroundColor: 'rgba(0,214,143,0.12)', color: '#00D68F' },
  checkContainer: { paddingLeft: 8 },
  checkCircle: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleDone: { backgroundColor: '#00D68F' },
});
