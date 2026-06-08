import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StatusBar, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { signOutUser, getCurrentUserProfile } from '@/lib/auth';
import { useUserStore } from '@/store/userStore';
import { useProfileStore } from '@/store/profileStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useTheme } from '@/components/ThemeProvider';
import SectionHeader from '@/components/ui/SectionHeader';

import ProfileHero from '@/components/ui/profile/ProfileHero';
import AthleteIdentityCard from '@/components/ui/profile/AthleteIdentityCard';
import BodyGoalMetrics from '@/components/ui/profile/BodyGoalMetrics';
import FitnessJourney from '@/components/ui/profile/FitnessJourney';
import Achievements from '@/components/ui/profile/Achievements';
import SettingsPersonalization from '@/components/ui/profile/SettingsPersonalization';

const HEALTH_AWARE_KEY = '@fitai_health_aware_coaching';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const { workoutLogs, fetchWorkoutLogs } = useWorkoutStore();
  const { calorieGoal } = useNutritionStore();
  const {
    achievements, milestones, recoveryLogs, activityDays,
    fetchAll,
  } = useProfileStore();

  const [healthAware, setHealthAware] = React.useState(false);
  const [selectedConditions, setSelectedConditions] = React.useState<string[]>([]);

  const refreshUserProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const fresh = await getCurrentUserProfile(user.id);
      setUser(fresh);
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  }, [user?.id, setUser]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        refreshUserProfile();
        fetchAll(user.id);
        fetchWorkoutLogs(user.id);
      }
    }, [user?.id, fetchAll, fetchWorkoutLogs, refreshUserProfile])
  );

  useEffect(() => {
    AsyncStorage.getItem(HEALTH_AWARE_KEY).then((val) => {
      setHealthAware(val === 'true');
    });
    if (user?.health_profile?.conditions) {
      setSelectedConditions(user.health_profile.conditions);
    }
  }, [user?.health_profile?.conditions]);

  const onRefresh = useCallback(async () => {
    if (user?.id) await fetchAll(user.id);
  }, [user?.id, fetchAll]);

  const currentStreak = useMemo(() => {
    if (!workoutLogs?.length) return 0;
    const uniqueDays = new Set<string>();
    workoutLogs.forEach((log) => {
      uniqueDays.add(log.logged_at.slice(0, 10));
    });
    const sorted = [...uniqueDays].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (sorted[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [workoutLogs]);

  const journeyEntries = useMemo(() => milestones.map((m) => ({
    id: m.id,
    icon: (m.icon || 'check-circle') as React.ComponentProps<typeof Feather>['name'],
    title: m.title,
    subtitle: m.subtitle,
    date: new Date(m.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    color: theme.colors.primary,
  })), [milestones]);

  const achievementItems = useMemo(() => achievements.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    rarity: a.rarity,
  })), [achievements]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try {
            await signOutUser();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
          router.replace('/(auth)/login');
        },
      },
    ]);
  }, [router]);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg.primary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isAiTrainer = user.app_mode === 'ai_trainer';

  const identityMetrics = [
    {
      icon: 'activity' as const,
      label: 'WEIGHT',
      value: user.health_profile?.weight ? `${user.health_profile.weight}${user.health_profile.weightUnit === 'lbs' ? 'lb' : 'kg'}` : '—',
      color: theme.colors.primary,
      softColor: theme.colors.primarySoft,
      gradient: [theme.colors.primarySoft, '#FFFFFF'] as [string, string],
    },
    {
      icon: 'award' as const,
      label: 'STREAK',
      value: `${currentStreak} day${currentStreak !== 1 ? 's' : ''}`,
      color: theme.colors.warning,
      softColor: theme.colors.warningSoft,
      gradient: [theme.colors.warningSoft, '#FFFFFF'] as [string, string],
    },
    {
      icon: 'heart' as const,
      label: 'CONSISTENCY',
      value: activityDays.filter((d) => d.workout_completed).length > 0 ? `${Math.round(activityDays.filter((d) => d.workout_completed).length / Math.max(activityDays.length, 1) * 100)}%` : '—',
      color: theme.colors.success,
      softColor: theme.colors.successSoft,
      gradient: [theme.colors.successSoft, '#FFFFFF'] as [string, string],
    },
  ];

  const bodyStats: {
    icon: React.ComponentProps<typeof Feather>['name'];
    label: string;
    value: string;
    color?: string;
  }[] = [
    { icon: 'maximize', label: 'Height', value: user.health_profile?.height ? `${user.health_profile.height} ${user.health_profile.heightUnit}` : '—', color: theme.colors.primary },
    { icon: 'activity', label: 'Weight', value: user.health_profile?.weight ? `${user.health_profile.weight}${user.health_profile.weightUnit === 'lbs' ? 'lb' : 'kg'}` : '—', color: theme.colors.primary },
    { icon: 'calendar', label: 'Age', value: user.health_profile?.age ? `${user.health_profile.age}` : '—', color: theme.colors.primary },
    { icon: 'zap', label: 'Calories', value: `${calorieGoal} kcal`, color: theme.colors.warning },
    { icon: 'droplet', label: 'Water', value: `${user.goals?.water || 8} glasses`, color: '#60A5FA' },
    { icon: 'target', label: 'Goal', value: user.health_profile?.goal ? user.health_profile.goal.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Set goal', color: theme.colors.success },
  ];

  const latestRecovery = recoveryLogs[0];
  const recoveryMetrics: { icon: 'activity' | 'moon' | 'heart'; label: string; value: string; status: 'good' | 'moderate' | 'low' }[] = [
    { icon: 'activity', label: 'Stress', value: latestRecovery?.stress_level ? `${latestRecovery.stress_level}/10` : '—', status: (latestRecovery?.stress_level && latestRecovery.stress_level <= 4 ? 'good' : latestRecovery?.stress_level && latestRecovery.stress_level <= 7 ? 'moderate' : 'low') as 'good' | 'moderate' | 'low' },
    { icon: 'moon', label: 'Sleep', value: latestRecovery?.sleep_hours ? `${latestRecovery.sleep_hours}h` : '—', status: (latestRecovery?.sleep_hours && latestRecovery.sleep_hours >= 7 ? 'good' : latestRecovery?.sleep_hours && latestRecovery.sleep_hours >= 5 ? 'moderate' : 'low') as 'good' | 'moderate' | 'low' },
    { icon: 'heart', label: 'Fatigue', value: latestRecovery?.fatigue ? `${latestRecovery.fatigue}/10` : '—', status: (latestRecovery?.fatigue && latestRecovery.fatigue <= 3 ? 'good' : latestRecovery?.fatigue && latestRecovery.fatigue <= 6 ? 'moderate' : 'low') as 'good' | 'moderate' | 'low' },
  ];

  const settingsItems = [
    { icon: 'user' as const, label: 'Account', subtitle: 'Name, bio, fitness profile', color: theme.colors.primary, onPress: () => router.push('/modals/edit-settings' as never) },
    { icon: 'droplet' as const, label: 'Daily Water Goal', subtitle: `${user.goals?.water || 8} glasses`, color: '#60A5FA', onPress: () => router.push('/modals/edit-settings' as never) },
    { icon: 'bell' as const, label: 'Notifications', subtitle: 'Push and in-app reminders', color: theme.colors.warning, onPress: () => Alert.alert('Coming Soon', 'Notifications coming soon.') },
    { icon: 'bar-chart-2' as const, label: 'Progress', subtitle: 'View your transformation', color: theme.colors.primary, onPress: () => router.push('/(tabs)/stats' as never) },
    { icon: 'download' as const, label: 'Export Data', subtitle: 'Download your fitness data', color: theme.colors.text.muted, onPress: () => Alert.alert('Coming Soon', 'Data export coming soon.') },
    { icon: 'help-circle' as const, label: 'Support', subtitle: 'Help, FAQ, and contact', color: theme.colors.text.muted, onPress: () => Alert.alert('Coming Soon', 'Support page coming soon.') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg.primary }}>
      <StatusBar barStyle={user?.dark_mode ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <ProfileHero
          name={user.name}
          avatarUrl={(user as any).avatar_url}
          goal={user.health_profile?.goal}
          fitnessMode={isAiTrainer ? 'AI Trainer' : user.health_profile?.experience_level || undefined}
          currentWeek={1}
          totalWeeks={12}
          motivationalSubtitle={
            isAiTrainer
              ? 'Your AI-powered training journey'
              : workoutLogs?.length > 10
                ? 'Consistency is your superpower.'
                : 'Building momentum, one day at a time.'
          }

          onAvatarPress={() => router.push('/modals/edit-settings' as never)}
        />

        <View style={{ marginTop: 24, marginBottom: 12 }}>
          <SectionHeader title="Athlete Identity" />
        </View>
        <AthleteIdentityCard metrics={identityMetrics} />

        <View style={{ marginTop: 28, marginBottom: 12 }}>
          <SectionHeader title="Body & Goals" />
        </View>
        <BodyGoalMetrics stats={bodyStats} />

        {journeyEntries.length > 0 && (
          <>
            <View style={{ marginTop: 28, marginBottom: 12 }}>
              <SectionHeader title="Your Journey" />
            </View>
            <FitnessJourney entries={journeyEntries} />
          </>
        )}

        {achievementItems.length > 0 && (
          <>
            <View style={{ marginTop: 28, marginBottom: 12 }}>
              <SectionHeader title="Achievements" />
            </View>
            <Achievements items={achievementItems} />
          </>
        )}

        <View style={{ marginTop: 28, marginBottom: 12 }}>
          <SectionHeader title="Settings" />
        </View>
        <SettingsPersonalization items={settingsItems} onSignOut={handleSignOut} />

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


