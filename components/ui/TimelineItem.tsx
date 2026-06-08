/**
 * TimelineItem — Vertical timeline list item (for Today's Plan).
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

type Status = 'completed' | 'current' | 'upcoming' | 'rest';

interface TimelineItemProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  time?: string;
  status?: Status;
  onPress?: () => void;
  showLine?: boolean;
  style?: ViewStyle;
}

export function TimelineItem({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  time,
  status = 'upcoming',
  onPress,
  showLine = true,
  style,
}: TimelineItemProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftCol}>
        <View
          style={[
            styles.node,
            status === 'completed' && { backgroundColor: theme.colors.success },
            status === 'current' && { backgroundColor: theme.colors.primary, borderWidth: 3, borderColor: theme.colors.primarySoft },
            status === 'rest' && { backgroundColor: '#F0EEFC', borderWidth: 1, borderColor: theme.colors.border.solid, borderStyle: 'dashed' },
          ]}
        >
          {status === 'completed' && <Feather name="check" size={10} color="#FFFFFF" />}
        </View>
        {showLine && <View style={styles.line} />}
      </View>
      <Pressable
        style={({ pressed }) => [styles.rightCol, pressed && onPress && { opacity: 0.6 }]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.card}>
          <View style={[styles.iconPill, { backgroundColor: iconBg }]}>
            <Feather name={icon} size={16} color={iconColor} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.rightColInner}>
            {status === 'completed' && (
              <View style={[styles.badge, { backgroundColor: theme.colors.successSoft }]}>
                <Text style={[styles.badgeText, { color: theme.colors.success }]}>Done</Text>
              </View>
            )}
            {status === 'current' && (
              <View style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}>
                <Text style={[styles.badgeText, { color: theme.colors.primary }]}>Now</Text>
              </View>
            )}
            {time && status !== 'current' && status !== 'completed' && (
              <Text style={styles.time}>{time}</Text>
            )}
            {time && (status === 'current' || status === 'completed') && (
              <Text style={styles.time}>{time}</Text>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 64,
  },
  leftCol: {
    width: 24,
    alignItems: 'center',
  },
  node: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#EEEDF4',
    marginTop: 4,
  },
  rightCol: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  rightColInner: {
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    fontSize: theme.font.size.micro,
    fontWeight: '700',
  },
  time: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
});

export default TimelineItem;
