import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface JourneyEntry {
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle?: string | null;
  date: string;
  color?: string;
}

interface FitnessJourneyProps {
  entries: JourneyEntry[];
}

export function FitnessJourney({ entries }: FitnessJourneyProps) {
  if (entries.length === 0) return null;

  return (
    <View style={styles.container}>
      {entries.map((entry, i) => (
        <Animated.View
          key={entry.id}
          entering={FadeInDown.delay(i * 60).duration(300)}
          style={styles.row}
        >
          <View style={styles.leftCol}>
            <View style={[styles.dot, { backgroundColor: entry.color || theme.colors.primary }]}>
              <Feather name={entry.icon} size={12} color="#FFFFFF" />
            </View>
            {i < entries.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>{entry.title}</Text>
            {entry.subtitle && <Text style={styles.subtitle}>{entry.subtitle}</Text>}
            <Text style={styles.date}>{entry.date}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    minHeight: 64,
  },
  leftCol: {
    alignItems: 'center',
    width: 28,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border.subtle,
    marginTop: -2,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginBottom: 8,
    ...theme.shadow.soft,
  },
  title: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.font.size.caption,
    fontWeight: '500',
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  date: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.muted,
    marginTop: 4,
  },
});

export default FitnessJourney;
