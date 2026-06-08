import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, withDelay,
  interpolate, Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const NODE_SIZE = 44;
const CONNECTOR_W = 24;

interface TimelineDay {
  dayLabel: string; fullName: string; workoutName?: string;
  isToday: boolean; isCompleted: boolean; isRest: boolean;
  intensity?: 'low' | 'medium' | 'high';
  recoveryScore?: number;
}

interface WeeklyTimelineProps {
  days: TimelineDay[]; activeIdx: number; onDayPress: (idx: number) => void;
}

function TimelineNode({ day, index, isActive, onPress }: {
  day: TimelineDay; index: number; isActive: boolean; onPress: () => void;
}) {
  const breathe = useSharedValue(0);
  const activeGlow = useSharedValue(0);

  useEffect(() => {
    if (day.isToday) {
      breathe.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ), -1, true
      );
    }
  }, [day.isToday]);

  useEffect(() => {
    activeGlow.value = withDelay(index * 60, withSpring(isActive ? 1 : 0, { damping: 14, stiffness: 130 }));
  }, [isActive]);

  const nodeAnim = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], day.isToday ? [1, 1.1] : [1, 1]) }],
  }));

  const ringAnim = useAnimatedStyle(() => ({
    opacity: interpolate(breathe.value, [0, 1], [0.15, 0.4]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.18]) }],
  }));

  const activeRing = useAnimatedStyle(() => ({
    opacity: interpolate(activeGlow.value, [0, 1], [0, 0.25]),
    transform: [{ scale: interpolate(activeGlow.value, [0, 1], [1, 1.12]) }],
  }));

  const intColor = day.isRest
    ? theme.colors.border.subtle
    : day.intensity === 'high' ? theme.colors.danger
    : day.intensity === 'medium' ? theme.colors.warning : theme.colors.success;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={st.nodeCol}>
      <View style={st.nodeWrap}>
        {(day.isToday || isActive) && (
          <Animated.View style={[st.pulseRing, isActive ? activeRing : ringAnim]} />
        )}
        <Animated.View style={[
          st.node,
          {
            backgroundColor: day.isRest ? theme.colors.bg.tertiary
              : day.isCompleted ? theme.colors.success
              : isActive ? '#6A49FA'
              : theme.colors.bg.tertiary,
            borderColor: isActive ? '#6A49FA' : day.isToday ? 'rgba(106,73,250,0.5)' : 'transparent',
          },
          nodeAnim,
        ]}>
          {day.isCompleted ? (
            <Feather name="check" size={16} color="#FFFFFF" />
          ) : day.isRest ? (
            <Feather name="moon" size={14} color={theme.colors.text.muted} />
          ) : (
            <Text style={[st.nodeLetter, isActive && { color: '#FFFFFF' }]}>{day.dayLabel}</Text>
          )}
        </Animated.View>
        {!day.isRest && !day.isCompleted && (
          <View style={[st.intDot, { backgroundColor: intColor, borderColor: theme.colors.bg.primary }]} />
        )}
      </View>
      {!day.isRest && day.workoutName && (
        <Text style={[st.nodeLabel, isActive && { color: theme.colors.text.primary }]} numberOfLines={1}>{day.workoutName}</Text>
      )}
      {day.isRest && <Text style={[st.nodeLabel, { color: theme.colors.text.muted }]}>Rest</Text>}
    </TouchableOpacity>
  );
}

export default function WeeklyTimeline({ days, activeIdx, onDayPress }: WeeklyTimelineProps) {
  const scrollRef = useRef<ScrollView>(null);
  const todayIdx = days.findIndex(d => d.isToday);

  useEffect(() => {
    if (todayIdx >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: Math.max(0, todayIdx * (NODE_SIZE + CONNECTOR_W + 20) - SCREEN_W / 2 + NODE_SIZE),
          animated: true,
        });
      }, 400);
    }
  }, [todayIdx]);

  return (
    <View style={st.container}>
      <View style={st.headerRow}>
        <Text style={st.label}>WEEK</Text>
        <View style={st.intLegend}>
          <View style={[st.legendDot, { backgroundColor: theme.colors.success }]} />
          <Text style={st.legendText}>Low</Text>
          <View style={[st.legendDot, { backgroundColor: theme.colors.warning }]} />
          <Text style={st.legendText}>Med</Text>
          <View style={[st.legendDot, { backgroundColor: theme.colors.danger }]} />
          <Text style={st.legendText}>High</Text>
        </View>
      </View>
      <ScrollView
        ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.scrollContent}
        snapToInterval={NODE_SIZE + CONNECTOR_W + 20} decelerationRate="fast"
      >
        {days.map((day, idx) => (
          <React.Fragment key={day.fullName}>
            <TimelineNode day={day} index={idx} isActive={idx === activeIdx} onPress={() => onDayPress(idx)} />
            {idx < days.length - 1 && (
              <View style={st.connector}>
                <LinearGradient
                  colors={days[idx].isCompleted ? [theme.colors.success, theme.colors.success] : [theme.colors.border.subtle, 'transparent']}
                  style={st.connectorFill}
                />
              </View>
            )}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { marginBottom: 16, paddingLeft: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16, marginBottom: 12 },
  label: { fontSize: 10, fontFamily: theme.font.family.bold, color: theme.colors.text.muted, letterSpacing: 1.5 },
  intLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 5, height: 5, borderRadius: 3 },
  legendText: { fontSize: 8, fontFamily: theme.font.family.medium, color: theme.colors.text.muted, marginRight: 4 },
  scrollContent: { paddingRight: 24, alignItems: 'flex-start', paddingVertical: 2 },
  nodeCol: { alignItems: 'center', gap: 6, width: NODE_SIZE + 8 },
  nodeWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  node: {
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  nodeLetter: { fontSize: 13, fontFamily: theme.font.family.bold, color: theme.colors.text.secondary },
  pulseRing: {
    position: 'absolute', width: NODE_SIZE + 10, height: NODE_SIZE + 10,
    borderRadius: (NODE_SIZE + 10) / 2, backgroundColor: '#6A49FA',
  },
  intDot: {
    position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: 5, borderWidth: 2,
  },
  nodeLabel: { fontSize: 8, fontFamily: theme.font.family.medium, color: theme.colors.text.secondary, textAlign: 'center', maxWidth: 56 },
  connector: { width: CONNECTOR_W, height: 2, alignSelf: 'center', marginBottom: 18, borderRadius: 1, overflow: 'hidden' },
  connectorFill: { flex: 1, borderRadius: 1 },
});
