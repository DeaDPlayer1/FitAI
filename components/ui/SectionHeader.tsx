/**
 * SectionHeader — Title + optional right action.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  icon?: React.ComponentProps<typeof Feather>['name'];
  iconColor?: string;
  style?: ViewStyle;
}

export function SectionHeader({ title, subtitle, action, icon, iconColor, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.left}>
        {icon && (
          <View style={[styles.iconBubble, { backgroundColor: (iconColor || theme.colors.primary) + '18' }]}>
            <Feather name={icon} size={14} color={iconColor || theme.colors.primary} />
          </View>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.action}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.font.size.title,
    fontWeight: theme.font.weight.bold,
    color: theme.colors.text.primary,
    fontFamily: theme.font.family.bold,
  },
  subtitle: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  action: {
    fontSize: theme.font.size.caption,
    color: theme.colors.primary,
    fontWeight: theme.font.weight.semibold,
  },
});

export default SectionHeader;
