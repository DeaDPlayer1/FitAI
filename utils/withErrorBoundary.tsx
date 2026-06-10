import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { captureError } from '@/lib/sentry';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  fallbackMessage?: string;
}

function DefaultFallback({ error, resetError, fallbackMessage }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.msg}>{fallbackMessage || 'Please try again'}</Text>
      {__DEV__ && error ? (
        <Text style={styles.errorDetail}>{error.message}</Text>
      ) : null}
      <TouchableOpacity style={styles.btn} onPress={resetError} activeOpacity={0.85}>
        <Text style={styles.btnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackMessage?: string,
): React.ComponentType<P> {
  class ErrorBoundaryWrapper extends React.Component<P, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
      console.error('[ErrorBoundary]', error.message);
      captureError(error, { componentStack: info.componentStack });
    }

    render() {
      if (this.state.hasError) {
        return (
          <DefaultFallback
            error={this.state.error!}
            resetError={() => this.setState({ hasError: false, error: null })}
            fallbackMessage={fallbackMessage}
          />
        );
      }
      return <Component {...this.props} />;
    }
  }
  return ErrorBoundaryWrapper;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#0A0A0F' },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  msg: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: '#FF6B2C', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  errorDetail: { fontSize: 12, color: '#EF4444', textAlign: 'center', marginBottom: 24, fontFamily: 'monospace' },
});
