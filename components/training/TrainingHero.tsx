import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
  interpolate, Easing, FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '@/constants/theme';
import ProgressRing from './ProgressRing';

const { width: SCREEN_W } = Dimensions.get('window');

function Particle({ index }: { index: number }) {
  const x = useSharedValue(Math.random() * SCREEN_W);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4 + Math.random() * 0.3, { duration: 500 + Math.random() * 1000 }),
        withTiming(0, { duration: 500 + Math.random() * 1000 }),
      ), -1, true
    );
    y.value = withRepeat(
      withTiming(-20 - Math.random() * 30, { duration: 3000 + Math.random() * 2000, easing: Easing.linear }),
      -1, true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute', width: 2, height: 2, borderRadius: 1,
          backgroundColor: '#FFFFFF', left: 30 + (index * 37) % (SCREEN_W - 80),
        },
        animStyle,
      ]}
    />
  );
}

function GlowOrb({ index }: { index: number }) {
  const x = useSharedValue(0);
  const s = useSharedValue(1);

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(30 + index * 15, { duration: 5000 + index * 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-20 - index * 8, { duration: 5000 + index * 1000, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
    s.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 3000 + index * 500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.9, { duration: 3000 + index * 500, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scale: s.value }],
  }));

  const colors = ['#6A49FA', '#453284', '#8B5CF6'];
  const sizes = [200, 140, 100];
  return (
    <Animated.View
      style={[
        {
          position: 'absolute', width: sizes[index], height: sizes[index], borderRadius: sizes[index] / 2,
          backgroundColor: colors[index], opacity: 0.08,
          top: -30 - index * 10, left: index % 2 === 0 ? -40 : SCREEN_W - sizes[index] + 40,
        },
        style,
      ]}
    />
  );
}

export default function TrainingHero({
  todayName, phaseLabel, templates, onAddPress, onStartToday, todayTemplate,
}: {
  todayName: string; phaseLabel?: string; templates: any[]; onAddPress: () => void;
  onStartToday: () => void; todayTemplate?: any;
}) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.15, 0.25]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.04]) }],
  }));

  const streak = 3;
  const completed = templates.filter(t => {
    try { const n = t.notes ? JSON.parse(t.notes) : {}; return n.completed; } catch { return false; }
  }).length;
  const weeklyPct = templates.length > 0 ? completed / templates.length : 0;

  return (
    <View style={st.heroWrap}>
      <LinearGradient
        colors={['#2D1B69', '#453284', '#6A49FA', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1.2, y: 1.5 }}
        style={st.heroBg}
      >
        <GlowOrb index={0} />
        <GlowOrb index={1} />
        <GlowOrb index={2} />
        {Array.from({ length: 8 }).map((_, i) => <Particle key={i} index={i} />)}
        <Animated.View style={[st.heroPulse, pulseStyle]} />

        <View style={st.heroContent}>
          <View style={st.topRow}>
            <View style={st.topLeft}>
              <Text style={st.greeting}>My Training</Text>
              <Text style={st.dayPhase}>{todayName} · {phaseLabel || 'Ready'}</Text>
            </View>
            <TouchableOpacity style={st.addBtn} onPress={onAddPress} activeOpacity={0.8}>
              <BlurView intensity={30} tint="light" style={st.addBtnBlur}>
                <Feather name="plus" size={20} color="#FFFFFF" />
              </BlurView>
            </TouchableOpacity>
          </View>

          <View style={st.focusArea}>
            <View style={st.focusLeft}>
              {todayTemplate ? (
                <>
                  <Text style={st.focusLabel}>TODAY'S FOCUS</Text>
                  <Text style={st.focusName} numberOfLines={1}>{todayTemplate.name || 'Workout'}</Text>
                  <View style={st.focusMeta}>
                    <View style={st.metaPill}>
                      <Feather name="clock" size={10} color="rgba(255,255,255,0.6)" />
                      <Text style={st.metaPillText}>~45 min</Text>
                    </View>
                    <View style={st.metaPill}>
                      <MaterialCommunityIcons name="dumbbell" size={10} color="rgba(255,255,255,0.6)" />
                      <Text style={st.metaPillText}>4 exercises</Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={st.focusName}>Rest Day</Text>
              )}
            </View>
            <TouchableOpacity style={st.heroCta} onPress={onStartToday} activeOpacity={0.85}>
              <LinearGradient colors={['#00D68F', '#00B37A']} style={st.heroCtaGrad}>
                <Feather name="play" size={22} color="#0D0D0F" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={st.statsRow}>
            <View style={st.statPill}>
              <ProgressRing size={36} strokeWidth={3} progress={weeklyPct} color="#FFFFFF" bgColor="rgba(255,255,255,0.15)">
                <Text style={st.statValue}>{Math.round(weeklyPct * 100)}</Text>
              </ProgressRing>
              <Text style={st.statLabel}>Week</Text>
            </View>
            <View style={st.statDiv} />
            <View style={st.statPill}>
              <Feather name="zap" size={16} color="#F59E0B" />
              <Text style={[st.statValue, { color: '#F59E0B', fontSize: 18 }]}>{streak}</Text>
              <Text style={st.statLabel}>Streak</Text>
            </View>
            <View style={st.statDiv} />
            <View style={st.statPill}>
              <ProgressRing size={36} strokeWidth={3} progress={0.82} color={theme.colors.success} bgColor="rgba(34,197,94,0.15)">
                <Text style={[st.statValue, { color: theme.colors.success, fontSize: 10 }]}>82</Text>
              </ProgressRing>
              <Text style={st.statLabel}>Ready</Text>
            </View>
            <View style={st.statDiv} />
            <View style={st.statPill}>
              <Feather name="trending-up" size={14} color={theme.colors.success} />
              <Text style={[st.statValue, { color: theme.colors.success, fontSize: 10 }]}>+8%</Text>
              <Text style={st.statLabel}>Recov</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  heroWrap: { marginBottom: 16 },
  heroBg: {
    borderRadius: 28, overflow: 'hidden', minHeight: 210,
    marginHorizontal: 12, marginTop: 4,
  },
  heroPulse: {
    position: 'absolute', width: '100%', height: '100%',
    borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroContent: { padding: 16, gap: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topLeft: { gap: 2 },
  greeting: { fontSize: 22, fontFamily: theme.font.family.heading, color: '#FFFFFF', letterSpacing: -0.5 },
  dayPhase: { fontSize: 12, fontFamily: theme.font.family.medium, color: 'rgba(255,255,255,0.6)' },
  addBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  addBtnBlur: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  focusArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  focusLeft: { flex: 1, gap: 4 },
  focusLabel: { fontSize: 9, fontFamily: theme.font.family.bold, color: theme.colors.success, letterSpacing: 1.5 },
  focusName: { fontSize: 20, fontFamily: theme.font.family.heading, color: '#FFFFFF' },
  focusMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  metaPillText: { fontSize: 10, fontFamily: theme.font.family.medium, color: 'rgba(255,255,255,0.6)' },
  heroCta: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', ...theme.shadow.glowGreen },
  heroCtaGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 10, gap: 0,
  },
  statPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  statDiv: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  statValue: { fontSize: 12, fontFamily: theme.font.family.bold, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 8, fontFamily: theme.font.family.medium, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
});
