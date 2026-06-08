import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';

const { width } = Dimensions.get('window');

function CountUp({ target, suffix, style }: { target: number; suffix?: string; style?: any }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const duration = 800;
    const step = Math.max(1, Math.floor(target / 30));
    let current = 0;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(interval); }
      else setVal(current);
    }, duration / 30);
    return () => clearInterval(interval);
  }, [target]);
  return <Text style={style}>{val}{suffix}</Text>;
}

function MacroBadge({ value, unit, color }: { value: number; unit: string; color: string }) {
  const fillWidth = useSharedValue(0);
  useEffect(() => { fillWidth.value = withSpring(1, { damping: 18 }); }, []);
  const barStyle = useAnimatedStyle(() => ({ width: `${fillWidth.value * 100}%` }));
  return (
    <View style={styles.macroCol}>
      <CountUp target={value} suffix="" style={styles.macroNum} />
      <Text style={styles.macroUnit}>{unit}</Text>
      <View style={styles.macroBarBg}>
        <Animated.View style={[styles.macroBarFill, { backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
}

function TrainingDayCard({ day, focus, muscles, time, expanded: _expanded }: { day: string; focus: string; muscles: string; time: string; expanded?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => setOpen(!open)} style={styles.dayCard}>
      <View style={styles.dayRow}>
        <View style={styles.dayPill}><Text style={styles.dayPillText}>{day}</Text></View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.dayFocus}>{focus}</Text>
          <Text style={styles.dayMuscles}>{muscles}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.dayTime}>{time}</Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.text.muted} />
        </View>
      </View>
      {open && (
        <View style={styles.dayExpanded}>
          {['Chest', 'Shoulders', 'Triceps'].map((g) => (
            <View key={g}>
              <Text style={styles.muscleHeader}>{g}</Text>
              {[{ name: `${g === 'Chest' ? 'Machine Chest Press' : g === 'Shoulders' ? 'DB Shoulder Press' : 'Tricep Pushdown'}`, sets: '2 × 8-10', rir: '2 RIR' }].map((ex, i) => (
                <View key={i} style={styles.exRow}>
                  <View style={styles.exDot} />
                  <Text style={styles.exName}>{ex.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Text style={styles.exSets}>{ex.sets}</Text>
                    <View style={styles.rirPill}><Text style={styles.rirText}>{ex.rir}</Text></View>
                  </View>
                </View>
              ))}
            </View>
          ))}
          <View style={styles.dayFooter}>
            <View style={[styles.recoveryBadge, { borderColor: '#FFB800' }]}>
              <Text style={[styles.recoveryText, { color: '#FFB800' }]}>Recovery: Moderate</Text>
            </View>
            <Text style={styles.sessionTime}>~{time}</Text>
          </View>
          <View style={styles.focusNote}>
            <Text style={styles.focusNoteText}>Focus on chest stretch at the bottom of each rep today.</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function PlanReveal() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const goal = user?.health_profile?.goal || 'improvement';
  const name = user?.name || 'Athlete';
  const [activating, setActivating] = useState(false);

  const shimmerOpacity = useSharedValue(0);
  useEffect(() => {
    setTimeout(() => {
      shimmerOpacity.value = withTiming(1, { duration: 1000 });
    }, 800);
    setTimeout(() => {
      shimmerOpacity.value = withTiming(0, { duration: 1500 });
    }, 1800);
  }, []);

  return (
    <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.hero}>
            <Text style={styles.heroLabel}>YOUR PERSONALIZED PLAN</Text>
            <Text style={styles.heroTitle}>{name}'s {goal === 'fat_loss' ? 'Fat Loss' : goal === 'muscle_gain' ? 'Muscle Gain' : 'Body Recomposition'} Protocol</Text>
            <Text style={styles.heroSub}>4-Day Upper / Lower Split</Text>
            <View style={styles.weekPill}><Text style={styles.weekPillText}>Week 1 of 12</Text></View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(120).springify()} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderLabel}>DAILY NUTRITION</Text>
              <View style={styles.calBadge}><Text style={styles.calBadgeText}>2,100 kcal</Text></View>
            </View>
            <View style={styles.macroRow}>
              <MacroBadge value={165} unit="g Protein" color="#8B5CF6" />
              <MacroBadge value={210} unit="g Carbs" color="#C4B5FD" />
              <MacroBadge value={55} unit="g Fats" color="#FBCFE8" />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(240).springify()} style={styles.card}>
            <Text style={styles.cardHeaderLabel}>WEEKLY STRUCTURE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => (
                <View key={d} style={[styles.dayPillWeek, i < 4 && styles.dayActive]}>
                  <Text style={[styles.dayPillWeekDay, i < 4 && { color: '#8B5CF6' }]}>{d}</Text>
                  <Text style={[styles.dayPillWeekFocus, i < 4 ? { color: '#8B5CF6' } : { color: theme.colors.text.muted }]}>
                    {i < 4 ? ['Upper', 'Lower', 'Upper', 'Lower'][i] : '—'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(360).springify()}>
            {['Push Day', 'Pull Day', 'Leg Day', 'Upper Day'].map((d, i) => (
              <TrainingDayCard
                key={i}
                day={['MON', 'TUE', 'WED', 'THU'][i]}
                focus={d}
                muscles={['Chest · Shoulders · Triceps', 'Back · Biceps', 'Quads · Hamstrings · Glutes', 'Chest · Back · Arms'][i]}
                time={['55 min', '50 min', '60 min', '55 min'][i]}
              />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(480).springify()} style={styles.card}>
            <Text style={styles.cardHeaderLabel}>CARDIO PLAN</Text>
            <View style={styles.cardioRow}>
              <Feather name="activity" size={20} color="#8B5CF6" />
              <Text style={styles.cardioText}>Morning treadmill walk — 20 min</Text>
              <View style={styles.durationPill}><Text style={styles.durationText}>20 min</Text></View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(600).springify()} style={styles.coachCard}>
            <View style={styles.coachHeader}>
              <View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>AI</Text></View>
              <Text style={styles.coachLabel}>COACH'S NOTE</Text>
            </View>
            <Text style={styles.coachBody}>
              Since you're newer to training, I've kept volume on the lower side — 1–2 working sets per exercise rather than the full 3-4. This protects your joints and tendons while your connective tissue catches up to your muscle memory. The calorie target is a moderate deficit so you lose fat without tanking your energy or performance.
            </Text>
          </Animated.View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setActivating(true);
              setTimeout(() => router.replace('/(tabs)'), 1500);
            }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{activating ? 'Activating...' : 'I want to use this plan'}</Text>
            {!activating && <Feather name="arrow-right" size={20} color="#0A0A0A" />}
          </TouchableOpacity>
          <Text style={styles.ctaSub}>You can update this plan anytime from your profile</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(139,92,246,0.15)' },
  heroLabel: { fontSize: 10, color: '#8B5CF6', letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#F5F5F5', marginTop: 6, lineHeight: 42 },
  heroSub: { fontSize: 15, color: '#C4B5FD', marginTop: 4 },
  weekPill: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)' },
  weekPillText: { fontSize: 11, color: '#C4B5FD' },
  card: { margin: 12, marginBottom: 0, padding: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLabel: { fontSize: 11, color: '#C4B5FD', letterSpacing: 1.5, textTransform: 'uppercase' },
  calBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#8B5CF6' },
  calBadgeText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  macroRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  macroCol: { flex: 1, alignItems: 'center' },
  macroNum: { fontSize: 32, fontWeight: '800', color: '#F5F5F5' },
  macroUnit: { fontSize: 11, color: '#C4B5FD', marginTop: 2 },
  macroBarBg: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 8, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 2 },
  dayPillWeek: { width: 44, height: 64, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  dayActive: { borderColor: 'rgba(139,92,246,0.3)' },
  dayPillWeekDay: { fontSize: 9, color: theme.colors.text.muted },
  dayPillWeekFocus: { fontSize: 10, marginTop: 4 },
  dayCard: { margin: 12, marginBottom: 0, padding: 18, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  dayPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(139,92,246,0.15)' },
  dayPillText: { fontSize: 12, color: '#8B5CF6', fontWeight: '600' },
  dayFocus: { fontSize: 16, fontWeight: '600', color: '#F5F5F5' },
  dayMuscles: { fontSize: 12, color: '#C4B5FD', marginTop: 2 },
  dayTime: { fontSize: 12, color: '#C4B5FD' },
  dayExpanded: { marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 12 },
  muscleHeader: { fontSize: 10, color: '#C4B5FD', letterSpacing: 2, marginBottom: 8, marginTop: 8 },
  exRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  exDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6', marginRight: 10 },
  exName: { flex: 1, fontSize: 14, color: '#F5F5F5' },
  exSets: { fontSize: 13, color: '#C4B5FD' },
  rirPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  rirText: { fontSize: 10, color: '#C4B5FD' },
  dayFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  recoveryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  recoveryText: { fontSize: 11 },
  sessionTime: { fontSize: 12, color: '#C4B5FD' },
  focusNote: { marginTop: 10, padding: 12, backgroundColor: 'rgba(139,92,246,0.06)', borderLeftWidth: 3, borderLeftColor: '#8B5CF6', borderRadius: 8 },
  focusNoteText: { fontSize: 13, fontStyle: 'italic', color: '#C4B5FD' },
  cardioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  cardioText: { flex: 1, fontSize: 14, color: '#F5F5F5' },
  durationPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)' },
  durationText: { fontSize: 12, color: '#C4B5FD' },
  coachCard: { margin: 12, marginBottom: 0, padding: 20, backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  coachHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  aiAvatarText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  coachLabel: { fontSize: 10, color: '#8B5CF6', letterSpacing: 2 },
  coachBody: { fontSize: 14, color: '#F5F5F5', lineHeight: 22, marginTop: 12 },
  cta: { margin: 16, marginBottom: 8, height: 60, borderRadius: 16, backgroundColor: '#8B5CF6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  ctaSub: { fontSize: 12, color: '#C4B5FD', textAlign: 'center', marginBottom: 32 },
});
