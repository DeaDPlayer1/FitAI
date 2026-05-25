import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, LogBox, Animated, Easing, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { 
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold 
} from '@expo-google-fonts/inter';

import { supabase } from '@/lib/supabase';
import { getCurrentUserProfile, defaultHealthProfile } from '@/lib/auth';
import { useUserStore } from '@/store/userStore';
import { syncUserData } from '@/lib/sync';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSplitBuilderStore } from '@/store/splitBuilderStore';
import { COLORS } from '@/constants/theme';
import { initSentry, setSentryUser, clearSentryUser } from '@/lib/sentry';
import { trackEvent, identifyUser, resetAnalytics, trackScreenView } from '@/lib/analytics';
import { ErrorBoundary } from '@/utils/errorBoundary'; // PREFLIGHT FIX: wrap navigation with ErrorBoundary
import { ToastProvider } from '@/components/ui/ToastNotification';
import { setNetworkStatus } from '@/lib/network';
import { logger } from '@/lib/logger';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {/* ignore */});

// Suppress deprecation warnings for packages not yet migrated
LogBox.ignoreLogs([
  'expo-av has been deprecated', // Will migrate to expo-audio in next SDK update
]);

export const unstable_settings = {
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { user, isLoading, isAuthenticated, setUser, clearUser, setLoading } =
    useUserStore();
  const [booting, setBooting] = useState(true);

  // Load Fonts
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Listen to Supabase auth state changes
  useEffect(() => {
    logger.init();

    // FIX: Ensure local (Zustand) state is cleared on logout only (never Supabase data).
    const clearLocalStores = () => {
      useNutritionStore.getState().clearToday();
      useWorkoutStore.getState().clearChat();
      useWorkoutStore.getState().clearActiveWorkout();
      useWorkoutStore.getState().clearWorkoutLogs(); // FIX[1]: clear local workout logs on logout
      useSplitBuilderStore.getState().reset();
    };

    // FIX: Define before first use (was referenced before initialization).
    const handleAuthChange = async (session: any, retryCount = 0) => {
      if (session?.user) {
        try {
          const profile = await getCurrentUserProfile(session.user.id);
          setUser({ ...profile, email: session.user.email || profile.email });
          setSentryUser(session.user.id, session.user.email);
          identifyUser(session.user.id, { name: profile?.name || 'User' });
          trackEvent('user_logged_in');
          syncUserData(session.user.id).catch(err => console.error('[sync] Sync failed:', err));
        } catch (err) {
          console.warn(`[auth] Profile fetch failed (attempt ${retryCount + 1}):`, err);
          
          if (retryCount < 1) {
            // Wait 2 seconds and retry once before falling back
            setTimeout(() => handleAuthChange(session, retryCount + 1), 2000);
            return;
          }

          // Fallback: If fetch fails multiple times, try to create the row but DO NOT set onboarding_complete false yet
          try {
            await supabase.from('profiles').upsert({
              id: session.user.id,
              full_name: session.user.user_metadata?.name || 'User',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id', ignoreDuplicates: true });
            
            // Try fetching one last time after upsert
            const retryProfile = await getCurrentUserProfile(session.user.id);
            setUser({ ...retryProfile, email: session.user.email || retryProfile.email });
            syncUserData(session.user.id).catch(err => console.error('[sync] Sync failed:', err));
            return;
          } catch (e) {
            console.error('[auth] Final fallback failed:', e);
          }

          // Last resort: Only now set defaults if we absolutely can't get data
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            email: session.user.email || '',
            avatar_url: null,
            created_at: new Date().toISOString(),
            onboarding_complete: false, // This is the final fallback for truly new users
            health_profile: defaultHealthProfile,
            goals: {
              calories: 1800,
              protein: 150,
              carbs: 200,
              fat: 60,
              water: 8,
              steps: 10000,
            },
          });
          syncUserData(session.user.id).catch(err => console.error('[sync] Sync failed:', err));
        }
      } else {
        clearLocalStores();
        clearUser();
        clearSentryUser();
        resetAnalytics();
      }
    };

    // SAFETY FALLBACK: If checkSession hangs for any reason, force booting to false after 15s.
    const safetyTimeout = setTimeout(() => {
      console.warn('[auth-bootstrap] Safety timeout reached. Forcing boot.');
      setBooting(false);
      setLoading(false);
    }, 15000);

    // Initial check — with a hard 8-second timeout so a bad network / wrong
    // Supabase key never leaves the app stuck on the loading screen.
    const checkSession = async () => {
      try {
        setLoading(true);
        setBooting(true);

        initSentry();
        trackEvent('app_launched');

        // Race Supabase against a timeout so we never hang forever on mobile
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => {
              // Silently resolve with no session after 12s on slow networks
              resolve({ data: { session: null } });
            }, 12000)
          ),
        ]);

        await handleAuthChange(sessionResult.data.session);
      } catch (err) {
        // Never block app startup on a session check failure
        console.error('[auth-bootstrap] checkSession error:', err);
        clearLocalStores();
        clearUser();
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
        setBooting(false);
      }
    };

    checkSession();

    // Track last handled session to avoid redundant calls (race with login.tsx)
    let lastSessionUserId: string | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Prevent duplicate handling when login.tsx already called setUser
        if (session?.user?.id && session.user.id === lastSessionUserId) {
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) lastSessionUserId = session.user.id;
          await handleAuthChange(session);
          return;
        }

        if (event === 'SIGNED_OUT') {
          lastSessionUserId = null;
          clearLocalStores();
          clearUser();
          return;
        }

        if (session?.user) lastSessionUserId = session.user.id;
        await handleAuthChange(session);
      }
    );

    // Monitor app state for connectivity changes
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNetworkStatus(true);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
      appStateSub.remove();
    };
  }, []);

  // Route protection
  useEffect(() => {
    // Wait until store is not loading, boot is finished, AND navigation is stable
    if (isLoading || booting || !navigationState?.key) return;

    const rootSegment = segments[0];
    const inAuthGroup = rootSegment === '(auth)';
    const inOnboarding = rootSegment === 'onboarding';
    const inTabs = rootSegment === '(tabs)';

    if (!isAuthenticated) {
      // Allow staying on the welcome screen (index)
      if (!inAuthGroup && segments.length > 0) {
        router.replace('/(auth)/login');
      }
    } else if (user && !user.onboarding_complete) {
      if (!inOnboarding) {
        router.replace('/onboarding/step1-personal');
      }
    } else if (isAuthenticated && user?.onboarding_complete) {
      if (inAuthGroup || inOnboarding || (!inTabs && (segments as string[]).length === 0)) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, booting, user?.onboarding_complete, segments, navigationState?.key]);

  // Pulsing animation for loading screen
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Hide splash screen when done booting
  useEffect(() => {
    if (!booting && !isLoading) {
      // Small delay to ensure the UI is actually painted
      const timer = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => {/* ignore */});
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [booting, isLoading]);

  if (isLoading || booting || !fontsLoaded) {
    return (
      <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={styles.loading}>
        <Feather name="activity" size={48} color="#A78BFA" />
        <Animated.View style={{ opacity: pulseAnim }}>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>FitAI</Text>
          </View>
          <Text style={styles.tagline}>Your AI-powered fitness companion</Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <ErrorBoundary fallbackMessage="This screen encountered an error">
          {/* PREFLIGHT FIX: Contain runtime errors at the routing root */}
          <Stack screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
            fullScreenGestureEnabled: true
          }}>
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="modals/action-modal"
              options={{ presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="modals/log-workout"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="modals/log-food"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="modals/log-weight"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="modals/active-workout"
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="modals/exercise-selector"
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="workout/builder"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="workout/summary"
              options={{ animation: 'fade' }}
            />
          </Stack>
        </ErrorBoundary>
      </ToastProvider>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#C4B5FD',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#8B5CF6',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
