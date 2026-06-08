// AI Coach v3 — Soft Premium Fintech Aesthetic
// Gradient hero header, conversation area, fixed input bar with quick prompts

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { theme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// PREFLIGHT FIX: Avoid importing `expo-blur` on Android (hardware bitmap crash risk).
// SAFETY: Only require BlurView at runtime on iOS; Android uses a translucent solid surface.
const BlurViewIOS: null | React.ComponentType<any> =
  Platform.OS === 'ios' ? require('expo-blur').BlurView : null;
import { useAiTrainerStore, type ActivePlan } from '@/store/aiTrainerStore';
import { useLiveContextStore, type InsightCard } from '@/store/liveContextStore';
import { useSplitBuilderStore } from '@/store/splitBuilderStore';
import { buildMemoryContext } from '@/lib/memoryService';
import { getCoachResponse } from '@/lib/aiTrainer';
import { generateCoachOpeningMessage, generateInsights, type InsightInput } from '@/lib/liveInsightsEngine';
import { parsePlanFromResponse } from '@/lib/aiPlanParser';
import { StreamingText, type ThinkingStage } from '@/components/ui/StreamingText';
import AIInsightCard from '@/components/ui/AIInsightCard';
import ModeBadge from '@/components/ui/ModeBadge';
import PlanActivationScreen from '@/components/ui/PlanActivationScreen';
import AIResponseCard from '@/components/ui/AIResponseCard';
import InsightCardUI from '@/components/ui/InsightCard';
import PulseDot from '@/components/ui/PulseDot';
import AvatarCircle from '@/components/ui/AvatarCircle';

type Message = { id: string; role: 'ai' | 'user'; content: string; stages?: ThinkingStage[] };
type QuickAction = { id: string; icon: React.ComponentProps<typeof Feather>['name']; label: string; prompt: string };

const AI_STATES = [
  { label: 'Ready to coach', icon: 'check-circle', color: '#22C55E' },
  { label: 'Analyzing recovery', icon: 'activity', color: '#8B5CF6' },
  { label: 'Reviewing your week', icon: 'calendar', color: '#F59E0B' },
  { label: 'Checking adherence', icon: 'trending-up', color: '#60A5FA' },
  { label: 'Processing...', icon: 'loader', color: '#EC4899' },
];

function CoachBubble({ message }: { message: Message }) {
  const [done, setDone] = useState(false);
  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.coachBubbleWrap}>
      <View style={styles.aiAvatarBubble}>
        <AvatarCircle name="AI" size={28} variant="gradient" />
      </View>
      <View style={styles.coachBubble}>
        <View style={styles.aiLabelRow}>
          <View style={styles.aiLabelDot} />
          <Text style={styles.aiLabel}>FitAI Coach</Text>
        </View>
        {message.stages && !done ? (
          <StreamingText
            text={message.content}
            stages={message.stages}
            onComplete={() => setDone(true)}
            textStyle={styles.coachText}
          />
        ) : (
          <Text style={styles.coachText}>{message.content}</Text>
        )}
      </View>
    </Animated.View>
  );
}

function UserBubble({ message }: { message: Message }) {
  return (
    <Animated.View entering={FadeInDown.duration(250).springify()} style={styles.userBubbleWrap}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.userBubble}
      >
        <Text style={styles.userText}>{message.content}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function QuickActionPill({ action, handleSend }: { action: { id: string; icon: string; label: string; prompt: string }; handleSend: (text: string) => void }) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        handleSend(action.prompt);
      }}
      activeOpacity={0.7}
    >
      <Feather name={action.icon as any} size={13} color={theme.colors.primary} />
      <Text style={styles.quickActionText}>{action.label}</Text>
    </TouchableOpacity>
  );
}

function TypingDots() {
  return (
    <Animated.View entering={FadeIn} style={styles.typingBubble}>
      <View style={styles.aiAvatarBubble}>
        <AvatarCircle name="AI" size={28} variant="gradient" />
      </View>
      <View style={styles.typingDotsRow}>
        {[0, 1, 2].map((i) => (
          <Animated.View key={i} entering={FadeIn.delay(i * 150)} style={styles.typingDot} />
        ))}
      </View>
    </Animated.View>
  );
}

export default function AiCoach() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [aiStateIndex, setAiStateIndex] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [parsedPlan, setParsedPlan] = useState<ActivePlan | null>(null);
  const [activationVisible, setActivationVisible] = useState(false);
  const [showActivateBtn, setShowActivateBtn] = useState(false);
  const [showWorkoutBtn, setShowWorkoutBtn] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  const storeInsights = useLiveContextStore((s) => s.insights);

  const renderChatItem = useCallback(({ item }: { item: Message }) => {
    return item.role === 'ai' ? <CoachBubble message={item} /> : <UserBubble message={item} />;
  }, []);
  const setStoreInsights = useLiveContextStore((s) => s.setInsights);
  const coachCtx = useLiveContextStore((s) => s.coach);
  const updateCoach = useLiveContextStore((s) => s.updateCoach);
  const activePlan = useAiTrainerStore((s) => s.activePlan);
  const hydrateAiTrainer = useAiTrainerStore((s) => s.hydrateFromCache);

  useEffect(() => {
    if (!activePlan) hydrateAiTrainer().catch(() => {});
  }, [activePlan, hydrateAiTrainer]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardWillHide',
      () => setKeyboardVisible(false)
    );
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const buildContextInput = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) return null;

    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

    const [mealsResult, workoutResult, waterResult, memory] = await Promise.all([
      supabase.from('meal_logs').select('calories, protein_g, carbs_g, fat_g, meal_type').eq('user_id', user.id).gte('logged_at', startToday).lte('logged_at', endToday),
      supabase.from('workout_logs').select('duration_minutes, focus, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(5),
      supabase.from('water_logs').select('glasses').eq('user_id', user.id).gte('logged_at', startToday).lte('logged_at', endToday),
      buildMemoryContext(user.id).catch(() => null),
    ]);

    const meals = mealsResult.data || [];
    const calories = meals.reduce((s, m) => s + (m.calories || 0), 0);
    const protein = meals.reduce((s, m) => s + (m.protein_g || 0), 0);
    const carbs = meals.reduce((s, m) => s + (m.carbs_g || 0), 0);
    const fat = meals.reduce((s, m) => s + (m.fat_g || 0), 0);
    const waterGlasses = (waterResult.data || []).reduce((s, w) => s + (w.glasses || 0), 0);
    const lastWorkout = (workoutResult.data || [])[0];

    const splitStore = useSplitBuilderStore.getState();
    const plannedThisWeek = splitStore.days.filter((d: any) => !d.isRest).length;

    const insightInput: InsightInput = {
      calories, calorieGoal: profile.calorie_goal || 1800,
      protein, proteinGoal: profile.protein_goal_g || 150,
      carbs, carbsGoal: profile.carbs_goal_g || 200,
      fat, fatGoal: profile.fat_goal_g || 60,
      water: waterGlasses, waterGoal: 8,
      steps: 0, stepsGoal: 10000, streakDays: 0, mealsLogged: meals.length,
      todayExerciseMin: lastWorkout?.duration_minutes || 0,
      latestWeight: null, previousWeight: null,
      sleepHours: null, previousSleep: null, adherenceTrend: null,
      completedWorkoutsThisWeek: 0, plannedWorkoutsThisWeek: plannedThisWeek,
      weeklyWorkoutsLastWeek: 0, readinessScore: 7, fatigueLevel: 3,
      stressLevel: null, motivationLevel: null,
    };

    return { userId: user.id, profile, insightInput, memory, mealsCount: meals.length };
  }, []);

  const getQuickActions = useCallback((inputText: string): QuickAction[] => {
    if (loading) return [];
    const base: QuickAction[] = [
      { id: 'recovery', icon: 'activity', label: 'Review recovery', prompt: 'How is my recovery looking?' },
      { id: 'adherence', icon: 'trending-up', label: 'Check adherence', prompt: 'How is my consistency this week?' },
      { id: 'nutrition', icon: 'coffee', label: 'Nutrition gaps', prompt: 'What am I missing nutritionally?' },
      { id: 'plan', icon: 'file-text', label: 'Build my split', prompt: 'Can you suggest a training split for me?' },
    ];
    if (activePlan) {
      base.push({ id: 'progress', icon: 'bar-chart-2', label: 'Progress report', prompt: 'How am I progressing on my plan?' });
      base.push({ id: 'adjust', icon: 'sliders', label: 'Adjust plan', prompt: 'I need to adjust my current plan' });
    }
    const lower = inputText.toLowerCase();
    if (lower.includes('tired') || lower.includes('fatigue')) {
      return [{ id: 'fatigue', icon: 'moon', label: 'Manage fatigue', prompt: "I'm feeling fatigued, what should I do?" }, ...base];
    }
    if (lower.includes('eat') || lower.includes('food') || lower.includes('diet')) {
      return [{ id: 'meal', icon: 'coffee', label: 'Meal suggestions', prompt: 'What should I eat today?' }, ...base];
    }
    if (lower.includes('sleep') || lower.includes('rest')) {
      return [{ id: 'sleep', icon: 'moon', label: 'Improve sleep', prompt: 'How can I improve my sleep for recovery?' }, ...base];
    }
    return base.slice(0, 4);
  }, [loading, activePlan]);

  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);

  useEffect(() => {
    setQuickActions(getQuickActions(input));
  }, [input, getQuickActions]);

  const initializeCoach = useCallback(async () => {
    const ctx = await buildContextInput();
    if (!ctx) return;

    const opening = generateCoachOpeningMessage(ctx.insightInput);
    const stages: ThinkingStage[] = [
      { label: 'Reviewing recent data', duration: 400 },
      { label: 'Checking recovery', duration: 300 },
      { label: 'Preparing message', duration: 500 },
    ];

    updateCoach({ lastWorkoutSummary: ctx.insightInput.todayExerciseMin > 0 ? `${ctx.insightInput.todayExerciseMin}min workout logged` : '' });

    try {
      const insightCards = generateInsights(ctx.insightInput);
      setStoreInsights(insightCards);
    } catch (e) { /* engine may throw */ }

    addMessage({ id: 'init', role: 'ai', content: opening, stages });
    setInitialized(true);
    setAiStateIndex(0);
  }, [buildContextInput, addMessage, updateCoach, setStoreInsights]);

  useEffect(() => {
    if (!initialized) initializeCoach();
  }, [initialized, initializeCoach]);

  useEffect(() => {
    if (activePlan && activePlan.workoutDays && activePlan.workoutDays.length > 0 && !activationVisible) {
      setShowWorkoutBtn(true);
    }
  }, [activePlan, activationVisible]);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!text) setInput('');
    setShowQuickActions(false);
    addMessage({ id: `u-${Date.now()}`, role: 'user', content: msg });
    setLoading(true);
    setAiStateIndex(3);

    try {
      const ctx = await buildContextInput();
      if (!ctx) {
        addMessage({ id: `a-${Date.now()}`, role: 'ai', content: "I'm having trouble accessing your data. Let's chat — what's on your mind?" });
        setLoading(false); setAiStateIndex(0); return;
      }

      const chatHistory = messages
        .filter((m) => m.role === 'user' || m.role === 'ai')
        .slice(-30)
        .map((m) => ({ role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.content }));

      const memoryOverride = ctx.memory ? `
RECENT WORKOUTS:
${(ctx.memory as any)?.recentWorkouts || ''}
RECENT NUTRITION:
${(ctx.memory as any)?.recentNutrition || ''}
ACTIVE INJURIES:
${(ctx.memory as any)?.activeInjuries || ''}
ACTIVE CONDITIONS:
${(ctx.memory as any)?.activeConditions || ''}
TODAY'S CONTEXT:
${(ctx.memory as any)?.latestContext || ''}
CONTEXT TREND (7 days):
${(ctx.memory as any)?.contextHistory || ''}` : '';

      const response = await getCoachResponse(msg, {
        profile: {
          goal: ctx.profile.goal || 'general',
          conditions: ctx.profile.health_conditions || [],
          age: ctx.profile.age, weight: ctx.profile.weight_kg, weightUnit: 'kg',
          height: ctx.profile.height_cm, heightUnit: 'cm',
          experience_level: ctx.profile.experience_level,
          activity_level: ctx.profile.activity_level,
          available_days: ctx.profile.available_days,
          equipment: ctx.profile.equipment, diet_type: ctx.profile.diet_type,
          injuries: ctx.profile.injuries, sleep_hours: ctx.profile.sleep_hours,
          stress_level: ctx.profile.stress_level,
          cardio_preference: ctx.profile.cardio_preference,
          gender: null, targetWeight: null,
        },
        name: ctx.profile.full_name,
        userId: ctx.userId,
        memoryOverride,
        nutritionStatus: {
          calories: ctx.insightInput.calories,
          calorieGoal: ctx.insightInput.calorieGoal,
          protein: ctx.insightInput.protein,
          carbs: ctx.insightInput.carbs,
          fat: ctx.insightInput.fat,
          mealsLogged: ctx.mealsCount,
        },
        workoutSplit: activePlan?.trainingSplitSummary || '',
      }, chatHistory);

      const stages: ThinkingStage[] = [
        { label: 'Analyzing your input', duration: 300 },
        { label: 'Checking context', duration: 200 },
        { label: 'Generating response', duration: 400 },
      ];

      const plan = parsePlanFromResponse(response.content, ctx.userId);
      if (plan) {
        setParsedPlan(plan);
        setShowActivateBtn(true);
      }

      const workoutIntent = /(?:let'?s\s*(?:start|begin|go|train|workout)|start\s*(?:workout|training)|ready\s*(?:to\s*)?(?:train|go|workout|start)|begin\s*workout|let'?s\s*do\s*(?:this|it|a workout|today)|i'?m\s*ready\s*(?:to\s*)?(?:train|start)|time\s*to\s*(?:train|workout|go))/i.test(msg);
      const planExists = activePlan || plan;
      if (workoutIntent && planExists) setShowWorkoutBtn(true);

      try {
        const insightCards = generateInsights(ctx.insightInput);
        setStoreInsights(insightCards);
      } catch (e) { /* engine may throw */ }

      addMessage({ id: `a-${Date.now()}`, role: 'ai', content: response.content, stages });

      updateCoach({
        lastInteractionContext: msg,
        weeklyAdherence: ctx.profile.calorie_goal ? Math.min(100, Math.round(ctx.insightInput.calories / ctx.profile.calorie_goal * 100)) : 0,
        currentWeek: activePlan?.weekNumber || 1,
        phase: activePlan ? 'plan_active' : 'consultation',
      });
    } catch (e: any) {
      console.error('Coach error:', e);
      addMessage({ id: `a-${Date.now()}`, role: 'ai', content: "I hit a snag processing that. Can you rephrase?" });
    }
    setLoading(false);
    setAiStateIndex(0);
  }, [input, loading, messages, addMessage, buildContextInput, updateCoach, activePlan, setStoreInsights]);

  const currentAiState = AI_STATES[aiStateIndex];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg.primary }}>
      <StatusBar barStyle="light-content" />

      {/* HERO HEADER */}
      <LinearGradient
        colors={theme.colors.gradient.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerHero, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.aiOrb}>
              <View style={styles.aiOrbInner} />
              <View style={[styles.aiOrbRing, { opacity: 0.20 }]} />
              <View style={[styles.aiOrbRing, styles.aiOrbRing2, { opacity: 0.10 }]} />
            </View>
            <Text style={styles.headerTitle}>FitAI Coach</Text>
            <View style={styles.headerStatusRow}>
              <PulseDot color={currentAiState.color} size={6} ringSize={14} />
              <Text style={styles.headerStatus}>{currentAiState.label}</Text>
            </View>
          </View>
          <ModeBadge mode="ai_trainer" onPress={() => router.push('/settings/mode-switcher')} />
        </View>

        {/* Overlap row */}
        <View style={styles.headerPillRow}>
          <View style={styles.headerPill}>
            <Feather name="calendar" size={11} color="#FFFFFF" />
            <Text style={styles.headerPillText}>
              {activePlan ? `Week ${activePlan.weekNumber}` : 'Consultation'}
            </Text>
          </View>
          <View style={styles.headerPill}>
            <Feather name={activePlan ? 'zap' : 'message-circle'} size={11} color="#FFFFFF" />
            <Text style={styles.headerPillText}>{activePlan ? 'Plan Active' : 'Building'}</Text>
          </View>
          <View style={styles.headerPill}>
            <Feather name="check-circle" size={11} color="#FFFFFF" />
            <Text style={styles.headerPillText}>Check-In Ready</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={renderChatItem}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={
            <View style={{ marginTop: 24 }}>
              {storeInsights.length > 0 && messages.length <= 1 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.quickLabel}>Quick Insights</Text>
                  {storeInsights.slice(0, 2).map((card, i) => {
                    let type: 'nutrition' | 'recovery' | 'coach' | 'motivation' | 'warning' = 'coach';
                    if (card.type === 'nutrition') type = 'nutrition';
                    else if (card.type === 'recovery' || card.type === 'streak') type = 'recovery';
                    else if (card.type === 'fatigue' || card.type === 'weight') type = 'warning';
                    else if (card.type === 'motivation') type = 'motivation';
                    return (
                      <View key={card.id} style={{ marginBottom: 8 }}>
                        <InsightCardUI
                          type={type}
                          text={card.body}
                          action="Open →"
                          onPress={() => {}}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          }
          ListFooterComponent={
            <View style={{ paddingBottom: 8 }}>
              {loading && <TypingDots />}
              {showQuickActions && !loading && quickActions.length > 0 && (
                <Animated.View entering={FadeInUp.duration(300)} style={{ marginTop: 16 }}>
                  <Text style={styles.quickLabel}>Quick actions</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
                  >
                    {quickActions.map((a) => (
                      <QuickActionPill key={a.id} action={a} handleSend={handleSend} />
                    ))}
                  </ScrollView>
                </Animated.View>
              )}
            </View>
          }
        />

        {/* Activate plan CTA */}
        {showActivateBtn && parsedPlan && !loading && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.ctaBar}>
            <View style={styles.ctaInfo}>
              <View style={[styles.ctaIcon, { backgroundColor: theme.colors.primarySoft }]}>
                <Feather name="zap" size={14} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.ctaTitle}>Plan Ready</Text>
                <Text style={styles.ctaSub}>{parsedPlan.goal} · {parsedPlan.splitType}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => { setShowActivateBtn(false); setActivationVisible(true); }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>Activate</Text>
              <Feather name="arrow-right" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {showWorkoutBtn && activePlan && !loading && (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.ctaBar}>
            <View style={styles.ctaInfo}>
              <View style={[styles.ctaIcon, { backgroundColor: theme.colors.successSoft }]}>
                <Feather name="play" size={14} color={theme.colors.success} />
              </View>
              <View>
                <Text style={styles.ctaTitle}>Ready to Train?</Text>
                <Text style={styles.ctaSub}>
                  {activePlan.workoutDays?.filter((d) => !d.isRest).length || 'Plan'} exercises
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: theme.colors.success }]}
              onPress={() => { setShowWorkoutBtn(false); router.push('/(ai-trainer)/workout'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>Start</Text>
              <Feather name="arrow-right" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* INPUT BAR */}
        <View style={[styles.inputBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {BlurViewIOS ? (
            <BlurViewIOS intensity={20} tint="light" style={styles.inputBlur}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask your coach..."
                  placeholderTextColor={theme.colors.text.muted}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !input.trim() && styles.sendBtnInactive]}
                  onPress={() => handleSend()}
                  disabled={!input.trim() || loading}
                >
                  <Feather
                    name="arrow-up"
                    size={20}
                    color={input.trim() ? '#FFFFFF' : theme.colors.text.muted}
                  />
                </TouchableOpacity>
              </View>
            </BlurViewIOS>
          ) : (
            <View style={[styles.inputBlur, styles.inputBlurAndroid]}>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask your coach..."
                  placeholderTextColor={theme.colors.text.muted}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !input.trim() && styles.sendBtnInactive]}
                  onPress={() => handleSend()}
                  disabled={!input.trim() || loading}
                >
                  <Feather
                    name="arrow-up"
                    size={20}
                    color={input.trim() ? '#FFFFFF' : theme.colors.text.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {parsedPlan && (
        <PlanActivationScreen
          visible={activationVisible}
          plan={parsedPlan}
          onComplete={() => { setActivationVisible(false); setShowActivateBtn(false); setParsedPlan(null); }}
          onDismiss={() => setActivationVisible(false)}
          navigateToTrain={() => { setActivationVisible(false); setShowActivateBtn(false); setParsedPlan(null); router.push('/(ai-trainer)/train'); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerHero: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: theme.font.size.title,
    fontWeight: '700',
    marginTop: 10,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: theme.font.size.caption,
    fontWeight: '500',
  },
  aiOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiOrbInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  aiOrbRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  aiOrbRing2: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  headerPillRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  headerPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  chatContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  coachBubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '90%',
    alignSelf: 'flex-start',
    gap: 8,
  },
  aiAvatarBubble: {
    marginBottom: 4,
  },
  coachBubble: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 14,
    ...theme.shadow.card,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiLabelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  aiLabel: {
    color: theme.colors.primary,
    fontSize: theme.font.size.micro,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  coachText: {
    fontSize: theme.font.size.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  userBubbleWrap: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
  },
  userBubble: {
    borderRadius: 20,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: {
    fontSize: theme.font.size.body,
    color: '#FFFFFF',
    lineHeight: 22,
    fontWeight: '500',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    alignSelf: 'flex-start',
  },
  typingDotsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 5,
    ...theme.shadow.card,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  quickLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.font.size.micro,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
  },
  quickActionText: {
    fontSize: theme.font.size.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#F0EEFC',
    marginHorizontal: 0,
  },
  ctaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  ctaSub: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.secondary,
    marginTop: 1,
    fontWeight: '500',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  ctaBtnText: {
    fontSize: theme.font.size.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inputBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputBlur: {
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: theme.colors.primaryGlow,
    ...theme.shadow.float,
    overflow: 'hidden',
  },
  inputBlurAndroid: {
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    fontSize: theme.font.size.body,
    color: theme.colors.text.primary,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.soft,
  },
  sendBtnInactive: {
    backgroundColor: theme.colors.surfaceTint,
    shadowOpacity: 0,
  },
});
