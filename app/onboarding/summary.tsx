import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useModeStore } from '@/store/modeStore';
import { COLORS, theme } from '@/constants/theme';

const LABELS: Record<string, string> = {
  fat_loss: '🔥 Lose Weight',
  muscle_gain: '💪 Build Muscle',
  endurance: '🏃 Improve Endurance',
  active: '⚡ Stay Active',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  gym: '🏋️ Full Gym',
  home_full: '🏠 Home + Equipment',
  none: '🙌 Bodyweight Only',
};

export default function SummaryScreen() {
  const router = useRouter();
  const { data, reset } = useOnboardingStore();
  const appMode = useModeStore((s) => s.appMode);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    reset();
    router.replace(appMode === 'ai_trainer' ? '/(ai-trainer)' : '/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1B1B1F" />
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.dot, styles.dotActive]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        <View style={styles.emojiRow}>
          <Text style={styles.emoji}>🎯</Text>
        </View>
        <Text style={styles.heading}>Your plan is ready</Text>
        <Text style={styles.subtitle}>Here's what we've set up for you.</Text>

        <View style={styles.cardsGrid}>
          {data.goal && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{LABELS[data.goal] || data.goal}</Text>
            </View>
          )}
          {data.frequency && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{data.frequency} Days / Week</Text>
            </View>
          )}
          {data.equipment && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{LABELS[data.equipment] || data.equipment}</Text>
            </View>
          )}
          {data.experienceLevel && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{LABELS[data.experienceLevel] || data.experienceLevel}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          {data.age && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.age}</Text>
              <Text style={styles.statLabel}>Age</Text>
            </View>
          )}
          {data.height && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.height}{data.heightUnit}</Text>
              <Text style={styles.statLabel}>Height</Text>
            </View>
          )}
          {data.weight && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.weight}{data.weightUnit}</Text>
              <Text style={styles.statLabel}>Weight</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <View style={styles.bottom}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.startBtn}
          onPress={handleStart}
        >
          <Text style={styles.startBtnText}>Start Training</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5FB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 20, borderRadius: 4, height: 8, backgroundColor: '#6A49FA' },
  dotActive: {},
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  emojiRow: { alignItems: 'center', marginBottom: 16 },
  emoji: { fontSize: 56 },
  heading: { fontSize: 28, fontWeight: '800', color: '#1B1B1F', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6E6E73', textAlign: 'center', marginBottom: 28 },
  cardsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999,
    backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: '#6A49FA20',
  },
  chipText: { fontSize: 14, fontWeight: '600', color: '#453284' },
  statsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 16,
  },
  statBox: {
    alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24,
    minWidth: 90,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#6A49FA' },
  statLabel: { fontSize: 12, color: '#6E6E73', marginTop: 4, fontWeight: '500' },
  bottom: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6A49FA', borderRadius: 16, height: 56,
    shadowColor: '#6A49FA', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
