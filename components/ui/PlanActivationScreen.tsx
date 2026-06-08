import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
} from 'react-native';
import Animated, { FadeInUp, FadeOutDown, useAnimatedStyle, withTiming, withDelay, useSharedValue, runOnJS } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAiTrainerStore, type ActivePlan } from '@/store/aiTrainerStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { savePlan, generatePlanId } from '@/lib/aiTrainerPlanManager';

interface ActivationStep {
  icon: string;
  label: string;
  detail: string;
}

const STEPS: ActivationStep[] = [
  { icon: 'zap', label: 'Building training structure', detail: 'Organizing your split, exercises, and weekly layout' },
  { icon: 'activity', label: 'Syncing recovery targets', detail: 'Aligning volume, intensity, and recovery protocols' },
  { icon: 'pie-chart', label: 'Setting nutrition targets', detail: 'Calories, macros, and meal timing optimized' },
  { icon: 'bar-chart-2', label: 'Mapping progression', detail: 'Establishing overload strategy and adaptation rules' },
  { icon: 'check-circle', label: 'Activating adaptive coaching', detail: 'Your plan is now live and AI-coached' },
];

interface Props {
  visible: boolean;
  plan: ActivePlan;
  onComplete: () => void;
  onDismiss: () => void;
  navigateToTrain?: () => void;
}

function StepRow({ step, index, active, done }: { step: ActivationStep; index: number; active: boolean; done: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (!active) return;
    opacity.value = withDelay(index * 600, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(index * 600, withTiming(0, { duration: 400 }));
  }, [active, index, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.stepRow, animStyle]}>
      <View style={[styles.stepIconWrap, done && styles.stepIconDone, active && !done && styles.stepIconActive]}>
        {done ? (
          <Feather name="check" size={18} color="#0A0A0A" />
        ) : (
          <Feather name={step.icon as any} size={18} color={active ? '#C8FF00' : '#555'} />
        )}
      </View>
      <View style={styles.stepTextWrap}>
        <Text style={[styles.stepLabel, done && styles.stepLabelDone, active && !done && styles.stepLabelActive]}>
          {step.label}
        </Text>
        <Text style={styles.stepDetail}>{step.detail}</Text>
      </View>
      {!done && active && (
        <View style={styles.pulseDot}>
          <View style={styles.pulseInner} />
        </View>
      )}
    </Animated.View>
  );
}

export default function PlanActivationScreen({ visible, plan, onComplete, onDismiss, navigateToTrain }: Props) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [completed, setCompleted] = useState(false);
  const { setActivePlan, addPlanToHistory, setPhase } = useAiTrainerStore();
  const { setCalorieGoal } = useNutritionStore();

  const finalizePlan = useCallback(async () => {
    try {
      const activePlan: ActivePlan = {
        ...plan,
        phase: 'plan_active',
        appliedAt: new Date().toISOString(),
        currentWeek: 1,
        weekNumber: 1,
      };
      setActivePlan(activePlan);
      addPlanToHistory(activePlan);
      setPhase('plan_active');
      try { setCalorieGoal(activePlan.calorieTarget); } catch {}
      try {
        const { savePlan } = await import('@/lib/aiTrainerPlanManager');
        await savePlan(activePlan);
      } catch (e) {
        console.warn('[activation] persist failed:', e);
      }
    } catch (e) {
      console.error('[activation] finalize failed:', e);
    }
  }, [plan, setActivePlan, addPlanToHistory, setPhase, setCalorieGoal]);

  const runSteps = useCallback(async () => {
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise<void>(resolve => {
        setCurrentStep(i);
        setTimeout(resolve, 700);
      });
    }
    setCompleted(true);
    await finalizePlan();
    setTimeout(() => {
      onComplete();
    }, 600);
  }, [onComplete, finalizePlan]);

  useEffect(() => {
    if (!visible) {
      setCurrentStep(-1);
      setCompleted(false);
      return;
    }
    const timer = setTimeout(runSteps, 400);
    return () => clearTimeout(timer);
  }, [visible, runSteps]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <LinearGradient colors={['#0A0A0A', '#1a0a2e', '#0A0A0A']} style={styles.root}>
        {!completed && (
          <Animated.View entering={FadeInUp.duration(500)} style={styles.topSection}>
            <View style={styles.badge}>
              <Feather name="cpu" size={14} color="#C8FF00" />
              <Text style={styles.badgeText}>PULSE AI</Text>
            </View>
            <Text style={styles.title}>Building Your Plan</Text>
            <Text style={styles.subtitle}>
              {plan.goal} · {plan.splitType}
            </Text>
          </Animated.View>
        )}

        <View style={styles.stepsContainer}>
          {STEPS.map((step, i) => (
            <StepRow
              key={step.label}
              step={step}
              index={i}
              active={currentStep >= i && !completed}
              done={currentStep > i || completed}
            />
          ))}
        </View>

        {completed && (
          <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.completeSection}>
            <LinearGradient colors={['#C8FF00', '#A0E000']} style={styles.completeIcon}>
              <Feather name="zap" size={32} color="#0A0A0A" />
            </LinearGradient>
            <Text style={styles.completeTitle}>Plan Activated</Text>
            <Text style={styles.completeSub}>
              Your AI coaching plan is now live. The Training Plan tab will show your personalized split.
            </Text>
            <TouchableOpacity
              style={styles.goBtn}
              onPress={async () => {
                setCompleted(false);
                await finalizePlan();
                if (navigateToTrain) navigateToTrain();
                else onComplete();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.goBtnText}>View My Plan</Text>
              <Feather name="arrow-right" size={18} color="#0A0A0A" />
            </TouchableOpacity>
          </Animated.View>
        )}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  topSection: { alignItems: 'center', marginBottom: 40 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(200,255,0,0.1)', marginBottom: 16,
  },
  badgeText: { fontSize: 11, color: '#C8FF00', fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#F5F5F5', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#A78BFA' },
  stepsContainer: { width: '100%', gap: 0, maxWidth: 340 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  stepIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepIconDone: { backgroundColor: '#C8FF00' },
  stepIconActive: { backgroundColor: 'rgba(200,255,0,0.15)', borderWidth: 1, borderColor: 'rgba(200,255,0,0.3)' },
  stepTextWrap: { flex: 1 },
  stepLabel: { fontSize: 14, fontWeight: '600', color: '#555' },
  stepLabelDone: { color: '#C8FF00' },
  stepLabelActive: { color: '#F5F5F5' },
  stepDetail: { fontSize: 11, color: '#7A7A7A', marginTop: 2 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(200,255,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  pulseInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C8FF00' },
  completeSection: { alignItems: 'center', gap: 16, marginTop: 20 },
  completeIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  completeTitle: { fontSize: 24, fontWeight: '800', color: '#F5F5F5' },
  completeSub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  goBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#C8FF00', marginTop: 8,
  },
  goBtnText: { fontSize: 16, fontWeight: '700', color: '#0A0A0A' },
});
