import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
  interpolate, Easing, FadeInDown,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

function AIOrb() {
  const rotate = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false);
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
  }, []);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));
  const core = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.95, 1.05]) }],
  }));

  return (
    <View style={st.orbWrap}>
      <Animated.View style={[st.orbRing, spin]}>
        <LinearGradient colors={['#6A49FA', 'transparent', '#00D68F']} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[st.orbCore, core]} />
    </View>
  );
}

export default function AITrainingInsight({
  insight = 'Your recovery is trending above baseline. Shoulder readiness is optimal — consider increasing working weight.',
  confidence = 87,
}: {
  insight?: string; confidence?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(200).springify().damping(16)} style={st.card}>
      <LinearGradient colors={['rgba(106,73,250,0.04)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.cardBg}>
        <View style={st.topRow}>
          <AIOrb />
          <View style={st.content}>
            <View style={st.header}>
              <Text style={st.label}>AI COACH</Text>
              <View style={st.confPill}>
                <Text style={st.confText}>{confidence}% confident</Text>
              </View>
            </View>
            <Text style={st.text}>{insight}</Text>
            <View style={st.actions}>
              <TouchableOpacity style={st.actionBtn} activeOpacity={0.7}>
                <Feather name="refresh-cw" size={11} color="#6A49FA" />
                <Text style={st.actionText}>Adjust Weight</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.actionBtn} activeOpacity={0.7}>
                <Feather name="shuffle" size={11} color="#6A49FA" />
                <Text style={st.actionText}>Swap Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  card: {
    marginHorizontal: 12, marginBottom: 16, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: theme.colors.border.medium,
  },
  cardBg: { padding: 16 },
  topRow: { flexDirection: 'row', gap: 14 },
  orbWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  orbRing: { position: 'absolute', width: 44, height: 44, borderRadius: 22 },
  orbCore: {
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#6A49FA',
    ...{ shadowColor: '#6A49FA', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 6 },
  },
  content: { flex: 1, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 10, fontFamily: theme.font.family.bold, color: '#6A49FA', letterSpacing: 1.5 },
  confPill: {
    backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  confText: { fontSize: 8, fontFamily: theme.font.family.bold, color: theme.colors.success },
  text: { fontSize: 12, fontFamily: theme.font.family.medium, color: theme.colors.text.secondary, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(106,73,250,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(106,73,250,0.1)',
  },
  actionText: { fontSize: 10, fontFamily: theme.font.family.medium, color: '#6A49FA' },
});
