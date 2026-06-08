import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

const GOALS = [
  { id: 'lose_fat', icon: '🔥', label: 'Lose Fat', desc: 'Calorie deficit with protein focus' },
  { id: 'build_muscle', icon: '💪', label: 'Build Muscle', desc: 'Moderate surplus with progressive overload' },
  { id: 'recomposition', icon: '⚖️', label: 'Recomp', desc: 'Maintenance calories with high protein' },
  { id: 'maintain', icon: '🧘', label: 'Maintain', desc: 'Keep current physique, general health' },
];

export default function PlanReset() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const handleArchiveReset = async () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setArchiving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('active_plans')
        .update({ status: 'archived', archived_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/plan/reveal');
    } catch (e) {
      console.error('Archive error:', e);
      Alert.alert('Error', 'Could not archive plan. Try again.');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <LinearGradient colors={['#0F0A1A', '#1B1236']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="x" size={22} color="#C4B5FD" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Change Goal</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={styles.subtitle}>What's your new focus?</Text>

        <View style={{ padding: 16, gap: 12 }}>
          {GOALS.map((g, i) => (
            <Animated.View key={g.id} entering={FadeInDown.duration(400).delay(i * 80).springify()}>
              <TouchableOpacity
                style={[styles.goalCard, selected === g.id && styles.goalCardSelected]}
                onPress={() => setSelected(g.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.goalIcon}>{g.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalLabel}>{g.label}</Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </View>
                <View style={[styles.radio, selected === g.id && styles.radioSelected]}>
                  {selected === g.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeIn.duration(400).delay(400)} style={{ padding: 16, marginTop: 'auto' }}>
          <TouchableOpacity
            style={[styles.cta, !selected && styles.ctaDisabled]}
            onPress={handleArchiveReset}
            disabled={!selected || archiving}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>
              {archiving ? 'Resetting Plan...' : 'Archive Current & Start New'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.fineprint}>Your current plan will be archived and a new one generated</Text>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#F5F5F5' },
  subtitle: { fontSize: 24, fontWeight: '700', color: '#F5F5F5', paddingHorizontal: 16, paddingTop: 8 },
  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  goalCardSelected: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)' },
  goalIcon: { fontSize: 28 },
  goalLabel: { fontSize: 16, fontWeight: '700', color: '#F5F5F5' },
  goalDesc: { fontSize: 12, color: '#C4B5FD', marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: '#8B5CF6' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#8B5CF6' },
  cta: { height: 56, borderRadius: 16, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  fineprint: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginTop: 8 },
});
