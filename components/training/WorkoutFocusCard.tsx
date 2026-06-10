import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
  interpolate, Easing, FadeInDown, ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import BodyMuscleMap from './BodyMuscleMap';
import ProgressRing from './ProgressRing';

const { width: SCREEN_W } = Dimensions.get('window');

interface WorkoutFocusCardProps {
  workoutName: string;
  muscleGroups?: string[];
  exerciseCount: number;
  exercises?: { name: string }[];
  estimatedDuration?: string;
  intensity?: 'low' | 'medium' | 'high';
  recoveryScore?: number;
  onStart: () => void;
  onViewSplit?: () => void;
}

const intCfg = {
  low: { label: 'Light', color: theme.colors.success },
  medium: { label: 'Moderate', color: theme.colors.warning },
  high: { label: 'High', color: theme.colors.danger },
};

export default function WorkoutFocusCard({
  workoutName, muscleGroups = [], exerciseCount, exercises = [],
  estimatedDuration = '~45 min', intensity = 'medium', recoveryScore = 82,
  onStart, onViewSplit,
}: WorkoutFocusCardProps) {
  const breathe = useSharedValue(0);
  const btnGlow = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
    btnGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
  }, []);

  const cardFloat = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(breathe.value, [0, 1], [0, -4]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(btnGlow.value, [0, 1], [0.2, 0.5]),
    transform: [{ scale: interpolate(btnGlow.value, [0, 1], [1, 1.06]) }],
  }));

  const cfg = intCfg[intensity];
  const showExercises = exercises.length > 0;

  const bodyMuscles = (muscleGroups.length > 0 ? muscleGroups : ['chest', 'shoulders', 'triceps']).map((m, i) => {
    const intensityVal = i === 0 ? 0.8 : 0.5;
    return {
      key: m.toLowerCase(),
      label: m,
      d: '',
      intensity: intensityVal,
      color: '#6A49FA',
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(100).springify().damping(16)}>
      <Animated.View style={[st.card, cardFloat]}>
      <LinearGradient colors={['rgba(106,73,250,0.03)', theme.colors.bg.secondary]} style={st.cardBg}>
        <View style={st.glowEdge} />

        <View style={st.topRow}>
          <View style={st.badge}>
            <Feather name="target" size={10} color="#6A49FA" />
            <Text style={st.badgeText}>TODAY</Text>
          </View>
          <View style={[st.intBadge, { backgroundColor: `${cfg.color}15` }]}>
            <View style={[st.intDot, { backgroundColor: cfg.color }]} />
            <Text style={[st.intText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <View style={st.recovBadge}>
            <ProgressRing size={24} strokeWidth={2} progress={(recoveryScore || 82) / 100} color={theme.colors.success} bgColor="rgba(34,197,94,0.15)">
              <Text style={st.recovText}>{recoveryScore || 82}</Text>
            </ProgressRing>
          </View>
        </View>

        <View style={st.mainRow}>
          <View style={st.bodyCol}>
            <BodyMuscleMap size={130} muscles={bodyMuscles} animated />
          </View>

          <View style={st.infoCol}>
            <Text style={st.workoutName} numberOfLines={2}>{workoutName}</Text>
            <View style={st.metaList}>
              <View style={st.metaRow}>
            <Feather name="layers" size={12} color={theme.colors.text.muted} />
            <Text style={st.metaValue}>{exerciseCount}</Text>
            <Text style={st.metaLabel}>exercises</Text>
              </View>
              <View style={st.metaRow}>
                <Feather name="clock" size={12} color={theme.colors.text.muted} />
                <Text style={st.metaValue}>{estimatedDuration}</Text>
                <Text style={st.metaLabel}>est</Text>
              </View>
              <View style={st.metaRow}>
                <Feather name="zap" size={12} color={theme.colors.text.muted} />
                <Text style={st.metaValue}>{exerciseCount * 10}</Text>
                <Text style={st.metaLabel}>sets</Text>
              </View>
            </View>
            {muscleGroups.length > 0 && (
              <Text style={st.muscleText}>{muscleGroups.slice(0, 3).map(g => g.replace(/\b\w/g, c => c.toUpperCase())).join(' · ')}</Text>
            )}
          </View>
        </View>

        {showExercises && (
          <View style={st.exPreview}>
            {exercises.slice(0, 3).map((ex, i) => (
              <Animated.View key={ex.name} entering={ZoomIn.delay(300 + i * 80).springify()} style={st.exChip}>
                <Text style={st.exChipText}>{ex.name}</Text>
              </Animated.View>
            ))}
          </View>
        )}

        <View style={st.ctaRow}>
          <TouchableOpacity style={st.startBtn} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onStart(); }} activeOpacity={0.85}>
            <LinearGradient colors={['#6A49FA', '#453284']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.startGrad}>
              <Animated.View style={[st.startGlow, glowStyle]} />
              <Feather name="play" size={18} color="#FFFFFF" />
              <Text style={st.startText}>START WORKOUT</Text>
            </LinearGradient>
          </TouchableOpacity>
          {onViewSplit && (
            <TouchableOpacity style={st.secBtn} onPress={onViewSplit} activeOpacity={0.7}>
              <Feather name="calendar" size={16} color={theme.colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  card: {
    marginHorizontal: 12, marginBottom: 16, borderRadius: 24, overflow: 'hidden',
    ...theme.shadow.float,
  },
  cardBg: { padding: 16, position: 'relative', overflow: 'hidden' },
  glowEdge: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(106,73,250,0.2)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(106,73,250,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  badgeText: { fontSize: 9, fontFamily: theme.font.family.bold, color: '#6A49FA', letterSpacing: 1 },
  intBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  intDot: { width: 4, height: 4, borderRadius: 2 },
  intText: { fontSize: 8, fontFamily: theme.font.family.bold },
  recovBadge: { marginLeft: 'auto' },
  recovText: { fontSize: 8, fontFamily: theme.font.family.bold, color: theme.colors.success },
  mainRow: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  bodyCol: { alignItems: 'center', justifyContent: 'center' },
  infoCol: { flex: 1, justifyContent: 'center', gap: 10 },
  workoutName: { fontSize: 20, fontFamily: theme.font.family.heading, color: theme.colors.text.primary, letterSpacing: -0.3 },
  metaList: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaValue: { fontSize: 13, fontFamily: theme.font.family.bold, color: theme.colors.text.primary, fontVariant: ['tabular-nums'] },
  metaLabel: { fontSize: 10, fontFamily: theme.font.family.medium, color: theme.colors.text.muted },
  muscleText: { fontSize: 10, fontFamily: theme.font.family.medium, color: theme.colors.text.secondary, letterSpacing: 0.3 },
  exPreview: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  exChip: {
    backgroundColor: theme.colors.bg.tertiary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: theme.colors.border.subtle,
  },
  exChipText: { fontSize: 10, fontFamily: theme.font.family.medium, color: theme.colors.text.muted },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  startBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  startGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16, position: 'relative', overflow: 'hidden',
  },
  startGlow: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16,
  },
  startText: { fontSize: 13, fontFamily: theme.font.family.bold, color: '#FFFFFF', letterSpacing: 0.5 },
  secBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: theme.colors.bg.tertiary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border.subtle,
  },
});
