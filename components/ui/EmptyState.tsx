import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface Props {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = 'inbox', title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={48} color={theme.colors.text.disabled} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.action} onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  title: { fontSize: 17, fontWeight: '600', color: theme.colors.text.primary, textAlign: 'center' },
  message: { fontSize: 13, color: theme.colors.text.muted, textAlign: 'center', lineHeight: 18 },
  action: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.colors.primarySoft },
  actionText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
});
