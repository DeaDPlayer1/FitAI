import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');

const EXERCISES = [
  { name: 'Machine Chest Press', muscle: 'Chest', sets: 2, reps: '8-10', rir: '2 RIR' },
  { name: 'DB Incline Press', muscle: 'Chest', sets: 2, reps: '8-10', rir: '2 RIR' },
  { name: 'Cable Lateral Raise', muscle: 'Shoulders', sets: 2, reps: '10-12', rir: '1 RIR' },
  { name: 'Tricep Pushdown', muscle: 'Triceps', sets: 2, reps: '10-12', rir: '1 RIR' },
  { name: 'Face Pull', muscle: 'Rear Delts', sets: 2, reps: '12-15', rir: '1 RIR' },
];

export default function WorkoutSession() {
  const router = useRouter();
  const [currentEx, setCurrentEx] = useState(0);
  const [loggedSets, setLoggedSets] = useState<Record<number, { weight: number; reps: number }[]>>({});
  const [currentSet, setCurrentSet] = useState(1);
  const [weight, setWeight] = useState(40);
  const [reps, setReps] = useState(8);
  const [isComplete, setIsComplete] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (restTimer > 0) {
      const t = setTimeout(() => setRestTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [restTimer]);

  const totalSets = EXERCISES.reduce((s, e) => s + e.sets, 0);
  const doneSets = Object.values(loggedSets).flat().length;
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  const logSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoggedSets(prev => ({
      ...prev,
      [currentEx]: [...(prev[currentEx] || []), { weight, reps }],
    }));
    if (currentSet < EXERCISES[currentEx].sets) {
      setCurrentSet(s => s + 1);
      setRestTimer(90);
    } else if (currentEx < EXERCISES.length - 1) {
      setCurrentEx(e => e + 1);
      setCurrentSet(1);
      setWeight(40);
      setReps(8);
      setRestTimer(90);
    } else {
      setIsComplete(true);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (isComplete) {
    const totalVolume = Object.values(loggedSets).flat().reduce((sum, s) => sum + s.weight * s.reps, 0);
    return (
      <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={styles.completeCircle}>
          <Feather name="check" size={48} color="#00D68F" />
          </View>
          <Text style={styles.completeTitle}>SESSION COMPLETE</Text>
          <Text style={styles.completeSub}>Push Day · {new Date().toLocaleDateString()}</Text>
          <View style={styles.completeStats}>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatNum}>{formatTime(elapsed)}</Text>
              <Text style={styles.completeStatLabel}>Duration</Text>
            </View>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatNum}>{doneSets}</Text>
              <Text style={styles.completeStatLabel}>Sets</Text>
            </View>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatNum}>{totalVolume.toLocaleString()}</Text>
              <Text style={styles.completeStatLabel}>Volume (kg)</Text>
            </View>
          </View>
          <Text style={styles.perfPrompt}>How did this session feel?</Text>
          <View style={styles.emojiRow}>
            {[
              { emoji: '😮‍💨', label: 'Crushed it' },
              { emoji: '😊', label: 'Good' },
              { emoji: '😐', label: 'OK' },
              { emoji: '😩', label: 'Tough' },
            ].map((e, i) => (
              <TouchableOpacity key={i} style={styles.emojiCard} onPress={() => router.replace('/(tabs)')}>
                <Text style={styles.emojiIcon}>{e.emoji}</Text>
                <Text style={styles.emojiLabel}>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const ex = EXERCISES[currentEx];

  return (
    <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.sessionHeader}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="x" size={22} color="#C4B5FD" /></TouchableOpacity>
          <Text style={styles.sessionTitle}>PUSH DAY</Text>
          <Text style={styles.sessionTimer}>{formatTime(elapsed)}</Text>
        </View>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>

        {restTimer > 0 ? (
          <View style={styles.restOverlay}>
            <Text style={styles.restLabel}>REST</Text>
            <Text style={styles.restTimerBig}>{formatTime(restTimer)}</Text>
            <TouchableOpacity onPress={() => setRestTimer(0)}>
              <Text style={styles.skipRest}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Animated.View entering={FadeInDown.springify()} style={styles.exCard}>
              <View style={styles.musclePill}><Text style={styles.musclePillText}>{ex.muscle}</Text></View>
              <Text style={styles.exName}>{ex.name}</Text>
              <View style={styles.prescriptionRow}>
                <View style={styles.prescriptionItem}>
                  <Text style={styles.prescriptionNum}>{ex.sets}</Text>
                  <Text style={styles.prescriptionLabel}>sets</Text>
                </View>
                <Text style={styles.prescriptionSep}>·</Text>
                <View style={styles.prescriptionItem}>
                  <Text style={styles.prescriptionNum}>{ex.reps}</Text>
                  <Text style={styles.prescriptionLabel}>reps</Text>
                </View>
                <Text style={styles.prescriptionSep}>·</Text>
                <View style={styles.prescriptionItem}>
                  <Text style={styles.prescriptionNum}>{ex.rir}</Text>
                  <Text style={styles.prescriptionLabel}>RIR</Text>
                </View>
              </View>

              <Text style={styles.setHeader}>SET {currentSet} OF {ex.sets}</Text>

              <View style={styles.weightRow}>
                <TouchableOpacity style={styles.weightAdj} onPress={() => setWeight(w => Math.max(0, w - 5))}>
                  <Text style={styles.weightAdjText}>-5</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.weightValue}>{weight}</Text>
                  <Text style={styles.weightUnit}>kg</Text>
                </View>
                <TouchableOpacity style={styles.weightAdj} onPress={() => setWeight(w => w + 5)}>
                  <Text style={styles.weightAdjText}>+5</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.repsRow}>
                <TouchableOpacity style={styles.repsAdj} onPress={() => setReps(r => Math.max(1, r - 1))}>
                  <Feather name="minus" size={18} color="#C4B5FD" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.repsValue}>{reps}</Text>
                  <Text style={styles.weightUnit}>reps</Text>
                </View>
                <TouchableOpacity style={styles.repsAdj} onPress={() => setReps(r => r + 1)}>
                  <Feather name="plus" size={18} color="#C4B5FD" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.logBtn} onPress={logSet}>
                <Text style={styles.logBtnText}>LOG SET</Text>
              </TouchableOpacity>

              {loggedSets[currentEx] && (
                <View style={styles.loggedRow}>
                  {loggedSets[currentEx].map((s, i) => (
                    <View key={i} style={styles.loggedCircle}>
                      <Text style={styles.loggedCircleText}>{s.weight}×{s.reps}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  sessionHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  sessionTitle: { fontSize: 20, fontWeight: '800', color: '#F5F5F5' },
  sessionTimer: { fontSize: 18, color: '#8B5CF6' },
  progressBar: { height: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressFill: { height: '100%', backgroundColor: '#8B5CF6' },
  exCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 24 },
  musclePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  musclePillText: { fontSize: 11, color: '#8B5CF6' },
  exName: { fontSize: 32, fontWeight: '800', color: '#F5F5F5', marginTop: 12, lineHeight: 36 },
  prescriptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  prescriptionItem: { alignItems: 'center' },
  prescriptionNum: { fontSize: 22, fontWeight: '800', color: '#F5F5F5' },
  prescriptionLabel: { fontSize: 10, color: '#C4B5FD' },
  prescriptionSep: { fontSize: 22, color: theme.colors.text.muted },
  setHeader: { fontSize: 11, color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: 2, marginTop: 20, marginBottom: 8 },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginVertical: 12 },
  weightAdj: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  weightAdjText: { fontSize: 16, fontWeight: '600', color: '#C4B5FD' },
  weightValue: { fontSize: 48, fontWeight: '800', color: '#F5F5F5' },
  weightUnit: { fontSize: 14, color: '#C4B5FD', marginTop: -4 },
  repsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginVertical: 8 },
  repsAdj: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  repsValue: { fontSize: 36, fontWeight: '800', color: '#F5F5F5' },
  logBtn: { height: 56, borderRadius: 14, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  logBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  loggedRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  loggedCircle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.15)' },
  loggedCircleText: { fontSize: 12, color: '#8B5CF6' },
  restOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  restLabel: { fontSize: 12, color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: 2 },
  restTimerBig: { fontSize: 64, fontWeight: '800', color: '#8B5CF6', marginVertical: 12 },
  skipRest: { fontSize: 14, color: '#C4B5FD' },
  completeCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(139,92,246,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  completeTitle: { fontSize: 36, fontWeight: '800', color: '#F5F5F5' },
  completeSub: { fontSize: 15, color: '#C4B5FD', marginTop: 4 },
  completeStats: { flexDirection: 'row', gap: 24, marginVertical: 24 },
  completeStat: { alignItems: 'center' },
  completeStatNum: { fontSize: 28, fontWeight: '800', color: '#F5F5F5' },
  completeStatLabel: { fontSize: 11, color: '#C4B5FD', marginTop: 2 },
  perfPrompt: { fontSize: 15, color: '#F5F5F5', marginBottom: 12 },
  emojiRow: { flexDirection: 'row', gap: 10 },
  emojiCard: { width: 72, height: 72, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  emojiIcon: { fontSize: 28 },
  emojiLabel: { fontSize: 10, color: '#C4B5FD', marginTop: 4 },
  doneBtn: { marginTop: 24, height: 56, borderRadius: 16, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', width: '100%' },
  doneBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
