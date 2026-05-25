import { useEffect } from 'react';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';

export default function OnboardingLayout() {
  useEffect(() => {
    AsyncStorage.getItem('@onboarding_step').then(step => {
      if (step) {
        useUserStore.getState().setOnboardingStep(parseInt(step));
      }
    });
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
