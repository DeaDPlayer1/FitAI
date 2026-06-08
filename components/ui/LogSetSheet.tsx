import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { logSet } from '@/lib/workoutDataService';
import GradientButton from './GradientButton';

const SHEET_HEIGHT = 360;

interface LogSetSheetProps {
  visible: boolean;
  exerciseName: string;
  targetSets: number;
  onClose: () => void;
  onSaved: () => void;
}

export function LogSetSheet({ visible, exerciseName, targetSets, onClose, onSaved }: LogSetSheetProps) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [saving, setSaving] = useState(false);
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setWeight('');
      setReps('');
      translateY.value = withSpring(0, { damping: 22, stiffness: 160 });
      backdropOpacity.value = withTiming(0.4, { duration: 200 });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: visible ? 'auto' as const : 'none' as const,
  }));

  if (!visible) return null;

  const handleSave = async () => {
    if (!weight || !reps) return;
    setSaving(true);
    const ok = await logSet(exerciseName, weight, reps);
    setSaving(false);
    if (ok) {
      onSaved();
      onClose();
    }
  };

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle}>
            <View style={styles.handleBar} />
          </View>

          <Text style={styles.title}>Log Set</Text>
          <Text style={styles.subtitle}>{exerciseName}</Text>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.text.muted}
                autoFocus
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.text.muted}
              />
            </View>
          </View>

          <Text style={styles.targetHint}>Target: {targetSets} sets</Text>

          <GradientButton
            title={saving ? 'Saving...' : 'Save Set'}
            variant="primary"
            size="lg"
            onPress={handleSave}
            disabled={saving || !weight || !reps || isNaN(Number(weight)) || isNaN(Number(reps))}
            style={{ marginTop: 16 }}
          />

          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 998,
  },
  keyboardWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    ...theme.shadow.hero,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surfaceTint,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  targetHint: {
    fontSize: 12,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
});

export default LogSetSheet;
