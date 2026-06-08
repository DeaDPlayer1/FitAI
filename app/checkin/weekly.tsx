import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

function StatCard({ icon, label, children, delay = 0 }: { icon: string; label: string; children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(delay).springify()} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderIcon}>{icon}</Text>
        <Text style={styles.cardHeaderLabel}>{label}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

export default function WeeklyCheckin() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={{ flex: 1 }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Feather name="x" size={22} color="#C4B5FD" /></Pressable>
          <Text style={styles.headerTitle}>WEEK 3 CHECK-IN</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.entryBanner}>
            <Text style={styles.entryLabel}>WEEK 3 CHECK-IN</Text>
            <Text style={styles.entrySub}>Your AI coach has analyzed your week</Text>
            <View style={styles.entryChart}>
              {[0.6, 0.8, 0.5, 0.9, 0.7, 0.4, 0.3].map((h, i) => (
                <View key={i} style={[styles.chartBar, { height: `${h * 80}%`, backgroundColor: h >= 0.5 ? '#8B5CF6' : 'rgba(139,92,246,0.2)' }]} />
              ))}
            </View>
          </Animated.View>

          <StatCard icon="🏋️" label="TRAINING" delay={120}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Text style={styles.sessionsNum}>4 / 5</Text>
              <Text style={styles.sessionsLabel}>Sessions</Text>
            </View>
            <View style={[styles.perfBadge, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}>
              <Text style={[styles.perfText, { color: '#10B981' }]}>PERFORMANCE: STRONG</Text>
            </View>
            <View style={styles.insight}>
              <Text style={styles.insightText}>Your strength is holding well in the deficit — great adaptation sign.</Text>
            </View>
          </StatCard>

          <StatCard icon="🥗" label="NUTRITION" delay={240}>
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <View>
                <Text style={styles.nutritionNum}>1,850</Text>
                <Text style={styles.nutritionLabel}>Avg kcal</Text>
              </View>
              <View>
                <Text style={styles.nutritionNum}>145</Text>
                <Text style={styles.nutritionLabel}>Avg protein</Text>
              </View>
            </View>
            <View style={styles.adherenceBar}>
              <View style={styles.adherenceFill} />
            </View>
            <Text style={styles.adherenceText}>82% consistency</Text>
            <View style={styles.insight}>
              <Text style={styles.insightText}>Protein intake is solid. Try front-loading carbs around your workout window for better energy.</Text>
            </View>
          </StatCard>

          <StatCard icon="⚖️" label="BODY" delay={360}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.weightChange}>-0.8kg</Text>
              <Text style={styles.weightLabel}>This week</Text>
            </View>
            <View style={styles.sparkline}>
              {[0.6, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3].map((v, i) => (
                <View key={i} style={[styles.sparkDot, { backgroundColor: '#8B5CF6', opacity: 1 - i * 0.1 }]} />
              ))}
            </View>
            <Text style={styles.expectedText}>Expected: ~0.7kg change</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✅ On Track</Text>
            </View>
          </StatCard>

          <StatCard icon="😴" label="RECOVERY" delay={480}>
            <View style={{ flexDirection: 'row', gap: 24 }}>
              <View>
                <Text style={styles.recoveryValue}>7.2 hrs</Text>
                <Text style={styles.recoveryLabel}>Avg sleep</Text>
              </View>
              <View>
                <View style={[styles.stressBadge, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }]}>
                  <Text style={[styles.stressText, { color: '#F59E0B' }]}>Moderate</Text>
                </View>
                <Text style={styles.recoveryLabel}>Stress</Text>
              </View>
            </View>
          </StatCard>

          <Animated.View entering={FadeInDown.duration(400).delay(600).springify()} style={styles.strategyCard}>
            <View style={styles.cardHeader}>
              <Feather name="target" size={16} color="#8B5CF6" />
              <Text style={[styles.cardHeaderLabel, { color: '#8B5CF6' }]}>NEXT WEEK STRATEGY</Text>
            </View>
            <View style={styles.calRow}>
              <Text style={styles.calOld}>1,850</Text>
              <Feather name="arrow-right" size={18} color="#8B5CF6" />
              <Text style={styles.calNew}>1,650</Text>
              <View style={styles.calChangeBadge}><Text style={styles.calChangeText}>-200 kcal</Text></View>
            </View>
            {[
              'Push progressive overload on chest press',
              'Add 1 set to shoulders — you\'ve been breezing through',
              'Keep protein high to protect muscle in the deficit',
            ].map((f, i) => (
              <View key={i} style={styles.trainingPoint}>
                <Feather name="arrow-right" size={14} color="#8B5CF6" />
                <Text style={styles.trainingPointText}>{f}</Text>
              </View>
            ))}
            <Text style={styles.motivation}>Progress isn't linear, but you're building momentum. Keep showing up.</Text>
            <Pressable style={styles.ctaBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); router.replace('/(tabs)'); }}>
              <Text style={styles.ctaBtnText}>Start Week 4</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#F5F5F5' },
  entryBanner: { alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  entryLabel: { fontSize: 14, color: '#8B5CF6', letterSpacing: 3, textTransform: 'uppercase' },
  entrySub: { fontSize: 15, color: '#C4B5FD', marginTop: 6 },
  entryChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80, marginTop: 16 },
  chartBar: { flex: 1, borderRadius: 4 },
  card: { padding: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderIcon: { fontSize: 16 },
  cardHeaderLabel: { fontSize: 11, color: '#C4B5FD', letterSpacing: 1.5, textTransform: 'uppercase' },
  sessionsNum: { fontSize: 42, fontWeight: '800', color: '#F5F5F5' },
  sessionsLabel: { fontSize: 11, color: '#C4B5FD', marginTop: 4 },
  perfBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, marginTop: 8, alignSelf: 'flex-start' },
  perfText: { fontSize: 11, fontWeight: '600' },
  insight: { marginTop: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.05)', borderRadius: 8 },
  insightText: { fontSize: 13, color: '#C4B5FD', lineHeight: 18 },
  nutritionNum: { fontSize: 32, fontWeight: '800', color: '#F5F5F5' },
  nutritionLabel: { fontSize: 11, color: '#C4B5FD', marginTop: 2 },
  adherenceBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 12, overflow: 'hidden' },
  adherenceFill: { width: '82%', height: '100%', backgroundColor: '#8B5CF6', borderRadius: 3 },
  adherenceText: { fontSize: 12, color: '#C4B5FD', marginTop: 4 },
  weightChange: { fontSize: 52, fontWeight: '800', color: '#10B981' },
  weightLabel: { fontSize: 12, color: '#C4B5FD' },
  sparkline: { flexDirection: 'row', gap: 8, marginTop: 12 },
  sparkDot: { width: 10, height: 10, borderRadius: 5 },
  expectedText: { fontSize: 13, color: '#C4B5FD', marginTop: 8 },
  statusBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.1)', alignSelf: 'center' },
  statusText: { fontSize: 13, color: '#10B981' },
  recoveryValue: { fontSize: 24, fontWeight: '800', color: '#F5F5F5' },
  recoveryLabel: { fontSize: 11, color: '#C4B5FD', marginTop: 2 },
  stressBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  stressText: { fontSize: 12, fontWeight: '600' },
  strategyCard: { padding: 20, backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)' },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  calOld: { fontSize: 18, color: theme.colors.text.muted, textDecorationLine: 'line-through' },
  calNew: { fontSize: 22, fontWeight: '800', color: '#F5F5F5' },
  calChangeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(139,92,246,0.2)' },
  calChangeText: { fontSize: 11, color: '#8B5CF6', fontWeight: '600' },
  trainingPoint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  trainingPointText: { fontSize: 14, color: '#F5F5F5', flex: 1 },
  motivation: { fontSize: 13, fontStyle: 'italic', color: '#C4B5FD', marginTop: 12 },
  ctaBtn: { marginTop: 16, height: 56, borderRadius: 16, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
