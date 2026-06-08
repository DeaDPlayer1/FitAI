import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, AppState, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { useWorkoutTrackingStore } from '@/store/workoutTrackingStore';
import { useUserStore } from '@/store/userStore';
import { useModeStore } from '@/store/modeStore';
import { updateUserProfile } from '@/lib/auth';
import ModeTransition from '@/components/ModeTransition';

type AppMode = 'normal' | 'ai_trainer';

function ModeCard({
  mode,
  label,
  description,
  icon,
  features,
  isActive,
  isSelected,
  onPress,
  isAi,
  lime = '#C8FF00',
}: {
  mode: AppMode;
  label: string;
  description: string;
  icon: string;
  features: string[];
  isActive: boolean;
  isSelected: boolean;
  onPress: () => void;
  isAi?: boolean;
  lime?: string;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.01, { damping: 16 }, () => {
      scale.value = withSpring(1, { damping: 16 });
    });
    onPress();
  };

  const borderColor = isActive
    ? (isAi ? lime : '#F5F5F5')
    : isSelected
    ? (isAi ? lime : '#F5F5F5')
    : '#2A2A2A';

  const borderWidth = isActive ? 2 : isSelected ? 2 : 1;

  return (
    <Animated.View style={cardStyle}>
      <TouchableOpacity
        style={[
          styles.card,
          isAi && styles.aiCard,
          { borderColor, borderWidth },
          isSelected && isAi && styles.aiCardSelected,
        ]}
        onPress={handlePress}
        activeOpacity={0.95}
      >
        {isActive && (
          <View style={[styles.activeBadge, { backgroundColor: isAi ? lime : '#F5F5F5' }]}>
            <Text style={[styles.activeBadgeText, { color: '#0A0A0A' }]}>ACTIVE</Text>
          </View>
        )}
        <View style={[styles.cardIcon, { backgroundColor: isAi ? lime : '#1C1C1C' }]}>
          <Feather name={icon as any} size={20} color={isAi ? '#0A0A0A' : '#F5F5F5'} />
        </View>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{label}</Text>
          {isAi && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardDesc}>{description}</Text>
        <View style={styles.pillRow}>
          {features.map((f) => (
            <View key={f} style={[styles.pill, isAi && { borderColor: `${lime}99`, borderWidth: 0.5 }]}>
              <Text style={[styles.pillText, isAi && { color: lime }]}>{f}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ModeSwitcher() {
  const router = useRouter();
  const { appMode, setMode } = useModeStore();
  const { user, setUser } = useUserStore();
  const [selected, setSelected] = useState<AppMode | null>(null);
  const [transitionVisible, setTransitionVisible] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<AppMode>('normal');

  const confirmTranslateY = useSharedValue(80);
  const confirmOpacity = useSharedValue(0);

  const handleSelect = useCallback((mode: AppMode) => {
    if (mode === appMode) return;
    setSelected(mode);
    confirmTranslateY.value = withSpring(0, { damping: 16, stiffness: 140 });
    confirmOpacity.value = withTiming(1, { duration: 200 });
  }, [appMode]);

  const confirmStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: confirmTranslateY.value }],
    opacity: confirmOpacity.value,
  }));

  const handleConfirm = useCallback(async () => {
    if (!selected || selected === appMode) return;

    const trackingStore = useWorkoutTrackingStore.getState();
    if (trackingStore.sessionId) {
      Alert.alert(
        'Active Session',
        'Finish your active workout session before switching modes.',
        [
          { text: 'End Without Saving', style: 'destructive', onPress: () => trackingStore.endWorkout() },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setTransitionTarget(selected);
    setTransitionVisible(true);
  }, [selected, appMode]);

  const handleMidpoint = useCallback(async () => {
    if (!selected || !user) return;
    try {
      await updateUserProfile(user.id, { app_mode: selected });
      setUser({ ...user, app_mode: selected });
      await setMode(selected);
    } catch (e) {
      console.error('Mode switch DB error:', e);
      setTransitionVisible(false);
      Alert.alert('Error', "Couldn't switch modes. Check your connection.");
    }
  }, [selected, user, setMode, setUser]);

  const handleComplete = useCallback(() => {
    setTransitionVisible(false);
    router.replace((selected === 'normal' ? '/(tabs)' : '/(ai-trainer)') as any);
  }, [selected, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#F5F5F5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>App Mode</Text>
          <View style={{ width: 22 }} />
        </View>
        <Text style={styles.headerSub}>Choose how you want to train</Text>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <ModeCard
            mode="normal"
            label="Normal Mode"
            description="Log workouts and meals your way. Full manual control."
            icon="grid"
            features={['Manual Control', 'Custom Plans', 'Your Pace']}
            isActive={appMode === 'normal'}
            isSelected={selected === 'normal'}
            onPress={() => handleSelect('normal')}
          />
          <ModeCard
            mode="ai_trainer"
            label="AI Trainer Mode"
            description="AI builds your plan, tracks weekly progress, adapts automatically."
            icon="zap"
            features={['AI Plan', 'Weekly Check-ins', 'Adaptive Coaching']}
            isActive={appMode === 'ai_trainer'}
            isSelected={selected === 'ai_trainer'}
            isAi
            onPress={() => handleSelect('ai_trainer')}
          />
        </ScrollView>

        <Animated.View style={[styles.confirmContainer, confirmStyle]}>
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              { backgroundColor: selected === 'ai_trainer' ? '#C8FF00' : '#F5F5F5' },
            ]}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Text style={[styles.confirmText, { color: '#0A0A0A' }]}>
              Switch to {selected === 'ai_trainer' ? 'AI Trainer' : 'Normal Mode'}
            </Text>
            {selected === 'ai_trainer' && (
              <Feather name="zap" size={16} color="#0A0A0A" />
            )}
          </TouchableOpacity>
          <Text style={styles.fineprint}>Your logs and data are always saved.</Text>
        </Animated.View>
      </SafeAreaView>

      <ModeTransition
        visible={transitionVisible}
        targetMode={transitionTarget}
        onMidpoint={handleMidpoint}
        onComplete={handleComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#F5F5F5', letterSpacing: 0.5 },
  headerSub: { fontSize: 14, color: '#7A7A7A', paddingHorizontal: 16, marginBottom: 8 },
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  aiCard: {
    backgroundColor: '#141414',
  },
  aiCardSelected: {
    shadowColor: '#C8FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '600' },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#F5F5F5' },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'rgba(200,255,0,0.4)',
  },
  premiumText: { fontSize: 9, color: '#C8FF00', fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#7A7A7A', lineHeight: 20, marginTop: 4 },
  pillRow: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  pillText: { fontSize: 10, color: '#7A7A7A' },
  confirmContainer: {
    padding: 16,
    paddingBottom: 32,
    marginTop: 'auto',
    gap: 8,
  },
  confirmBtn: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmText: { fontSize: 16, fontWeight: '700' },
  fineprint: { fontSize: 12, color: '#7A7A7A', textAlign: 'center' },
});
