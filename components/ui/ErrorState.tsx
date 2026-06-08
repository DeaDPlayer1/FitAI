import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Feather name="alert-triangle" size={40} color={theme.colors.status.warning} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retry} onPress={onRetry} activeOpacity={0.7}>
          <Feather name="refresh-cw" size={14} color={theme.colors.primary} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  message: { fontSize: 14, color: theme.colors.text.muted, textAlign: 'center', lineHeight: 20 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.primarySoft },
  retryText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
});
