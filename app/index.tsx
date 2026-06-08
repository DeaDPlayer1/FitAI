import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';

const HAS_ACCOUNT_KEY = '@has_account';

export default function IndexRedirect() {
  const router = useRouter();
  const { user, isAuthenticated } = useUserStore();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (resolved) return;
    const redirect = async () => {
      if (user && user.onboarding_complete && isAuthenticated) {
        const mode = user.app_mode || 'normal';
        router.replace(mode === 'ai_trainer' ? '/(ai-trainer)' : '/(tabs)');
        setResolved(true);
        return;
      }
      if (user && !user.onboarding_complete) {
        router.replace('/onboarding/welcome');
        setResolved(true);
        return;
      }
      try {
        const flag = await AsyncStorage.getItem(HAS_ACCOUNT_KEY);
        router.replace(flag === 'true' ? '/(auth)/login' : '/onboarding/welcome');
      } catch {
        router.replace('/onboarding/welcome');
      }
      setResolved(true);
    };
    redirect();
  }, [user, isAuthenticated, resolved, router]);

  return null;

  return (
    <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={styles.loading}>
      <Feather name="activity" size={48} color="#A78BFA" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
});
