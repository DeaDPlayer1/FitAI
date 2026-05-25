import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useSplitBuilderStore } from '../../store/splitBuilderStore';
import { useUserStore } from '../../store/userStore';
import { supabase } from '../../lib/supabase';

interface WeeklySplitCardProps {
  onEditSplit: () => void;
  onCreateSplit: () => void;
}

export const WeeklySplitCard = React.memo(({ onEditSplit, onCreateSplit }: WeeklySplitCardProps) => {
  const router = useRouter();
  const { days, loadSplit } = useSplitBuilderStore();
  const { user } = useUserStore();
  const [completedDays, setCompletedDays] = useState<string[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadSplit(user.id);
      fetchCompletedDays();
    }
  }, [user?.id]);

  const fetchCompletedDays = async () => {
    if (!user?.id) return;
    try {
      // Get start of the current week (Monday)
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      startOfWeek.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('end_time')
        .eq('user_id', user.id)
        .not('end_time', 'is', null)
        .gte('end_time', startOfWeek.toISOString());

      if (error) throw error;

      const completed = (data || []).map(session => {
        const date = new Date(session.end_time);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return dayNames[date.getDay()];
      });

      setCompletedDays(completed);
    } catch (e) {
      console.warn('Error fetching completed sessions:', e);
    }
  };

  const todayName = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[new Date().getDay()];
  }, []);

  const hasSplit = useMemo(() => {
    return days.some(d => !d.isRest && d.workoutName.trim().length > 0);
  }, [days]);

  const splitDaysData = useMemo(() => {
    const dayAbbreviations: Record<string, string> = {
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
      Sunday: 'Sun'
    };

    return days.map(d => {
      const isCompleted = completedDays.includes(d.dayName);
      let status: 'completed' | 'today' | 'upcoming' = 'upcoming';
      if (isCompleted) {
        status = 'completed';
      } else if (d.dayName === todayName) {
        status = 'today';
      }

      return {
        day: dayAbbreviations[d.dayName] || d.dayName.substring(0, 3),
        type: d.isRest ? 'Rest' : (d.workoutName || 'Active'),
        status,
        isRest: d.isRest
      };
    });
  }, [days, completedDays, todayName]);

  const splitSummary = useMemo(() => {
    const activeDays = days.filter(d => !d.isRest && d.workoutName.trim().length > 0);
    if (activeDays.length === 0) return 'No workouts scheduled';
    return `${activeDays.map(d => d.workoutName).slice(0, 3).join('/')}${activeDays.length > 3 ? '...' : ''} (${activeDays.length} Days)`;
  }, [days]);

  if (!hasSplit) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Current Split</Text>
            <Text style={styles.subtitle}>No active split</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="calendar" size={32} color={theme.colors.text.muted} style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>No workout routine set up for this week.</Text>
          <Pressable 
            style={styles.createBtn} 
            onPress={onCreateSplit}
            delayPressIn={150}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="plus" size={14} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.createBtnText}>Create Split</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.title}>Current Split</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{splitSummary}</Text>
        </View>
        <Pressable 
          style={styles.editBtn} 
          onPress={onEditSplit} 
          delayPressIn={100}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="edit-2" size={14} color={theme.colors.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.timeline}>
        {splitDaysData.map((item, idx) => (
          <View key={idx} style={styles.dayCol}>
            <Text style={[styles.dayName, item.status === 'today' && styles.dayNameToday]}>
              {item.day}
            </Text>
            
            <View 
              style={[
                styles.typeNode, 
                item.status === 'completed' && styles.nodeCompleted,
                item.status === 'today' && styles.nodeToday,
                item.isRest && item.status !== 'completed' && styles.nodeRest
              ]}
            >
              {item.status === 'completed' && <Feather name="check" size={12} color="white" />}
              {item.status === 'today' && <View style={styles.dotToday} />}
            </View>

            <Text 
              style={[
                styles.typeName, 
                item.status === 'today' && styles.typeNameToday,
                item.isRest && styles.typeNameRest
              ]}
              numberOfLines={1}
            >
              {item.type}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.manageBtn}
        onPress={() => router.push('/(tabs)/workout')}
        delayPressIn={100}
      >
        <Feather name="chevron-right" size={14} color={theme.colors.accent.primary} />
        <Text style={styles.manageBtnText}>Manage Training</Text>
      </Pressable>
    </View>
  );
});

WeeklySplitCard.displayName = 'WeeklySplitCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...theme.shadow.card,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginBottom: 8,
  },
  dayNameToday: {
    color: theme.colors.accent.primary,
    fontFamily: theme.font.family.bold,
  },
  typeNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  nodeCompleted: {
    backgroundColor: '#10B981',
  },
  nodeToday: {
    backgroundColor: theme.colors.accent.lavender + '30',
    borderWidth: 1.5,
    borderColor: theme.colors.accent.primary,
  },
  nodeRest: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  dotToday: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent.primary,
  },
  typeName: {
    fontSize: 10,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  typeNameToday: {
    color: theme.colors.accent.primary,
    fontFamily: theme.font.family.bold,
  },
  typeNameRest: {
    color: theme.colors.text.muted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginBottom: 12,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createBtnText: {
    fontSize: 13,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
  },
  manageBtnText: {
    fontSize: 13,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.accent.primary,
  },
});
