import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, StatusBar, Alert, Dimensions, Pressable, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Card from '@/components/ui/Card';
import { FadeInView } from '@/components/ui/FadeInView';
import ConsistencyHeatmap from '@/components/ui/ConsistencyHeatmap';
import { signOutUser, updateUserProfile } from '@/lib/auth';
import { useUserStore } from '@/store/userStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { theme } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

type QuickAction = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  route?: string;
  action?: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'edit-3', label: 'Edit Profile', route: '/modals/edit-settings' },
  { icon: 'target', label: 'Goals', route: '/modals/edit-settings' },
  { icon: 'bar-chart-2', label: 'Progress', route: '/(tabs)/stats' },
  { icon: 'download', label: 'Export Data', action: 'export' },
  { icon: 'bell', label: 'Notifications', action: 'notifications' },
  { icon: 'help-circle', label: 'Support', action: 'support' },
];

const CONDITION_OPTIONS = [
  { id: 'CKD', label: 'CKD', description: 'Chronic Kidney Disease' },
  { id: 'Lupus', label: 'Lupus', description: 'Systemic Lupus Erythematosus' },
  { id: 'Diabetes', label: 'Diabetes', description: 'Type 1 or Type 2' },
  { id: 'Hypertension', label: 'Hypertension', description: 'High Blood Pressure' },
  { id: 'PCOS', label: 'PCOS', description: 'Polycystic Ovary Syndrome' },
  { id: 'Thyroid', label: 'Thyroid', description: 'Hypo/Hyperthyroidism' },
];

const HEALTH_AWARE_KEY = '@fitai_health_aware_coaching';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const { workoutLogs } = useWorkoutStore();
  const { calorieGoal, getTotalCalories, getTotalProtein } = useNutritionStore();

  const [healthAware, setHealthAware] = useState(() => user?.health_profile?.conditions && user.health_profile.conditions.length > 0);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [healthSettingsLoaded, setHealthSettingsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(HEALTH_AWARE_KEY).then(val => {
      setHealthAware(val === 'true');
    });
    if (user?.health_profile?.conditions) {
      setSelectedConditions(user.health_profile.conditions);
    }
    setHealthSettingsLoaded(true);
  }, [user?.health_profile?.conditions]);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const workoutDates = workoutLogs.map(log => log.logged_at);

  const handleQuickAction = (item: QuickAction) => {
    if (item.route) {
      router.push(item.route as never);
    } else if (item.action) {
      Alert.alert('Coming Soon', `${item.label} will be available in a future update.`);
    }
  };

  const toggleHealthAware = async (value: boolean) => {
    setHealthAware(value);
    await AsyncStorage.setItem(HEALTH_AWARE_KEY, String(value));
  };

  const toggleCondition = async (conditionId: string) => {
    const currentUser = useUserStore.getState().user;
    if (!currentUser?.id) return;
    const prev = selectedConditions;
    const updated = prev.includes(conditionId)
      ? prev.filter(c => c !== conditionId)
      : [...prev, conditionId];
    setSelectedConditions(updated);
    setConditionsLoading(true);
    try {
      await updateUserProfile(currentUser.id, {
        ...currentUser,
        health_profile: {
          ...currentUser.health_profile,
          conditions: updated,
        },
      } as any);
      useUserStore.getState().setUser({
        ...currentUser,
        health_profile: {
          ...currentUser.health_profile,
          conditions: updated,
        },
      });
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save conditions');
      setSelectedConditions(prev);
    } finally {
      setConditionsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutUser();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
        >
          <Feather name="settings" size={22} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView>
          {/* Profile Identity */}
          <View style={styles.identitySection}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>{initials}</Text>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.name}>{user?.name || 'User'}</Text>
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>
                  {(user?.health_profile?.goal || 'General Fitness').replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/modals/edit-settings')}>
              <Card style={styles.statCard} padding={16}>
                <Text style={styles.statValue}>{user?.health_profile?.weight || '--'}</Text>
                <Text style={styles.statLabel}>{user?.health_profile?.weightUnit || 'kg'}</Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/modals/edit-settings')}>
              <Card style={styles.statCard} padding={16}>
                <Text style={styles.statValue}>{user?.health_profile?.height || '--'}</Text>
                <Text style={styles.statLabel}>{user?.health_profile?.heightUnit || 'cm'}</Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCardWrapper} onPress={() => router.push('/modals/edit-settings')}>
              <Card style={styles.statCard} padding={16}>
                <Text style={styles.statValue}>{user?.health_profile?.age || '--'}</Text>
                <Text style={styles.statLabel}>Years</Text>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((item) => (
                <Pressable
                  key={item.label}
                  style={styles.quickActionItem}
                  onPress={() => handleQuickAction(item)}
                  delayPressIn={100}
                >
                  <View style={styles.quickActionIconCircle}>
                    <Feather name={item.icon} size={20} color={theme.colors.accent.brand} />
                  </View>
                  <Text style={styles.quickActionLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Consistency Heatmap */}
          <View style={styles.section}>
            <ConsistencyHeatmap workoutDates={workoutDates} />
          </View>

          {/* Nutrition Macros Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Nutrition</Text>
            <Card padding={20} style={styles.nutritionCard}>
              <View style={styles.macroRow}>
                <View style={styles.macroCol}>
                  <Text style={styles.macroVal}>{getTotalCalories()}</Text>
                  <Text style={styles.macroSub}>of {calorieGoal} kcal</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroCol}>
                  <Text style={styles.macroVal}>{getTotalProtein()}g</Text>
                  <Text style={styles.macroSub}>Protein</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Health Conditions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Conditions</Text>
            <Card padding={20} style={styles.healthCard}>
              <View style={styles.healthToggleRow}>
                <View style={styles.healthToggleInfo}>
                  <Feather name="heart" size={20} color={theme.colors.accent.brand} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.healthToggleLabel}>Health-Aware Coaching</Text>
                    <Text style={styles.healthToggleSub}>
                      Pulse AI adapts to your conditions
                    </Text>
                  </View>
                </View>
                <Switch
                  value={healthAware}
                  onValueChange={toggleHealthAware}
                  trackColor={{ true: theme.colors.accent.primary + '60', false: '#E5E7EB' }}
                  thumbColor={healthAware ? theme.colors.accent.primary : '#FFF'}
                />
              </View>

              {healthAware && (
                <View style={styles.conditionsList}>
                  <Text style={styles.conditionsHint}>
                    Select your conditions so Pulse AI can personalize your coaching:
                  </Text>
                  {CONDITION_OPTIONS.map(option => {
                    const isSelected = selectedConditions.includes(option.id);
                    return (
                      <Pressable
                        key={option.id}
                        style={[styles.conditionItem, isSelected && styles.conditionItemActive]}
                        onPress={() => toggleCondition(option.id)}
                        disabled={conditionsLoading}
                      >
                        <View style={[styles.conditionCheckbox, isSelected && styles.conditionCheckboxActive]}>
                          {isSelected && <Feather name="check" size={12} color="white" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.conditionLabel, isSelected && styles.conditionLabelActive]}>
                            {option.label}
                          </Text>
                          <Text style={styles.conditionDesc}>{option.description}</Text>
                        </View>
                        {conditionsLoading && <ActivityIndicator size="small" color={theme.colors.accent.primary} />}
                      </Pressable>
                    );
                  })}
                  <Text style={styles.conditionsDisclaimer}>
                    This information helps Pulse AI personalize your coaching. It is not shared and does not replace medical advice.
                  </Text>
                </View>
              )}
            </Card>
          </View>

          {/* Sign Out */}
          <Pressable style={styles.logoutBtn} onPress={handleSignOut}>
            <Feather name="log-out" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>

        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.font.family.heading,
    fontWeight: '800',
    color: '#111827',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },

  identitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  avatarLarge: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: theme.colors.accent.brand, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16,
    ...theme.shadow.button,
  },
  avatarTextLarge: { color: 'white', fontSize: 28, fontFamily: theme.font.family.heading, fontWeight: '800' },
  identityText: { flex: 1 },
  name: { fontSize: 24, fontFamily: theme.font.family.heading, fontWeight: '800', color: '#111827' },
  goalBadge: { 
    marginTop: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 16, 
    backgroundColor: theme.colors.accent.lavender + '30',
    alignSelf: 'flex-start'
  },
  goalBadgeText: { fontSize: 13, fontFamily: theme.font.family.bold, color: theme.colors.accent.brand, textTransform: 'capitalize' },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCardWrapper: { flex: 1 },
  statCard: { alignItems: 'center', backgroundColor: 'white' },
  statValue: { fontSize: 20, fontFamily: theme.font.family.heading, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, fontFamily: theme.font.family.medium, color: theme.colors.text.muted, marginTop: 2 },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: '#111827',
    marginBottom: 12,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    width: (screenWidth - 44) / 2,
    flex: undefined,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...theme.shadow.soft,
  },
  quickActionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent.lavender + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.secondary,
  },
  
  nutritionCard: {
    backgroundColor: 'white',
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  macroCol: {
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 24,
    fontFamily: theme.font.family.heading,
    fontWeight: '800',
    color: '#111827',
  },
  macroSub: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  macroDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
  },

  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.accent.lavender + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: '#111827',
  },
  programMeta: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 4,
  },

  // Health Conditions
  healthCard: {
    backgroundColor: 'white',
  },
  healthToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  healthToggleLabel: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: '#111827',
  },
  healthToggleSub: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  conditionsList: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  conditionsHint: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginBottom: 12,
    lineHeight: 18,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  conditionItemActive: {
    backgroundColor: theme.colors.accent.lavender + '20',
  },
  conditionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionCheckboxActive: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  conditionLabel: {
    fontSize: 14,
    fontFamily: theme.font.family.semibold,
    color: '#111827',
  },
  conditionLabelActive: {
    color: theme.colors.accent.primary,
  },
  conditionDesc: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  conditionsDisclaimer: {
    fontSize: 11,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 16,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: '#EF4444',
  },
});
