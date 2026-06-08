import { buildMemoryContext, type AggregatedMemoryContext, getActiveConditions, getActiveInjuries, getLatestUserContext, getUserContextHistory, getRecentWorkoutSessions, getRecentNutritionDays, saveWorkoutSession, saveNutritionDay, syncRecoveryDays, syncExerciseProgress, type MemoryWorkoutSession, type MemoryNutritionDay, type MemoryUserContext } from './memoryService';
import { supabase } from './supabase';
import { queryWorkoutVolume, queryWorkoutFrequency, queryAvgRPEPerWeek, queryNutritionAverage, adherenceRate, queryContextTrend, summarizeWorkoutPeriod, summarizeNutritionPeriod, summarizeContextPeriod } from './contextEngine';
import { storeText, retrieveContext, clearStore, consolidate, getStats, type TextChunk } from './memoryStore';
import { generateMesocycle, weeklyVolumePerMuscleGroup, autoregulate, getVolumeLandmarks, assignLoad, type MesocyclePlan, type MesocycleParams, type VolumeCheck, type AutoregulationAdjustment, type PeriodizationType, type TrainingGoal, type TrainingLevel } from './coachingEngine';
import { assessFoggModel, assessSDT, assessComB, determineStage, calculateRelapseRisk, generateFoggIntervention, generateSDTIntervention, generateComBIntervention, generateRelapsePreventionPlan, buildBehaviorProfile, type BehaviorProfile, type BehavioralIntervention, type SdtProfile, type ComBAssessment } from './behavioralEngine';
import { recoveryStatus, readinessForTraining, type RecoveryScore, type FatiguePrediction, type DeloadDecision } from './recoveryEngine';
import { getProtocolForCondition, checkMealAgainstCondition, suggestedMacros, type ConditionProtocol, type NutritionCheck, type MealAssessment } from './nutritionEngine';
import { generateInsights, detectAnomalies, type Insight } from './insightEngine';
import { prioritizeRecommendations, explainRecommendation, type Recommendation, type RecommendationRequest } from './recommendationEngine';
import { validateAgainstHistory, checkConsistency, propagateUncertainty, type ConsistencyCheckResult, type UncertaintyPropagation } from './trustSystem';
import { generateAlerts, generateDailyCheckin, milestoneRecognition, type Alert, type ProactiveCheckin, type Milestone, type StreakInfo } from './proactiveEngine';
import { resolveStates, getStateSummary, type StateContext } from './adaptiveStates';
import type { HealthProfile } from './auth';

export interface PipelineContext {
  userId?: string;
  userMessage?: string;
  profile: HealthProfile;
  name?: string;
  recoveryInput?: {
    sleepHours: number;
    sleepQuality: number;
    hrv?: number;
    restingHr?: number;
    soreness: number;
    fatigue: number;
    stress: number;
    readiness?: number;
  };
  nutritionContext?: {
    weightKg: number;
    goal: string;
    conditions: string[];
  };
  behaviorContext?: {
    adherenceRate: number;
    activeWeeks: number;
    commitment: number;
    missedSessions: number;
    stress: number;
    confidence: number;
  };
  feedbackHistory?: string[];
}

export interface PipelineResult {
  memory: AggregatedMemoryContext | null;
  sessions: MemoryWorkoutSession[];
  nutritionDays: MemoryNutritionDay[];
  ctxHistory: MemoryUserContext[];

  // Context Layer
  summaries: {
    workout: string;
    nutrition: string;
    context: string;
  };
  queries: {
    volume: ReturnType<typeof queryWorkoutVolume>;
    frequency: ReturnType<typeof queryWorkoutFrequency>;
    avgRpe: ReturnType<typeof queryAvgRPEPerWeek>;
    nutritionCalories: ReturnType<typeof queryNutritionAverage>;
    adherence: ReturnType<typeof adherenceRate>;
  };

  // RAG Memory Store
  ragStats: { total: number; bySource: Record<string, number> };
  ragContext: string;

  // Coaching Engine
  mesocycle: MesocyclePlan | null;
  volumeChecks: VolumeCheck[];
  autoregulation: AutoregulationAdjustment | null;

  // Behavioral Engine
  behaviorProfile: BehaviorProfile | null;
  fogg: ReturnType<typeof assessFoggModel> | null;
  sdt: SdtProfile | null;
  comb: ComBAssessment | null;
  interventions: BehavioralIntervention[];

  // Recovery Engine
  recoveryScore: RecoveryScore | null;
  fatigue: FatiguePrediction | null;
  deload: DeloadDecision | null;
  readiness: { canTrain: boolean; maxRPE: number; maxDuration: number } | null;

  // Nutrition Engine
  protocols: ConditionProtocol[];
  nutritionCheck: NutritionCheck | null;
  suggestedMacros: { calories: number; protein: number; carbs: number; fat: number };

  // Insight Engine
  insights: Insight[];

  // Recommendation Engine
  recommendations: Recommendation[];

  // Trust System
  consistency: {
    pass: boolean;
    issues: ConsistencyCheckResult[];
  } | null;
  uncertainty: UncertaintyPropagation | null;

  // Proactive AI
  alerts: Alert[];
  checkin: ProactiveCheckin | null;

  // State
  activeState: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>(resolve => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).then(result => {
    clearTimeout(timer!);
    return result;
  });
}

export function fallbackPipelineResult(): PipelineResult {
  return {
    memory: null,
    sessions: [],
    nutritionDays: [],
    ctxHistory: [],
    summaries: { workout: 'Pulse AI is building your adaptive training baseline. Complete your first workout to unlock insights.', nutrition: 'Pulse AI is learning your nutritional preferences. Log your first meal to receive personalized guidance.', context: 'Pulse AI is observing your behavioral patterns. Your context dashboard will populate as you interact with the app.' },
    queries: {
      volume: { label: 'Weekly Volume', value: 0, unit: 'kg', confidence: 0 },
      frequency: { label: 'Sessions/Week', value: 0, unit: 'sessions', confidence: 0 },
      avgRpe: { label: 'Avg RPE', value: 0, unit: 'RPE', confidence: 0 },
      nutritionCalories: { label: 'Avg Calories', value: 0, unit: 'kcal', confidence: 0 },
      adherence: { label: 'Adherence', value: 0, unit: '%', confidence: 0 },
    },
    ragStats: { total: 0, bySource: {} },
    ragContext: '',
    mesocycle: null,
    volumeChecks: [],
    autoregulation: null,
    behaviorProfile: null,
    fogg: null,
    sdt: null,
    comb: null,
    interventions: [],
    recoveryScore: null,
    fatigue: null,
    deload: null,
    readiness: null,
    protocols: [],
    nutritionCheck: null,
    suggestedMacros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    insights: [],
    recommendations: [],
    consistency: null,
    uncertainty: null,
    alerts: [],
    checkin: null,
    activeState: 'idle',
  };
}

export async function runPipeline(ctx: PipelineContext): Promise<PipelineResult> {
  // 0. SYNC — pull data from Supabase into local memory tables
  if (ctx.userId) {
    await Promise.all([
      syncRecoveryDays(ctx.userId, 14).catch(() => {}),
      syncExerciseProgress(ctx.userId, 90).catch(() => {}),
    ]);
  }

  // 1. MEMORY LAYER — fetch all data (with 5s timeout per call)
  const sessions: MemoryWorkoutSession[] = ctx.userId
    ? await withTimeout(getRecentWorkoutSessions(ctx.userId, 20), 5000, []) : [];
  const nutritionDays: MemoryNutritionDay[] = ctx.userId
    ? await withTimeout(getRecentNutritionDays(ctx.userId, 14), 5000, []) : [];
  const ctxHistory: MemoryUserContext[] = ctx.userId
    ? await withTimeout(getUserContextHistory(ctx.userId, 7), 5000, []) : [];
  const memory: AggregatedMemoryContext | null = ctx.userId
    ? await withTimeout(buildMemoryContext(ctx.userId).catch(() => null), 5000, null) : null;

  // 1b. SUPABASE FALLBACK — if memory tables are empty, query main app tables directly
  if (ctx.userId && sessions.length === 0) {
    try {
      const { data: workoutData } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', ctx.userId)
        .order('logged_at', { ascending: false })
        .limit(20);
      if (workoutData && workoutData.length > 0) {
        for (const w of workoutData) {
          let totalVolume: number | undefined;
          let rpeSum = 0;
          let rpeCount = 0;
          let parsedEx: any[] = [];
          try {
            const ex = typeof w.exercises === 'string' ? JSON.parse(w.exercises) : (w.exercises || []);
            parsedEx = Array.isArray(ex) ? ex : [];
            for (const e of parsedEx) {
              if (e.sets) {
                for (const set of e.sets) {
                  totalVolume = (totalVolume || 0) + (set.weight || 0) * (set.reps || 0);
                }
              }
              if (e.rpe != null) { rpeSum += e.rpe; rpeCount++; }
            }
          } catch { /* use defaults */ }
          const session: MemoryWorkoutSession = {
            id: w.id || `ws_${Date.now()}_${Math.random()}`,
            user_id: w.user_id,
            session_date: (w.logged_at?.split('T')[0] || new Date().toISOString().split('T')[0]) as string,
            duration_minutes: w.duration_minutes || undefined,
            focus: w.plan_name || undefined,
            plan_name: w.plan_name || undefined,
            rpe_avg: rpeCount > 0 ? rpeSum / rpeCount : undefined,
            exercises: parsedEx,
            total_volume_kg: totalVolume,
            notes: w.notes || undefined,
            synced: 1,
            created_at: w.logged_at || new Date().toISOString(),
          };
          sessions.push(session);
          saveWorkoutSession(session).catch(() => {});
        }
      }
    } catch { /* supabase unavailable — continue with empty */ }
  }

  if (ctx.userId && nutritionDays.length === 0) {
    try {
      const { data: mealData } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', ctx.userId)
        .order('logged_at', { ascending: false })
        .limit(200);
      if (mealData && mealData.length > 0) {
        const dayMap = new Map<string, {
          calories: number; protein: number; carbs: number; fat: number; count: number;
        }>();
        for (const m of mealData) {
          const day = m.logged_at?.split('T')[0] || new Date().toISOString().split('T')[0];
          if (!dayMap.has(day)) dayMap.set(day, { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 });
          const d = dayMap.get(day)!;
          d.calories += m.calories || 0;
          d.protein += m.protein_g || 0;
          d.carbs += m.carbs_g || 0;
          d.fat += m.fat_g || 0;
          d.count++;
        }
        for (const [logDate, vals] of dayMap) {
          const nd: MemoryNutritionDay = {
            id: `nd_${ctx.userId}_${logDate}`,
            user_id: ctx.userId,
            log_date: logDate,
            total_calories: vals.calories || 0,
            total_protein_g: vals.protein || 0,
            total_carbs_g: vals.carbs || 0,
            total_fat_g: vals.fat || 0,
            meal_count: vals.count,
            synced: 1,
            created_at: new Date().toISOString(),
          };
          nutritionDays.push(nd);
          saveNutritionDay(nd).catch(() => {});
        }
        nutritionDays.sort((a, b) => b.log_date.localeCompare(a.log_date));
      }
    } catch { /* supabase unavailable */ }
  }

  // 2. CONTEXT LAYER — structured queries and summaries (all synchronous)
  const volume = queryWorkoutVolume(sessions, 1);
  const frequency = queryWorkoutFrequency(sessions, 1);
  const avgRpe = queryAvgRPEPerWeek(sessions, 1);
  const nutritionCalories = queryNutritionAverage(nutritionDays, 'total_calories', 1);
  const adhere = adherenceRate(nutritionDays, 1);
  const workoutSummary = summarizeWorkoutPeriod(sessions, 1);
  const nutritionSummary = summarizeNutritionPeriod(nutritionDays, 1);
  const contextSummary = summarizeContextPeriod(ctxHistory);

  // 3. RAG — store recent context for semantic retrieval (sync, fast)
  try {
    if (memory) {
      const knowledgeText = [
        memory.recentWorkouts,
        memory.recentNutrition,
        memory.activeInjuries,
        memory.activeConditions,
        memory.latestContext,
      ].filter(Boolean).join('\n\n');
      storeText(knowledgeText, 'user_memory', 400, 40);
    }
  } catch { /* rag failure non-critical */ }
  const ragContext = ctx.userMessage ? retrieveContext(ctx.userMessage, 3) : '';
  const ragStats = getStats();

  // 4. COACHING ENGINE — periodization, volume, autoregulation
  const goalMap: Record<string, TrainingGoal> = {
    muscle_gain: 'hypertrophy', fat_loss: 'endurance', strength: 'strength', general: 'general',
  };
  const trainingGoal = goalMap[ctx.profile.goal || 'general'] || 'general';
  let mesocycle: MesocyclePlan | null = null;
  try {
    mesocycle = generateMesocycle({
      goal: trainingGoal,
      level: 'intermediate',
      weeks: 4,
      daysPerWeek: 4,
      periodization: 'linear',
      experienceMonths: ctx.behaviorContext?.activeWeeks ?? 0,
    });
  } catch { /* fallback null */ }
  const volumeChecks = weeklyVolumePerMuscleGroup(sessions);
  let autoregulation: AutoregulationAdjustment | null = null;
  if (ctx.recoveryInput) {
    const avgFatigue = ctx.recoveryInput.fatigue;
    autoregulation = autoregulate(ctx.recoveryInput.readiness ?? 7, 7, avgFatigue);
  }

  // 5. BEHAVIORAL ENGINE
  let behaviorProfile: BehaviorProfile | null = null;
  let fogg: ReturnType<typeof assessFoggModel> | null = null;
  let sdt: SdtProfile | null = null;
  let comb: ComBAssessment | null = null;
  let interventions: BehavioralIntervention[] = [];

  if (ctx.behaviorContext) {
    behaviorProfile = buildBehaviorProfile(
      ctx.behaviorContext.adherenceRate,
      ctx.behaviorContext.activeWeeks,
      ctx.behaviorContext.commitment,
      ctx.behaviorContext.missedSessions,
      ctx.behaviorContext.stress,
      ctx.behaviorContext.confidence,
    );
    fogg = assessFoggModel(ctx.behaviorContext.commitment, 5, 5);
    sdt = assessSDT({ autonomy: 5, competence: 5, relatedness: 5 });
    comb = assessComB(7, 6, ctx.behaviorContext.commitment);

    interventions.push(generateFoggIntervention(fogg, 'exercise'));
    interventions.push(generateSDTIntervention(sdt));
    interventions.push(generateComBIntervention(comb));
    interventions.push(...generateRelapsePreventionPlan(behaviorProfile.relapseRisk, behaviorProfile.stage));
  }

  // 6. RECOVERY ENGINE
  let recoveryScore: RecoveryScore | null = null;
  let fatigue: FatiguePrediction | null = null;
  let deload: DeloadDecision | null = null;
  let readiness: ReturnType<typeof readinessForTraining> | null = null;

  if (ctx.recoveryInput) {
    const status = recoveryStatus(ctx.recoveryInput);
    recoveryScore = status.score;
    fatigue = status.fatigue;
    deload = status.deload;
    readiness = readinessForTraining(status.score.overall, status.fatigue.fatigueRisk);
  }

  // 7. NUTRITION ENGINE
  const conditions = ctx.profile.conditions || [];
  const protocols = getProtocolForCondition(conditions);
  let nutritionCheck: NutritionCheck | null = null;
  if (ctx.nutritionContext) {
    const mealAssessment: Partial<MealAssessment> = {
      bodyWeightKg: ctx.nutritionContext.weightKg,
    };
    nutritionCheck = checkMealAgainstCondition(mealAssessment, protocols);
  }
  const suggested = suggestedMacros(
    ctx.nutritionContext?.weightKg ?? 70,
    ctx.nutritionContext?.goal ?? 'general',
    conditions,
  );

  // 8. INSIGHT ENGINE
  const insights = generateInsights(sessions, nutritionDays, ctxHistory);

  // 9. RECOMMENDATION ENGINE
  const recommendations = prioritizeRecommendations({
    insights,
    recoveryScore: recoveryScore?.overall ?? 50,
    adherenceRate: adhere.value as number,
    behaviorStage: behaviorProfile?.stage ?? 'maintenance',
    relapseRisk: behaviorProfile?.relapseRisk ?? 0,
    missedSessions: ctx.behaviorContext?.missedSessions ?? 0,
    stressLevel: ctx.recoveryInput?.stress ?? 5,
    userId: ctx.userId,
  });

  // 10. TRUST SYSTEM
  let consistency: { pass: boolean; issues: ConsistencyCheckResult[] } | null = null;
  let uncertainty: UncertaintyPropagation | null = null;
  if (ctx.feedbackHistory && ctx.feedbackHistory.length > 0 && ctx.userMessage) {
    consistency = validateAgainstHistory(ctx.userMessage, ctx.feedbackHistory);
    uncertainty = propagateUncertainty(0.8, sessions.length, 7, 0.7, sessions.length >= 5);
  }

  // 11. PROACTIVE AI
  const streakInfo: StreakInfo = {
    currentStreak: ctx.behaviorContext?.activeWeeks ?? 0,
    longestStreak: ctx.behaviorContext?.activeWeeks ?? 0,
    streakType: 'workout',
    status: ctx.behaviorContext?.missedSessions && ctx.behaviorContext.missedSessions >= 2 ? 'at_risk' : 'on_track',
    daysSinceLastAction: ctx.behaviorContext?.missedSessions ?? 0,
  };
  const milestones: Milestone[] = [
    {
      id: 'ms_workouts_10',
      category: 'workout',
      name: '10 Workouts Completed',
      achieved: sessions.length >= 10,
      achievedDate: sessions.length >= 10 ? sessions[0]?.session_date : undefined,
      progress: Math.min(10, sessions.length),
      total: 10,
    },
    {
      id: 'ms_workouts_50',
      category: 'workout',
      name: '50 Workouts Completed',
      achieved: sessions.length >= 50,
      progress: Math.min(50, sessions.length),
      total: 50,
    },
    {
      id: 'ms_streak_7',
      category: 'adherence',
      name: '7-Day Streak',
      achieved: ctx.behaviorContext?.activeWeeks ? ctx.behaviorContext.activeWeeks >= 1 : false,
      progress: ctx.behaviorContext?.activeWeeks ?? 0,
      total: 1,
    },
  ];

  const alerts = generateAlerts(
    streakInfo,
    milestones,
    recoveryScore?.overall ?? null,
    ctx.behaviorContext?.missedSessions ?? 0,
    ctx.behaviorContext?.adherenceRate ?? 1,
  );

  const checkin = generateDailyCheckin({
    recoveryScore: recoveryScore?.overall,
    timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
  });

  // State
  const state = resolveStates(ctx.profile, {
    sleepHours: ctx.recoveryInput?.sleepHours,
    sleepQuality: ctx.recoveryInput?.sleepQuality,
    restingHr: ctx.recoveryInput?.restingHr,
    fatigueScore: ctx.recoveryInput?.fatigue,
    sorenessScore: ctx.recoveryInput?.soreness,
    stressLevel: ctx.recoveryInput?.stress,
  });

  return {
    memory,
    sessions,
    nutritionDays,
    ctxHistory,
    summaries: {
      workout: workoutSummary,
      nutrition: nutritionSummary,
      context: contextSummary,
    },
    queries: {
      volume, frequency, avgRpe,
      nutritionCalories,
      adherence: adhere,
    },
    ragStats,
    ragContext,
    mesocycle,
    volumeChecks,
    autoregulation,
    behaviorProfile,
    fogg,
    sdt,
    comb,
    interventions,
    recoveryScore,
    fatigue,
    deload,
    readiness,
    protocols,
    nutritionCheck,
    suggestedMacros: suggested,
    insights,
    recommendations,
    consistency,
    uncertainty,
    alerts,
    checkin,
    activeState: getStateSummary(state),
  };
}
