import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { captureError } from '@/lib/sentry';

interface State { hasError: boolean; error: Error | null }

// PREFLIGHT FIX: Screen-level crash containment to prevent blank screens
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackMessage?: string },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
    captureError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>
            {this.props.fallbackMessage ?? 'Please restart the app'}
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorDetail}>{this.state.error.message}</Text>
          )}
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, error: null })}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#0A0A0F',
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  msg: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: '#FF6B2C', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  errorDetail: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
});

