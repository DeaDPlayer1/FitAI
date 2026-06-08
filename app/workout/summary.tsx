import React, { useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, ZoomIn, FadeIn,
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSequence, withRepeat,
  Easing, interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 44) / 2;

const CONFETTI_COLORS = ['#6A49FA', '#00D68F', '#F59E0B', '#EF4444', '#3B82F6', '#FB7185', '#A78BFA', '#34D399'];

// ─── Premium Confetti ──────────────────────────────────────────────────────────

function ConfettiParticle({ idx }: { idx: number }) {
  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withDelay(
      idx * 40,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const angle = (idx * 137.5) % 360;
    const dist = interpolate(anim.value, [0, 0.2, 1], [0, 40, 90 + (idx % 8) * 20]);
    const drift = Math.sin(idx * 1.3) * 30;
    return {
      transform: [
        { translateX: Math.cos(angle * Math.PI / 180) * dist + drift },
        { translateY: Math.sin(angle * Math.PI / 180) * dist - 60 },
        { scale: interpolate(anim.value, [0, 0.3, 1], [0, 1.4, 0.5]) },
        { rotate: `${angle * 5}deg` },
      ],
      opacity: interpolate(anim.value, [0, 0.15, 0.8, 1], [0, 1, 0.6, 0]),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 5 + (idx % 5) * 3,
          height: 5 + (idx % 5) * 3,
          borderRadius: idx % 3 === 0 ? 999 : 2,
          backgroundColor: CONFETTI_COLORS[idx % CONFETTI_COLORS.length],
        },
        style,
      ]}
    />
  );
}

function ConfettiBurst() {
  return (
    <View style={st.confettiContainer} pointerEvents="none">
      {Array.from({ length: 30 }).map((_, i) => (
        <ConfettiParticle key={i} idx={i} />
      ))}
    </View>
  );
}

// ─── Animated Metric Card ──────────────────────────────────────────────────────

function MetricCard({
  value, label, icon, color, gradient, delay,
}: {
  value: string; label: string; icon: string; color: string; gradient?: [string, string]; delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(15)}
      style={[st.metricCard, { borderColor: `${color}18` }]}
    >
      <LinearGradient
        colors={gradient || [`${color}15`, `${color}08`]}
        style={st.metricCardBg}
      />
      <View style={[st.metricIcon, { backgroundColor: `${color}18` }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[st.metricValue, { color }]}>{value}</Text>
      <Text style={st.metricLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Animated Volume Bar ───────────────────────────────────────────────────────

function VolumeBar({
  name, volume, maxVolume, color, delay,
}: {
  name: string; volume: number; maxVolume: number; color: string; delay: number;
}) {
  const w = useSharedValue(0);
  const pct = maxVolume > 0 ? volume / maxVolume : 0;
  useEffect(() => {
    w.value = withDelay(delay, withTiming(pct, { duration: 600, easing: Easing.out(Easing.quad) }));
  }, []);

  const barAnim = useAnimatedStyle(() => ({
    width: interpolate(w.value, [0, 1], [0, (SCREEN_W - 120) * 0.85]),
  }));

  return (
    <View style={st.barRow}>
      <Text style={st.barName} numberOfLines={1}>{name}</Text>
      <View style={st.barTrack}>
        <LinearGradient
          colors={[color, `${color}aa`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[st.barFill, { width: `${pct * 100}%` }]}
        />
      </View>
      <Text style={st.barValue}>
        {volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(volume)}
      </Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    duration: string; totalVolume: string; completedSets: string; totalSets: string;
    exerciseCount: string; workoutName: string; exercises: string;
  }>();

  const duration = params.duration || '00:00';
  const totalVolume = parseInt(params.totalVolume || '0');
  const completedSets = parseInt(params.completedSets || '0');
  const totalSets = parseInt(params.totalSets || '0');
  const exerciseCount = parseInt(params.exerciseCount || '0');
  const workoutName = params.workoutName || 'Workout';

  const exercises = useMemo(() => {
    try { return JSON.parse(params.exercises || '[]') as { name: string; volume: number; completedSets: number; totalSets: number }[]; }
    catch { return []; }
  }, [params.exercises]);

  const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const maxVol = Math.max(...exercises.map(e => e.volume), 1);
  const isPR = totalVolume > 12000 || pct >= 100;
  const chartColors = ['#6A49FA', '#00D68F', '#F59E0B', '#3B82F6', '#FB7185', '#8B5CF6', '#34D399', '#F472B6'];

  const recoveryInsight = useMemo(() => {
    if (!totalVolume) return 'Movement is medicine. Great job getting started.';
    if (totalVolume > 15000) return 'High volume session — your muscles need extra recovery. Prioritize 8h sleep and 1.6g/kg protein today.';
    if (pct >= 100) return 'Flawless execution. Every set completed at full effort — this is how strength is built.';
    if (pct >= 80) return 'Strong session with solid consistency. Focus on progressive overload next time.';
    if (pct >= 50) return 'Good effort today. Your consistency is building a foundation — keep showing up.';
    return 'Every rep counts. Quality over quantity builds long-term results.';
  }, [totalVolume, pct]);

  const handleDone = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)/workout');
  }, [router]);

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Premium Celebration Hero ── */}
        <Animated.View entering={ZoomIn.duration(500).springify().damping(13)} style={st.hero}>
          <ConfettiBurst />
          <LinearGradient
            colors={['rgba(106,73,250,0.3)', 'rgba(0,214,143,0.05)', 'transparent']}
            style={st.heroGlow}
          />
          <View style={st.heroIconWrap}>
            <LinearGradient
              colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.05)']}
              style={st.heroIconInner}
            >
              <MaterialCommunityIcons name="trophy" size={44} color="#F59E0B" />
            </LinearGradient>
          </View>
          <Text style={st.heroTitle}>Workout Complete</Text>
          <Text style={st.heroSubtitle}>{workoutName}</Text>
          <View style={st.heroDuration}>
            <Feather name="clock" size={12} color="rgba(255,255,255,0.4)" />
            <Text style={st.heroDurationText}>{duration}</Text>
          </View>
        </Animated.View>

        {/* ── Performance Metrics Grid ── */}
        <View style={st.metricsGrid}>
          <MetricCard
            value={duration} label="Duration" icon="clock" color="#6A49FA"
            gradient={['rgba(106,73,250,0.12)', 'rgba(106,73,250,0.03)']}
            delay={200}
          />
          <MetricCard
            value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : String(totalVolume)}
            label="Volume" icon="trending-up" color="#00D68F"
            gradient={['rgba(0,214,143,0.12)', 'rgba(0,214,143,0.03)']}
            delay={280}
          />
          <MetricCard
            value={`${pct}%`} label="Complete" icon="check-circle" color="#F59E0B"
            gradient={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.03)']}
            delay={360}
          />
          <MetricCard
            value={String(exerciseCount)} label="Exercises" icon="layers" color="#3B82F6"
            gradient={['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.03)']}
            delay={440}
          />
        </View>

        {/* ── Personal Record Highlight ── */}
        {isPR && (
          <Animated.View entering={ZoomIn.delay(520).springify()} style={st.prCard}>
            <LinearGradient
              colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.03)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={st.prContent}>
              <View style={st.prIconBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={18} color="#F59E0B" />
              </View>
              <View style={st.prTextCol}>
                <Text style={st.prTitle}>Personal Record</Text>
                <Text style={st.prSub}>Best session volume to date</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Volume Breakdown ── */}
        {exercises.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(600).springify().damping(16)}
            style={st.sectionCard}
          >
            <View style={st.sectionHeader}>
              <Feather name="bar-chart-2" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={st.sectionTitle}>Volume Breakdown</Text>
            </View>
            {exercises.map((ex, i) => (
              <VolumeBar
                key={ex.name}
                name={ex.name}
                volume={ex.volume}
                maxVolume={maxVol}
                color={chartColors[i % chartColors.length]}
                delay={700 + i * 80}
              />
            ))}
          </Animated.View>
        )}

        {/* ── AI Recovery Insight ── */}
        <Animated.View
          entering={FadeInDown.delay(850).springify().damping(16)}
          style={st.insightCard}
        >
          <View style={st.insightAccent} />
          <View style={st.insightContent}>
            <View style={st.insightLabelRow}>
              <View style={st.aiPill}>
                <Feather name="cpu" size={11} color="#6A49FA" />
                <Text style={st.aiPillText}>AI COACH</Text>
              </View>
            </View>
            <Text style={st.insightText}>{recoveryInsight}</Text>
            <View style={st.insightFooter}>
              <Feather name="zap" size={12} color="rgba(255,255,255,0.25)" />
              <Text style={st.insightFooterText}>Based on session volume & completion rate</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Actions ── */}
        <Animated.View
          entering={FadeInDown.delay(1000).springify().damping(16)}
          style={st.actions}
        >
          <TouchableOpacity onPress={handleDone} activeOpacity={0.85}>
            <LinearGradient
              colors={['#6A49FA', '#5538D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={st.primaryCta}
            >
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={st.primaryCtaText}>Complete</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={st.secondaryRow}>
            <TouchableOpacity style={st.secondaryPill} onPress={handleDone} activeOpacity={0.7}>
              <Feather name="bar-chart-2" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={st.secondaryPillText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.secondaryPill} onPress={handleDone} activeOpacity={0.7}>
              <Feather name="share-2" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={st.secondaryPillText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.secondaryPill} onPress={handleDone} activeOpacity={0.7}>
              <Feather name="edit-3" size={14} color="rgba(255,255,255,0.55)" />
              <Text style={st.secondaryPillText}>Notes</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const BORDER = 'rgba(255,255,255,0.06)';
const CARD_BG = '#1A1A1F';

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111114' },

  confettiContainer: {
    position: 'absolute', width: '100%', height: 280,
    alignItems: 'center', justifyContent: 'center', top: 10,
  },

  hero: {
    alignItems: 'center', paddingTop: 32, paddingBottom: 28,
    overflow: 'hidden', marginBottom: 8,
  },
  heroGlow: { position: 'absolute', width: SCREEN_W, height: 280, top: -30 },
  heroIconWrap: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: 'rgba(245,158,11,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.12)',
  },
  heroIconInner: {
    width: 76, height: 76, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 34, fontWeight: '900', color: '#FFFFFF',
    textAlign: 'center', letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
  },
  heroDuration: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 14, backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  heroDurationText: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)',
    fontVariant: ['tabular-nums'],
  },

  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 12, marginBottom: 16,
  },
  metricCard: {
    width: CARD_W, borderRadius: 22, padding: 18,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden', gap: 8,
  },
  metricCardBg: { ...StyleSheet.absoluteFillObject },
  metricIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  metricValue: {
    fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  prCard: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 22, padding: 18, borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    overflow: 'hidden',
  },
  prContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  prIconBadge: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  prTextCol: { flex: 1 },
  prTitle: {
    fontSize: 16, fontWeight: '800', color: '#F59E0B',
  },
  prSub: {
    fontSize: 12, fontWeight: '500', color: 'rgba(245,158,11,0.6)',
    marginTop: 2,
  },

  sectionCard: {
    backgroundColor: CARD_BG, borderRadius: 24, padding: 20,
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  barRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  barName: {
    width: 78, fontSize: 12, fontWeight: '600',
    color: 'rgba(255,255,255,0.6)', marginRight: 8,
  },
  barTrack: {
    flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 4, overflow: 'hidden', marginRight: 8,
  },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: {
    width: 40, fontSize: 12, fontWeight: '700',
    color: 'rgba(255,255,255,0.6)', textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  insightCard: {
    flexDirection: 'row',
    marginHorizontal: 16, marginBottom: 24,
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(106,73,250,0.15)',
    backgroundColor: CARD_BG,
  },
  insightAccent: {
    width: 3, backgroundColor: '#6A49FA',
  },
  insightContent: { flex: 1, padding: 18, gap: 10 },
  insightLabelRow: { flexDirection: 'row' },
  aiPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(106,73,250,0.12)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  aiPillText: {
    fontSize: 10, fontWeight: '800', color: '#6A49FA',
    letterSpacing: 0.8,
  },
  insightText: {
    fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.75)',
    lineHeight: 21,
  },
  insightFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4,
  },
  insightFooterText: {
    fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.25)',
  },

  actions: {
    paddingHorizontal: 16, gap: 14,
  },
  primaryCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 18, borderRadius: 22,
    ...theme.shadow.glow,
  },
  primaryCtaText: {
    fontSize: 17, fontWeight: '800', color: '#FFFFFF',
  },
  secondaryRow: {
    flexDirection: 'row', gap: 10, justifyContent: 'center',
  },
  secondaryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: CARD_BG, paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 18, borderWidth: 1, borderColor: BORDER,
  },
  secondaryPillText: {
    fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)',
  },
});
