import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInUp, FadeOutDown,
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence, interpolate, interpolateColor, Easing,
} from 'react-native-reanimated';
import { useWorkoutTrackingStore } from '../../store/workoutTrackingStore';
import { Feather } from '@expo/vector-icons';

const REST_TIPS = [
  'Deep breath in... slow breath out.',
  'Shake out your arms and legs.',
  'Visualise your next set with perfect form.',
  'Hydrate — even 1% dehydration drops performance.',
  'Set your grip and brace your core.',
  'Controlled reps beat heavy cheats.',
  'Drop your shoulders and reset your posture.',
];

function BreathingRing({ seconds, total }: { seconds: number; total: number }) {
  const progress = useSharedValue(0);
  const breathe = useSharedValue(0);
  const pct = Math.max(0, seconds / Math.max(total, 1));

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 300, easing: Easing.out(Easing.quad) });
  }, [pct]);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.92, 1.08]) }],
    opacity: interpolate(breathe.value, [0, 1], [0.6, 1]),
    borderColor: seconds <= 10
      ? '#EF4444'
      : interpolateColor(progress.value, [0, 0.5, 1], ['#6A49FA', '#00D68F', '#6A49FA']),
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.04]) }],
  }));

  return (
    <Animated.View style={[s.restCircle, ringStyle]}>
      <Animated.View style={[s.restCircleInner, innerStyle]}>
        <Text style={[s.restTimerText, seconds <= 10 && { color: '#EF4444' }]}>
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
        </Text>
        <Text style={s.restSubText}>REST</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function RestTimerOverlay() {
  const { activeRestTimer, clearRestTimer, addRestTime } = useWorkoutTrackingStore();
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    if (activeRestTimer === null) return;
    const iv = setInterval(() => setTipIdx((p) => (p + 1) % REST_TIPS.length), 4000);
    return () => clearInterval(iv);
  }, [activeRestTimer]);

  if (activeRestTimer === null) return null;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(14)}
      exiting={FadeOutDown.duration(200)}
      style={s.container}
    >
      <Text style={s.heading}>READY</Text>
      <BreathingRing seconds={activeRestTimer} total={90} />
      <Text style={s.tip}>"{REST_TIPS[tipIdx]}"</Text>
      <View style={s.btns}>
        <TouchableOpacity style={s.addTimeBtn} onPress={() => addRestTime(30)} activeOpacity={0.8}>
          <Feather name="plus" size={13} color="#6A49FA" />
          <Text style={s.addTimeText}>+30s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.skipBtn} onPress={clearRestTimer} activeOpacity={0.8}>
          <Text style={s.skipText}>Skip</Text>
          <Feather name="skip-forward" size={13} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24,
    borderWidth: 1, borderColor: '#F0F0F0',
    alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  heading: {
    fontSize: 11, fontWeight: '700', color: '#6A49FA',
    letterSpacing: 2,
  },
  restCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(106,73,250,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  restCircleInner: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: '#6A49FA',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  restTimerText: {
    fontSize: 26, fontWeight: '800', color: '#1B1B1F',
    fontVariant: ['tabular-nums'],
  },
  restSubText: {
    fontSize: 9, fontWeight: '700', color: 'rgba(0,0,0,0.3)',
    letterSpacing: 1,
  },
  tip: {
    fontSize: 12, fontWeight: '500', color: 'rgba(0,0,0,0.45)',
    textAlign: 'center', fontStyle: 'italic',
  },
  btns: { flexDirection: 'row', gap: 12 },
  addTimeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: 'rgba(106,73,250,0.12)', borderRadius: 14,
  },
  addTimeText: { fontSize: 13, fontWeight: '700', color: '#6A49FA' },
  skipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: '#6A49FA', borderRadius: 14,
  },
  skipText: { fontSize: 13, fontWeight: '700', color: 'white' },
});
