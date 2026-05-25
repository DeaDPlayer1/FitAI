import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const IS_PROD = process.env.EXPO_PUBLIC_APP_ENV === 'production';

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) console.debug('[Sentry] DSN not configured, skipping init');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',
    enableAutoPerformanceTracing: true,
    tracesSampleRate: IS_PROD ? 0.2 : 0.0,
    attachScreenshot: true,
    attachViewHierarchy: true,
    enableNative: true,
    enabled: true,
    beforeSend(event) {
      if (!IS_PROD && __DEV__) {
        console.log('[Sentry] Event suppressed in dev:', event.event_id);
        return null;
      }
      return event;
    },
  });

  Sentry.setTag('app_version', '1.0.0');
  Sentry.setTag('platform', 'react-native');
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (!SENTRY_DSN) {
    console.error('[Sentry] Uncaptured error:', error.message, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!SENTRY_DSN) return;
  Sentry.captureMessage(message, level);
}

export function setSentryUser(userId: string, email?: string) {
  if (!SENTRY_DSN) return;
  Sentry.setUser({ id: userId, email });
}

export function clearSentryUser() {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}

export { Sentry };
