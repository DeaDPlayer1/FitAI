import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

export interface TimelineItem {
  id: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  subtitle: string;
  status: 'completed' | 'current' | 'upcoming' | 'skipped';
  time?: string;
  onPress?: () => void;
}

interface DailyFlowTimelineProps {
  items: TimelineItem[];
  showGlow?: boolean;
}

function TimelineNode({ status, index, isLast }: { status: TimelineItem['status']; index: number; isLast: boolean }) {
  const animProgress = useSharedValue(0);
  const lineProgress = useSharedValue(0);

  useEffect(() => {
    animProgress.value = withDelay(
      index * 120,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back()) })
    );
    if (!isLast) {
      lineProgress.value = withDelay(
        index * 120 + 200,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
      );
    }
  }, [index, isLast, animProgress, lineProgress]);

  const nodeAnim = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(animProgress.value, [0, 1], [0, 1]) }],
    opacity: animProgress.value,
  }));

  const lineAnim = useAnimatedStyle(() => ({
    height: interpolate(lineProgress.value, [0, 1], [0, 40]),
    opacity: lineProgress.value,
  }));

  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const isSkipped = status === 'skipped';

  const nodeColor = isCompleted
    ? theme.colors.success
    : isCurrent
      ? theme.colors.primary
      : isSkipped
        ? theme.colors.text.muted
        : theme.colors.primarySoft;

  return (
    <View style={styles.nodeColumn}>
      <Animated.View style={[styles.nodeContainer, nodeAnim]}>
        <View
          style={[
            styles.node,
            { backgroundColor: nodeColor },
            isCurrent && styles.nodeCurrent,
            isCompleted && styles.nodeCompleted,
          ]}
        >
          {isCompleted && <Feather name="check" size={10} color="#FFFFFF" />}
          {isCurrent && (
            <View style={styles.pulseInner}>
              <View style={[styles.pulseDot, { backgroundColor: theme.colors.primary }]} />
            </View>
          )}
        </View>
        {isCurrent && (
          <View style={styles.currentGlow}>
            <View style={[styles.currentGlowInner, { backgroundColor: theme.colors.primary }]} />
          </View>
        )}
      </Animated.View>
      {!isLast && (
        <Animated.View
          style={[
            styles.line,
            { backgroundColor: isSkipped ? theme.colors.border.subtle : theme.colors.border.soft },
            lineAnim,
          ]}
        />
      )}
    </View>
  );
}

export function DailyFlowTimeline({ items, showGlow = true }: DailyFlowTimelineProps) {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.timelineTrack}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemRow}
            onPress={item.onPress}
            activeOpacity={0.7}
            disabled={!item.onPress}
          >
            <TimelineNode status={item.status} index={i} isLast={i === items.length - 1} />
            <View style={[
              styles.itemContent,
              item.status === 'completed' && styles.itemContentCompleted,
              item.status === 'current' && styles.itemContentCurrent,
            ]}>
              <View style={styles.itemIconWrap}>
                <Feather
                  name={item.icon}
                  size={16}
                  color={
                    item.status === 'completed' ? theme.colors.success
                    : item.status === 'current' ? theme.colors.primary
                    : item.status === 'skipped' ? theme.colors.text.muted
                    : theme.colors.text.secondary
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.itemTitle,
                  (item.status === 'completed' || item.status === 'skipped') && styles.itemTitleDimmed,
                ]}>
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.itemRight}>
                {item.status === 'current' && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Now</Text>
                  </View>
                )}
                {item.status === 'completed' && (
                  <Feather name="check-circle" size={18} color={theme.colors.success} />
                )}
                {item.status === 'upcoming' && item.time && (
                  <Text style={styles.itemTime}>{item.time}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
  },
  timelineTrack: {
    gap: 0,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nodeColumn: {
    width: 32,
    alignItems: 'center',
  },
  nodeContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  node: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCurrent: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.primary,
  },
  nodeCompleted: {
    backgroundColor: theme.colors.success,
  },
  pulseInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  currentGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentGlowInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    opacity: 0.2,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginLeft: 8,
    marginBottom: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    ...theme.shadow.card,
  },
  itemContentCompleted: {
    opacity: 0.7,
  },
  itemContentCurrent: {
    borderWidth: 1,
    borderColor: theme.colors.primaryGlow,
  },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  itemTitleDimmed: {
    color: theme.colors.text.muted,
    textDecorationLine: 'line-through',
  },
  itemSubtitle: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  currentBadge: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  currentBadgeText: {
    color: theme.colors.primary,
    fontSize: theme.font.size.micro,
    fontWeight: '700',
  },
  itemTime: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
});

export default DailyFlowTimeline;
