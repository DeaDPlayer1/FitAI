import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import OnboardingShell from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import { updateUserProfile } from '@/lib/auth';
import { theme } from '@/constants/theme';

interface PermissionItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
}

const PERMISSIONS: PermissionItem[] = [
  { id: 'camera', name: 'Camera', desc: 'For form detection & progress photos', icon: 'camera', color: theme.COLORS.warning },
  { id: 'microphone', name: 'Microphone', desc: 'For voice food logging', icon: 'mic', color: theme.COLORS.success },
  { id: 'health', name: 'Health Data', desc: 'Sync steps from Apple Health / Google Fit', icon: 'heart', color: theme.COLORS.primary },
  { id: 'notifications', name: 'Notifications', desc: 'Get reminders for meals and workouts', icon: 'notifications', color: theme.COLORS.purple },
];

export default function Step4Permissions() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleAllow = (id: string) => {
    setGranted((prev) => new Set([...prev, id]));
  };

  const requiredGranted = granted.has('camera') && granted.has('microphone');

  const handleFinish = async () => {
    if (!user) return;
    AsyncStorage.removeItem('@onboarding_step').catch(() => {});
    setLoading(true);
    try {
      await updateUserProfile(user.id, {
        onboarding_complete: true,
        health_profile: user.health_profile,
        name: user.name,
      });
      setUser({ ...user, onboarding_complete: true });
      Alert.alert('🎉 FitAI is ready for you!', 'Your personalized fitness journey starts now.');
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingShell
        step={4}
        title="Let's set FitAI up"
        subtitle="Allow these for the full experience"
        showSkip={false}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {PERMISSIONS.map((perm) => {
            const isGranted = granted.has(perm.id);
            return (
              <View key={perm.id} style={[styles.permCard, isGranted && styles.permCardGranted]}>
                <View style={[styles.iconCircle, { backgroundColor: perm.color + '15' }]}>
                  <Ionicons name={perm.icon as any} size={24} color={perm.color} />
                </View>
                <View style={styles.permTextCol}>
                  <Text style={styles.permName}>{perm.name}</Text>
                  <Text style={styles.permDesc}>{perm.desc}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleAllow(perm.id)}
                  disabled={isGranted}
                  style={[styles.allowBtn, isGranted && styles.allowBtnGranted]}
                >
                  {isGranted ? (
                    <Ionicons name="checkmark-circle" size={24} color={theme.COLORS.success} />
                  ) : (
                    <Text style={styles.allowBtnText}>Allow</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={styles.bottomSection}>
            <PrimaryButton
              label="Let's Go"
              onPress={handleFinish}
              loading={loading}
              disabled={!requiredGranted}
              style={{ height: 56 }}
            />
            {!requiredGranted && (
              <View style={styles.hintBox}>
                <Ionicons name="information-circle-outline" size={14} color={theme.TEXT.muted} />
                <Text style={styles.hint}>
                  Camera and Microphone are required
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </OnboardingShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.BACKGROUND.page },
  scroll: { paddingBottom: 40 },
  permCard: {
    backgroundColor: theme.BACKGROUND.input,
    borderRadius: theme.RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.SPACING.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  permCardGranted: {
    backgroundColor: 'white',
    borderColor: theme.BACKGROUND.cardBorder,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTextCol: {
    flex: 1,
  },
  permName: {
    color: theme.TEXT.primary,
    fontSize: theme.FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  permDesc: {
    color: theme.TEXT.secondary,
    fontSize: theme.FONT_SIZE.sm - 1,
    lineHeight: 18,
  },
  allowBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: theme.RADIUS.pill,
    backgroundColor: theme.COLORS.primary,
    minWidth: 70,
    alignItems: 'center',
  },
  allowBtnGranted: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    minWidth: 0,
  },
  allowBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  bottomSection: {
    marginTop: theme.SPACING.xl,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: theme.SPACING.md,
  },
  hint: {
    color: theme.TEXT.muted,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
