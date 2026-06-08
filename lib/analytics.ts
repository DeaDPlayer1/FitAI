import { Platform } from 'react-native';

type EventName =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'user_signed_up'
  | 'user_logged_in'
  | 'user_logged_out'
  | 'workout_started'
  | 'workout_completed'
  | 'workout_split_saved'
  | 'meal_logged'
  | 'meal_deleted'
  | 'nutrition_analysis_requested'
  | 'nutrition_analysis_completed'
  | 'ai_chat_message_sent'
  | 'ai_chat_response_received'
  | 'ai_error'
  | 'api_error'
  | 'crash_occurred'
  | 'screen_viewed'
  | 'profile_updated'
  | 'health_condition_toggled'
  | 'water_logged'
  | 'steps_viewed'
  | 'split_builder_opened'
  | 'exercise_logged'
  | 'app_launched'
  | 'sync_completed'
  | 'sync_failed';

type EventProperties = Record<string, string | number | boolean | null | undefined>;

const ANALYTICS_ENABLED = process.env.EXPO_PUBLIC_APP_ENV === 'production';
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let posthogClient: any = null;

async function getPostHog() {
  if (!ANALYTICS_ENABLED || !POSTHOG_KEY) return null;
  if (posthogClient) return posthogClient;

  try {
    // @ts-expect-error - posthog-react-native module may not be installed
    const { PostHog } = await import('posthog-react-native');
    posthogClient = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
    });
    return posthogClient;
  } catch (e) {
    console.warn('[Analytics] PostHog init failed:', e);
    return null;
  }
}

let eventQueue: { name: EventName; properties?: EventProperties }[] = [];
let initializing = false;

async function flushQueue(client: any) {
  while (eventQueue.length > 0) {
    const ev = eventQueue.shift();
    if (ev) {
      try { client.capture(ev.name, { ...ev.properties, platform: Platform.OS }); } catch {}
    }
  }
}

export async function trackEvent(name: EventName, properties?: EventProperties) {
  if (!ANALYTICS_ENABLED) {
    if (__DEV__) console.log(`[Analytics] ${name}`, properties);
    return;
  }

  const client = await getPostHog();
  if (client) {
    await flushQueue(client);
    try {
      client.capture(name, { ...properties, platform: Platform.OS });
    } catch (e) {
      console.warn('[Analytics] trackEvent error:', e);
    }
  } else {
    eventQueue.push({ name, properties });
    if (!initializing) {
      initializing = true;
      getPostHog().then((c) => {
        initializing = false;
        if (c) flushQueue(c);
      });
    }
  }
}

export function trackScreenView(screenName: string) {
  trackEvent('screen_viewed', { screen: screenName });
}

export async function identifyUser(userId: string, traits?: Record<string, any>) {
  if (!ANALYTICS_ENABLED) return;
  const client = await getPostHog();
  if (client) {
    try {
      client.identify(userId, traits);
    } catch (e) {
      console.warn('[Analytics] identify error:', e);
    }
  }
}

export async function resetAnalytics() {
  const client = await getPostHog();
  if (client) {
    try { client.reset(); } catch {}
  }
}
