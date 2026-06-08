import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
  cta: string;
  ctaColor: string;
  progress?: number;
  progressColor?: string;
  onPress: () => void;
}

export default function WorkoutPlanCard({
  icon, iconBg, iconColor, label, value, sub, cta, ctaColor, progress, progressColor, onPress,
}: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 18, color: iconColor }}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: iconColor }]}>{value}</Text>
      <Text style={styles.sub}>{sub}</Text>

      {progress !== undefined && (
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor || iconColor }]} />
        </View>
      )}

      <View style={styles.separator} />
      <Text style={[styles.cta, { color: ctaColor }]}>{cta}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginRight: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  value: { fontSize: 22, fontWeight: '700', marginTop: 1 },
  sub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  barTrack: { height: 3, borderRadius: 2, backgroundColor: '#E5E7EB', marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  separator: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  cta: { fontSize: 13, fontWeight: '500' },
});
