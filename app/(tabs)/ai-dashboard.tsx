import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { runPipeline, fallbackPipelineResult, type PipelineResult } from '@/lib/pipeline';
import { Card, Badge, StatRow, ScoreRing, SectionHeader } from '@/components/ui/DashboardCards';

// ─── Constants ───────────────────────────────────────────────────────────
const COLORS = {
  bg: '#F9FAFB', card: '#FFFFFF', primary: '#7C3AED',
  primaryLight: '#EDE9FE', text: '#111827', subtext: '#6B7280',
  border: '#E5E7EB', green: '#10B981', yellow: '#F59E0B', red: '#EF4444',
  skeleton: '#E5E7EB', skeletonHighlight: '#F3F4F6',
};

const REFRESH_COOLDOWN_MS = 2000;

// ─── Section Config ──────────────────────────────────────────────────────
interface DashboardSection {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  isEmpty: (r: PipelineResult) => boolean;
  emptyMessage: string;
  render: (r: PipelineResult) => React.ReactNode;
}

function buildSections(router: any): DashboardSection[] {
  return [
    // 1. Recovery Intelligence
    {
      id: 'recovery',
      title: 'Recovery Intelligence',
      icon: 'heart',
      isEmpty: r => !r.recoveryScore && !r.fatigue && !r.deload,
      emptyMessage: 'Pulse AI is analyzing your recovery patterns. Track your sleep and soreness to unlock recovery insights.',
      render: r => {
        const rec = r.recoveryScore;
        const fat = r.fatigue;
        const del = r.deload;
        const ready = r.readiness;
        return (
          <Card>
            <View style={s.recoveryRow}>
              {rec && <ScoreRing score={rec.overall} label="Recovery" size={80} />}
              {fat && (
                <View style={s.recoveryStats}>
                  <StatRow label="Fatigue Risk" value={fat.fatigueRisk.toUpperCase()} />
                  <StatRow label="ACWR" value={fat.acuteChronicRatio.toFixed(2)} />
                  <StatRow label="Days to recover" value={fat.daysToFullRecovery} unit="days" />
                </View>
              )}
            </View>
            {rec && (
              <View style={s.recoFooter}>
                <Text style={s.recoText}>{rec.recommendation}</Text>
              </View>
            )}
            {del && (
              <View style={[s.deloadBanner, { backgroundColor: del.shouldDeload ? COLORS.red + '15' : COLORS.green + '15' }]}>
                <Feather name={del.shouldDeload ? 'alert-triangle' : 'check-circle'} size={14} color={del.shouldDeload ? COLORS.red : COLORS.green} />
                <Text style={[s.deloadText, { color: del.shouldDeload ? COLORS.red : COLORS.green }]}>
                  {del.shouldDeload ? `Deload needed: ${del.deloadType} (${del.durationDays}d)` : 'No deload needed'}
                </Text>
              </View>
            )}
            {ready && (
              <View style={s.readyRow}>
                <Badge label={ready.canTrain ? 'Can Train' : 'Rest Day'} color={ready.canTrain ? COLORS.green : COLORS.red} />
                <Text style={s.readyDetail}>Max RPE {ready.maxRPE} · Max {ready.maxDuration}min</Text>
              </View>
            )}
          </Card>
        );
      },
    },

    // 2. Training Intelligence
    {
      id: 'training',
      title: 'Training Intelligence',
      icon: 'activity',
      isEmpty: r => r.sessions.length === 0,
      emptyMessage: 'Building your adaptive training baseline. Log your first workout to activate periodization insights.',
      render: r => (
        <Card>
          <View style={s.trainingGrid}>
            <View style={s.trainingItem}>
              <Text style={s.trainingValue}>{String(r.queries.volume.value ?? 0)}</Text>
              <Text style={s.trainingUnit}>{r.queries.volume.unit}</Text>
              <Text style={s.trainingLabel}>Weekly Volume</Text>
            </View>
            <View style={s.trainingItem}>
              <Text style={s.trainingValue}>{String(r.queries.frequency.value ?? 0)}</Text>
              <Text style={s.trainingUnit}>{r.queries.frequency.unit}</Text>
              <Text style={s.trainingLabel}>Sessions/Wk</Text>
            </View>
            <View style={s.trainingItem}>
              <Text style={s.trainingValue}>{String(r.queries.avgRpe.value ?? 0)}</Text>
              <Text style={s.trainingUnit}>RPE</Text>
              <Text style={s.trainingLabel}>Avg Intensity</Text>
            </View>
          </View>
          {r.volumeChecks.length > 0 && (
            <View style={s.volumeSection}>
              <Text style={s.volumeTitle}>Volume per muscle group</Text>
              {r.volumeChecks.slice(0, 4).map((v, i) => (
                <View key={i} style={s.volumeRow}>
                  <Text style={s.volumeName}>{v.muscleGroup}</Text>
                  <View style={s.volumeBarBg}>
                    <View style={[s.volumeBarFill, {
                      width: `${Math.min(100, v.setsPerWeek / Math.max(v.recommended.max, 1) * 100)}%`,
                      backgroundColor: v.status === 'optimal' ? COLORS.green : v.status === 'low' ? COLORS.yellow : COLORS.red,
                    }]} />
                  </View>
                  <Text style={s.volumeSets}>{v.setsPerWeek} sets</Text>
                </View>
              ))}
            </View>
          )}
          {r.autoregulation && (
            <View style={s.autoRow}>
              <Feather name="sliders" size={14} color={COLORS.subtext} />
              <Text style={s.autoText}>Auto-reg: {r.autoregulation.notes}</Text>
            </View>
          )}
        </Card>
      ),
    },

    // 3. Nutrition Intelligence
    {
      id: 'nutrition',
      title: 'Nutrition Intelligence',
      icon: 'coffee',
      isEmpty: r => r.nutritionDays.length === 0,
      emptyMessage: 'Learning your nutritional preferences. Log meals to receive condition-specific protocol recommendations.',
      render: r => (
        <Card>
          <View style={s.macroGrid}>
            <View style={s.macroItem}>
              <Text style={s.macroValue}>{r.suggestedMacros.calories}</Text>
              <Text style={s.macroLabel}>Calories</Text>
            </View>
            <View style={s.macroItem}>
              <Text style={s.macroValue}>{r.suggestedMacros.protein}g</Text>
              <Text style={s.macroLabel}>Protein</Text>
            </View>
            <View style={s.macroItem}>
              <Text style={s.macroValue}>{r.suggestedMacros.carbs}g</Text>
              <Text style={s.macroLabel}>Carbs</Text>
            </View>
            <View style={s.macroItem}>
              <Text style={s.macroValue}>{r.suggestedMacros.fat}g</Text>
              <Text style={s.macroLabel}>Fat</Text>
            </View>
          </View>
          {r.protocols.length > 0 && r.protocols[0].condition !== 'none' && (
            <View style={s.protocolSection}>
              <Text style={s.protocolTitle}>Active Protocols</Text>
              {r.protocols.map((p, i) => (
                <Badge key={i} label={`${p.condition.toUpperCase()}: Na ${p.sodiumLimit}mg · Pro ${p.proteinMin}-${p.proteinMax}g/kg`} color={COLORS.primary} />
              ))}
            </View>
          )}
        </Card>
      ),
    },

    // 4. Behavioral Insights
    {
      id: 'behavioral',
      title: 'Behavioral Insights',
      icon: 'cpu',
      isEmpty: r => !r.behaviorProfile,
      emptyMessage: 'Observing your behavioral patterns. Consistency data will appear as you build your routine.',
      render: r => {
        const beh = r.behaviorProfile;
        if (!beh) return null;
        return (
          <Card>
            <StatRow label="Stage" value={beh.stage} />
            <StatRow label="Relapse Risk" value={Math.round(beh.relapseRisk * 100) + '%'} />
            <StatRow label="Adherence" value={Math.round(beh.recentAdherence * 100) + '%'} />
            <StatRow label="Weeks Active" value={beh.stageDuration} unit="weeks" />
          </Card>
        );
      },
    },

    // 5. Health Intelligence
    {
      id: 'health',
      title: 'Health Intelligence',
      icon: 'shield',
      isEmpty: r => !r.memory && r.protocols.length === 0,
      emptyMessage: 'Mapping your health profile. Configure conditions and medications for personalized safety protocols.',
      render: r => (
        <Card>
          {r.protocols.length > 0 && r.protocols[0].condition !== 'none' ? (
            r.protocols.map((p, i) => (
              <View key={i} style={s.healthProtocolRow}>
                <Feather name="check-circle" size={16} color={COLORS.green} />
                <Text style={s.healthProtocolText}>{p.condition}: {p.proteinMin}-{p.proteinMax}g/kg protein · Na {p.sodiumLimit}mg</Text>
              </View>
            ))
          ) : (
            <View style={s.emptyStateRow}>
              <Feather name="activity" size={20} color={COLORS.subtext} />
              <Text style={s.emptyStateText}>No active health protocols configured.</Text>
            </View>
          )}
          <View style={s.healthDivider} />
          <View style={s.healthStatusRow}>
            <Text style={s.healthStatusLabel}>AI Safety Pipeline</Text>
            <Badge label={r.consistency?.pass ? 'Active' : 'Standby'} color={r.consistency?.pass ? COLORS.green : COLORS.subtext} />
          </View>
        </Card>
      ),
    },

    // 6. AI Recommendations
    {
      id: 'recommendations',
      title: 'AI Recommendations',
      icon: 'target',
      isEmpty: r => r.recommendations.length === 0 && r.insights.length === 0,
      emptyMessage: 'Generating personalized recommendations. Insights will appear as Pulse AI learns your patterns.',
      render: r => (
        <>
          {r.insights.length > 0 && (
            <Card>
              {r.insights.slice(0, 4).map((ins, i) => (
                <View key={i} style={s.insightRow}>
                  <View style={[s.insightDot, {
                    backgroundColor: ins.severity === 'critical' ? COLORS.red :
                      ins.severity === 'warning' ? COLORS.yellow :
                      ins.severity === 'positive' ? COLORS.green : COLORS.primary,
                  }]} />
                  <View style={s.insightContent}>
                    <Text style={s.insightTitle}>{ins.title}</Text>
                    <Text style={s.insightBody} numberOfLines={2}>{ins.body}</Text>
                  </View>
                </View>
              ))}
            </Card>
          )}
          {r.recommendations.length > 0 && r.recommendations.slice(0, 3).map((rec, i) => (
            <Card key={i}>
              <View style={s.recHeader}>
                <Badge label={rec.priority} color={
                  rec.priority === 'urgent' ? COLORS.red :
                  rec.priority === 'high' ? COLORS.yellow :
                  rec.priority === 'medium' ? COLORS.primary : COLORS.subtext
                } />
                <Text style={s.recScore}>Score: {rec.score}/100</Text>
              </View>
              <Text style={s.recTitle}>{rec.title}</Text>
              <Text style={s.recBody}>{rec.body}</Text>
              <View style={s.recMeta}>
                <Text style={s.recMetaText}>{rec.effortLevel} · {rec.timeToBenefit}</Text>
              </View>
            </Card>
          ))}
        </>
      ),
    },

    // 7. Weekly Trends
    {
      id: 'trends',
      title: 'Weekly Trends',
      icon: 'trending-up',
      isEmpty: r => r.summaries.workout === '' && r.summaries.nutrition === '',
      emptyMessage: 'Compiling your weekly trends. Consistent logging helps Pulse AI identify performance patterns.',
      render: r => (
        <Card>
          <Text style={s.summaryTitle}>Training</Text>
          <Text style={s.summaryBody}>{r.summaries.workout}</Text>
          <View style={s.summaryDivider} />
          <Text style={s.summaryTitle}>Nutrition</Text>
          <Text style={s.summaryBody}>{r.summaries.nutrition}</Text>
          <View style={s.summaryDivider} />
          <Text style={s.summaryTitle}>Context</Text>
          <Text style={s.summaryBody}>{r.summaries.context}</Text>
        </Card>
      ),
    },
  ];
}

// ─── Alert Banner ─────────────────────────────────────────────────────────
function AlertBanner({ alerts }: { alerts: PipelineResult['alerts'] }) {
  if (alerts.length === 0) return null;
  const alert = alerts[0];
  return (
    <TouchableOpacity style={s.alertBanner} activeOpacity={0.8}>
      <Feather name={
        alert.category === 'recovery' ? 'heart' :
        alert.category === 'streak' ? 'zap' :
        alert.category === 'milestone' ? 'award' : 'bell'
      } size={16} color={COLORS.primary} />
      <Text style={s.alertBannerText} numberOfLines={1}>{alert.title}</Text>
      <Feather name="chevron-right" size={14} color={COLORS.subtext} />
    </TouchableOpacity>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────
export default function AIDashboard() {
  const router = useRouter();
  const user = useUserStore(s => s.user);

  const [result, setResult] = useState<PipelineResult>(fallbackPipelineResult);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Stable refs — never cause re-renders
  const fetchedForUserRef = useRef<string | undefined>(undefined);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshLockRef = useRef(false);

  // ── Data Fetch (deferred to avoid blocking UI) ──
  const doFetch = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    setLoadError(null);

    try {
      const profile = user?.health_profile || ({
        goal: null, conditions: [], age: null, gender: null,
        height: null, heightUnit: 'cm', weight: null, weightUnit: 'kg', targetWeight: null,
      } as any);

      const p = await runPipeline({
        userId: user?.id,
        profile,
        name: user?.name,
      });
      setResult(p);
      setLoadError(null);
    } catch {
      setLoadError('Pipeline unavailable — showing cached data');
    } finally {
      setRefreshing(false);
    }
  }, [user?.id, user?.name]);

  // ── Initial fetch — once per user, deferred so UI renders first ──
  useEffect(() => {
    const currentId = user?.id;
    if (!currentId || fetchedForUserRef.current === currentId) return;
    fetchedForUserRef.current = currentId;
    setTimeout(() => { doFetch(false); }, 0);
  }, [user?.id, doFetch]);

  // ── Refresh with Cooldown ──
  const onRefresh = useCallback(() => {
    if (refreshLockRef.current) return;
    refreshLockRef.current = true;
    refreshTimerRef.current = setTimeout(() => {
      refreshLockRef.current = false;
    }, REFRESH_COOLDOWN_MS);
    doFetch(true);
  }, [doFetch]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // ── Derived Data ──
  const sections = useMemo(() => buildSections(router), [router]);
  const recoveryColor = result.recoveryScore?.overall != null
    ? result.recoveryScore.overall >= 80 ? COLORS.green : result.recoveryScore.overall >= 60 ? COLORS.primary : result.recoveryScore.overall >= 40 ? COLORS.yellow : COLORS.red
    : COLORS.subtext;

  // ── Render ──
  return (
    <SafeAreaView style={s.container} pointerEvents="auto">
      {/* Header */}
      <LinearGradient colors={['#7C3AED', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Pulse AI</Text>
            <Text style={s.headerSub}>System Dashboard</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={s.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="refresh-cw" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.headerStatus}>
          <Badge label={result.activeState} color="#fff" />
          <Text style={s.headerAdherence}>
            Adherence: {typeof result.queries.adherence.value === 'number' ? Math.round(Math.min(result.queries.adherence.value, 1) * 100) + '%' : 'N/A'}
          </Text>
        </View>
        {loadError && (
          <View style={s.headerError}>
            <Feather name="info" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={s.headerErrorText}>{loadError}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Alert Banner (top of scroll) */}
      <AlertBanner alerts={result.alerts} />

      {/* Content */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.id} style={s.sectionWrapper}>
            <SectionHeader label={section.title} icon={section.icon} />
            {section.isEmpty(result) ? (
              <Card>
                <View style={s.emptyStateRow}>
                  <Feather name={section.icon} size={20} color={COLORS.subtext} />
                  <Text style={s.emptyStateText}>{section.emptyMessage}</Text>
                </View>
              </Card>
            ) : (
              section.render(result)
            )}
          </View>
        ))}

        {/* Bottom spacer so content isn't hidden behind tab bar */}
        <View style={{ height: Platform.OS === 'ios' ? 100 : 80 }} />
      </ScrollView>

      {/* Fade overlay at bottom to prevent hard cut */}
      <LinearGradient
        colors={['transparent', COLORS.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={s.bottomFade}
        pointerEvents="none"
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    zIndex: 0,
  },

  // Header
  header: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 20, zIndex: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  headerStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  headerAdherence: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  headerError: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  headerErrorText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1 },

  // Scroll
  scroll: { flex: 1, zIndex: 0 },
  scrollContent: { padding: 16 },

  // Sections
  sectionWrapper: { marginBottom: 4 },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    zIndex: 1,
  },
  alertBannerText: { flex: 1, fontSize: 13, fontWeight: '500', color: COLORS.primary },

  // Empty State
  emptyStateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  emptyStateText: { flex: 1, fontSize: 13, color: COLORS.subtext, lineHeight: 18 },

  // Bottom fade
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, zIndex: 2, pointerEvents: 'none' },

  // Recovery
  recoveryRow: { flexDirection: 'row', alignItems: 'center' },
  recoveryStats: { flex: 1 },
  recoFooter: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border + '60' },
  recoText: { fontSize: 13, color: COLORS.subtext, fontStyle: 'italic' },
  deloadBanner: { marginTop: 8, padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  deloadText: { fontSize: 12, fontWeight: '500', marginLeft: 6 },
  readyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  readyDetail: { fontSize: 12, color: COLORS.subtext },

  // Training
  trainingGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  trainingItem: { alignItems: 'center' },
  trainingValue: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  trainingUnit: { fontSize: 11, color: COLORS.subtext, marginTop: -2 },
  trainingLabel: { fontSize: 11, color: COLORS.subtext, marginTop: 2 },
  volumeSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border + '60' },
  volumeTitle: { fontSize: 12, fontWeight: '600', color: COLORS.subtext, marginBottom: 8 },
  volumeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  volumeName: { fontSize: 12, color: COLORS.text, width: 80 },
  volumeBarBg: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginHorizontal: 8 },
  volumeBarFill: { height: 6, borderRadius: 3 },
  volumeSets: { fontSize: 11, color: COLORS.subtext, width: 50, textAlign: 'right' },
  autoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border + '60' },
  autoText: { fontSize: 12, color: COLORS.subtext, marginLeft: 6, flex: 1 },

  // Nutrition
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  macroLabel: { fontSize: 11, color: COLORS.subtext, marginTop: 2 },
  protocolSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border + '60' },
  protocolTitle: { fontSize: 12, fontWeight: '600', color: COLORS.subtext, marginBottom: 6 },

  // Health
  healthProtocolRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  healthProtocolText: { fontSize: 13, color: COLORS.text, fontWeight: '500' },
  healthDivider: { height: 1, backgroundColor: COLORS.border + '60', marginVertical: 8 },
  healthStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  healthStatusLabel: { fontSize: 13, color: COLORS.subtext },

  // Insights
  insightRow: { flexDirection: 'row', marginBottom: 10 },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 10 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  insightBody: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },

  // Recommendations
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  recScore: { fontSize: 11, color: COLORS.subtext },
  recTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  recBody: { fontSize: 12, color: COLORS.subtext, lineHeight: 18 },
  recMeta: { marginTop: 6, flexDirection: 'row' },
  recMetaText: { fontSize: 11, color: COLORS.subtext },

  // Summaries
  summaryTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  summaryBody: { fontSize: 12, color: COLORS.subtext, lineHeight: 18 },
  summaryDivider: { height: 1, backgroundColor: COLORS.border + '60', marginVertical: 8 },
});
