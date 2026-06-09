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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { getCurrentUserProfile, defaultHealthProfile } from '@/lib/auth';
import { clearStoredSession, ensureFreshToken, startPeriodicTokenRefresh, stopPeriodicTokenRefresh } from '@/lib/tokenManager';
import { hydrateCoachChat } from '@/store/workoutStore';
import { hydrateMemoryCache } from '@/store/memoryStore';
import { hydrateNutritionCache } from '@/store/nutritionStore';
import { useUserStore } from '@/store/userStore';
import { useModeStore } from '@/store/modeStore';
import { useTabBarStore } from '@/store/tabBarStore';
import { syncUserData } from '@/lib/sync';
import { useNutritionStore } from '@/store/nutritionStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSplitBuilderStore } from '@/store/splitBuilderStore';
import { useMemoryStore } from '@/store/memoryStore';
import { useAiTrainerStore } from '@/store/aiTrainerStore';
import { useProfileStore } from '@/store/profileStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useLiveContextStore } from '@/store/liveContextStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { COLORS } from '@/constants/theme';
import { initSentry, setSentryUser, clearSentryUser } from '@/lib/sentry';
import { trackEvent, identifyUser, resetAnalytics, trackScreenView } from '@/lib/analytics';
import { ErrorBoundary } from '@/utils/errorBoundary'; // PREFLIGHT FIX: wrap navigation with ErrorBoundary
import { ToastProvider } from '@/components/ui/ToastNotification';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { setNetworkStatus } from '@/lib/network';
import { logger } from '@/lib/logger';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {/* ignore */});

// Silently suppress known unhandled promise rejections from transitive deps
// (e.g. expo-keep-awake native module, Supabase stale refresh tokens)
const SILENCED_ERROR_PATTERNS = [
  'Unable to activate keep awake',
  'Invalid Refresh Token: Refresh Token Not Found',
];
try {
  const ErrorUtils = (globalThis as any).ErrorUtils;
  if (ErrorUtils?.setGlobalHandler) {
    const origHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
      const msg = error?.message || error?.toString?.() || '';
      if (!isFatal && SILENCED_ERROR_PATTERNS.some((p) => msg.includes(p))) {
        if (__DEV__) console.warn('[silenced]', msg);
        return;
      }
      origHandler(error, isFatal);
    });
  }
} catch (_e) {
  // Guard against older RN versions without ErrorUtils
}

// Suppress deprecation warnings for packages not yet migrated
LogBox.ignoreLogs([
  'expo-av has been deprecated', // Will migrate to expo-audio in next SDK update
]);

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Flag set in AsyncStorage after first account creation.
// On subsequent cold starts with no session, user goes to login instead of onboarding.
const HAS_ACCOUNT_KEY = '@has_account';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { user, isLoading, isAuthenticated, setUser, clearUser, setLoading } =
    useUserStore();
  const [booting, setBooting] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);

  // Load Fonts
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Track whether initial auth bootstrap has finished
  const _authInitialized = useRef(false);
  const _authRetryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const _safetyTimedOut = useRef(false);

  // Listen to Supabase auth state changes
  useEffect(() => {
    logger.init();

    // FIX: Ensure local (Zustand) state is cleared on logout only (never Supabase data).
    const clearLocalStores = () => {
      useNutritionStore.getState().clearToday();
      useWorkoutStore.getState().clearChat();
      useWorkoutStore.getState().clearWorkoutLogs();
      useSplitBuilderStore.getState().reset();
      useMemoryStore.getState().clearAll();
      useAiTrainerStore.getState().clearAll();
      useProfileStore.getState().reset();
      useDashboardStore.getState().reset();
      useLiveContextStore.getState().reset();
      useOnboardingStore.getState().reset();
    };

    const handleAuthChange = async (session: any, retryCount = 0) => {
      if (_authRetryTimeout.current) {
        clearTimeout(_authRetryTimeout.current);
        _authRetryTimeout.current = null;
      }
      if (session?.user) {
        // Skip redundant profile DB fetch during login flow — login.tsx already called setUser().
        if (useUserStore.getState().isAuthenticated && useUserStore.getState().user?.id === session.user.id) {
          useModeStore.getState().setMode(useUserStore.getState().user?.app_mode || 'normal');
          setSentryUser(session.user.id, session.user.email);
          identifyUser(session.user.id, { name: useUserStore.getState().user?.name || 'User' });
          trackEvent('user_logged_in');
          syncUserData(session.user.id).catch(err => console.error('[sync] Sync failed:', err));
          return;
        }
        try {
          const profile = await getCurrentUserProfile(session.user.id);
          setUser({ ...profile, email: session.user.email || profile.email });
          if (profile && 'app_mode' in profile) {
            useModeStore.getState().setMode(profile.app_mode || 'normal');
          } else {
            console.warn('[auth] app_mode column missing from profiles table — run migration 20260530_app_mode.sql');
            useModeStore.getState().setMode('normal');
          }
          setSentryUser(session.user.id, session.user.email);
          identifyUser(session.user.id, { name: profile?.name || 'User' });
          trackEvent('user_logged_in');
          syncUserData(session.user.id).catch(err => console.error('[sync] Sync failed:', err));
        } catch (err) {
          console.warn(`[auth] Profile fetch failed (attempt ${retryCount + 1}):`, err);
          
          if (retryCount < 1) {
            _authRetryTimeout.current = setTimeout(() => handleAuthChange(session, retryCount + 1), 2000);
            return;
          }

          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.name || 'User',
            email: session.user.email || '',
            avatar_url: null,
            created_at: new Date().toISOString(),
            onboarding_complete: false,
            app_mode: 'normal',
            dark_mode: false,
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

    // SAFETY FALLBACK: If checkSession hangs, force booting to false after 30s.
    const safetyTimeout = setTimeout(() => {
      console.warn('[auth-bootstrap] Safety timeout reached. Forcing boot.');
      setLoading(false);
      setBooting(false);
      _authInitialized.current = true;
      // Mark that the safety timeout already handled boot — prevents
      // a stale checkSession resolution from clearing an authenticated user later.
      _safetyTimedOut.current = true;
    }, 30000);

    // Two-phase boot:
    //   Phase 1 — Read session from local storage (fast, no network).
    //   Phase 2 — In background, check TTL and refresh if needed.
    const checkSession = async () => {
      try {
        setLoading(true);
        setBooting(true);

        initSentry();
        trackEvent('app_launched');

        // Hydrate persisted stores
        await Promise.all([
          hydrateMemoryCache(),
          hydrateCoachChat(),
          hydrateNutritionCache(),
        ]);

        try {
          const flag = await AsyncStorage.getItem(HAS_ACCOUNT_KEY);
          if (flag === 'true') setHasAccount(true);
        } catch {}

        const { data: localSession } = await supabase.auth.getSession();

        if (localSession?.session) {
          // Phase 1: Hydrate UI immediately from stored session (no network wait)
          await handleAuthChange(localSession.session);
          // Phase 2: Refresh token in background — never block boot or login
          ensureFreshToken()
            .then((ok) => {
              if (!ok) return;
              return supabase.auth.getSession();
            })
            .then((result) => {
              const session = result?.data?.session;
              if (session) handleAuthChange(session);
            })
            .catch(() => {});
        } else {
          // Guard: don't clear if user already logged in via onAuthStateChange while we were blocked
          if (!useUserStore.getState().isAuthenticated) {
            clearLocalStores();
            clearUser();
          }
        }
      } catch (err) {
        console.error('[auth-bootstrap] checkSession error:', err);
        // Guard: don't clear if user already logged in via onAuthStateChange while we were blocked
        if (!useUserStore.getState().isAuthenticated) {
          clearLocalStores();
          clearUser();
        }
      } finally {
        clearTimeout(safetyTimeout);
        // Don't change auth-related state if safety timeout already forced boot
        // AND user has since authenticated (avoids race condition)
        if (!_safetyTimedOut.current || !useUserStore.getState().isAuthenticated) {
          setLoading(false);
          setBooting(false);
        }
        _authInitialized.current = true;
      }
    };

    checkSession();

    startPeriodicTokenRefresh();

    // RULE: The onAuthStateChange listener ONLY updates state.
    // Navigation is handled SOLELY by the route guard useEffect below.
    // This eliminates the race condition between listener navigation
    // and route guard navigation that caused the login freeze.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await handleAuthChange(session);
            return;
          }

          if (event === 'SIGNED_OUT') {
            // Guard: if a real session exists in storage, this SIGNED_OUT
            // is from a stale background refresh — don't wipe the real user.
            const { data: currentSession } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            if (currentSession?.session) return;
            stopPeriodicTokenRefresh();
            clearLocalStores();
            clearUser();
            return;
          }

          if (session?.user) await handleAuthChange(session);
        } catch (err: any) {
          const msg = err?.message || err?.toString?.() || '';
          if (msg.includes('Invalid Refresh Token')) {
            console.warn('[auth-subscription] Stale refresh token. Ignoring — SIGNED_OUT handler will handle it.');
            // Don't clearUser or clearStoredSession here — that would race against
            // a just-completed SIGNED_IN and wipe a successful login.
          } else {
            console.error('[auth-subscription] Error:', err);
          }
        }
      }
    );

    // Monitor app state for connectivity changes
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNetworkStatus(true);
      }
    });

    return () => {
      stopPeriodicTokenRefresh();
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
      appStateSub.remove();
    };
  }, []);

  // ── Route protection (SINGLE SOURCE OF TRUTH for navigation) ──
  // RULE: All post-auth navigation is driven by reactive auth state, NOT button callbacks.
  // The onAuthStateChange listener ONLY updates state; this Effect navigates.
  useEffect(() => {
    // Must wait for fonts + initial session check
    if (isLoading || booting) return;

    const rootSegment = segments?.[0] || '';
    const inAuthGroup = rootSegment === '(auth)';
    const inOnboarding = rootSegment === 'onboarding';
    const inTabs = rootSegment === '(tabs)' || rootSegment === '(ai-trainer)';
    const inPublicRoutes = ['splash', 'boot', 'coach', 'workout', 'checkin', 'plan', 'nutrition', 'settings'].includes(rootSegment);
    const navigatorReady = !!navigationState?.key || segments.length > 0;

    // If no auth state is settled yet, wait
    if (!isAuthenticated && !user) {
      // Navigator must be ready to show login
      if (!navigatorReady) return;
      if (!inAuthGroup && !inOnboarding && !inPublicRoutes) {
        router.replace(hasAccount ? '/(auth)/login' : '/onboarding/welcome');
      }
      return;
    }

    if (user && !user.onboarding_complete) {
      if (!inOnboarding && !inPublicRoutes && navigatorReady) {
        router.replace('/onboarding/welcome');
      }
      return;
    }

    if (isAuthenticated && user?.onboarding_complete) {
      const mode = user.app_mode || 'normal';
      const targetGroup: any = mode === 'ai_trainer' ? '/(ai-trainer)' : '/(tabs)/food';
      // Already on the correct group — no-op
      if (inTabs && rootSegment === (mode === 'ai_trainer' ? '(ai-trainer)' : '(tabs)')) {
        return;
      }
      // Don't redirect when on a root-level detail screen (workout/builder, modals, coach, etc.)
      if (!inAuthGroup && !inOnboarding && !inTabs) {
        return;
      }
      // Navigate to the correct group
      if (navigatorReady || inAuthGroup || inOnboarding || (segments as string[]).length === 0) {
        router.replace(targetGroup);
      }
    }
  }, [isAuthenticated, isLoading, booting, user?.onboarding_complete, user?.app_mode, segments, navigationState?.key, hasAccount]);

  // ── Tab bar visibility based on current route ──
  useEffect(() => {
    const rootSegment = segments?.[0] ?? '';
    const inTabs = rootSegment === '(tabs)' || rootSegment === '(ai-trainer)';
    useTabBarStore.getState().setVisible(inTabs);
  }, [segments]);

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
      <ThemeProvider>
        <ToastProvider>
          <ErrorBoundary fallbackMessage="This screen encountered an error">
            <AppNavigator />
          </ErrorBoundary>
        </ToastProvider>
        <StatusBar style={user?.dark_mode ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const theme = useTheme();
  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
      contentStyle: { backgroundColor: theme.colors.bg.primary },
    }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(ai-trainer)" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="splash"
        options={{ animation: 'fade', fullScreenGestureEnabled: false }}
      />
      <Stack.Screen
        name="boot"
        options={{ animation: 'fade', fullScreenGestureEnabled: false }}
      />
      <Stack.Screen
        name="plan/reveal"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="plan/reset"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="coach/chat"
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="workout/session"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="checkin/weekly"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="nutrition/log"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="settings/mode-switcher"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
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
      <Stack.Screen
        name="modals/confirm-plan"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/weekly-review"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/edit-settings"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/add-meal-type"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/confirm-food"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/camera-capture"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/barcode-scanner"
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/barcode-result"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/food-search"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="modals/food-detail"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
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
