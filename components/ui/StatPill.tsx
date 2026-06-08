/**
 * StatPill — Tinted pill with icon + value + label.
 * The building block of stat rows and hero metrics.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

type TintVariant = 'purple' | 'success' | 'warning' | 'danger' | 'blue' | 'pink' | 'sky' | 'neutral' | 'glass';

const TINT_PRESETS: Record<TintVariant, { bg: string; fg: string }> = {
  purple: { bg: theme.colors.primarySoft, fg: theme.colors.primary },
  success: { bg: theme.colors.successSoft, fg: theme.colors.success },
  warning: { bg: theme.colors.warningSoft, fg: theme.colors.warning },
  danger: { bg: theme.colors.dangerSoft, fg: theme.colors.danger },
  blue: { bg: theme.colors.secondarySoft, fg: '#60A5FA' },
  sky: { bg: theme.colors.secondarySoft, fg: '#3B82F6' },
  pink: { bg: theme.colors.tertiarySoft, fg: '#FB7185' },
  neutral: { bg: '#F3F4F6', fg: theme.colors.text.secondary },
  glass: { bg: 'rgba(255,255,255,0.20)', fg: '#FFFFFF' },
};

interface StatPillProps extends ViewProps {
  icon?: React.ComponentProps<typeof Feather>['name'];
  value: string | number;
  label?: string;
  variant?: TintVariant;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  withIconCircle?: boolean;
  reverse?: boolean;
}

export function StatPill({
  icon,
  value,
  label,
  variant = 'purple',
  size = 'md',
  style,
  withIconCircle = false,
  reverse = false,
  ...rest
}: StatPillProps) {
  const tint = TINT_PRESETS[variant];
  const sizes = {
    sm: { iconSize: 12, valueSize: 13, labelSize: 10, paddingH: 10, paddingV: 4, gap: 4 },
    md: { iconSize: 14, valueSize: 14, labelSize: 11, paddingH: 12, paddingV: 6, gap: 6 },
    lg: { iconSize: 18, valueSize: 18, labelSize: 13, paddingH: 14, paddingV: 8, gap: 8 },
  };
  const s = sizes[size];

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: tint.bg,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          gap: s.gap,
        },
        style,
      ]}
      {...rest}
    >
      {icon && (
        withIconCircle ? (
          <View style={[styles.iconCircle, { backgroundColor: tint.fg + '20' }]}>
            <Feather name={icon} size={s.iconSize} color={tint.fg} />
          </View>
        ) : (
          <Feather name={icon} size={s.iconSize} color={tint.fg} />
        )
      )}
      <View style={reverse ? { flexDirection: 'row', alignItems: 'baseline', gap: 3 } : undefined}>
        {typeof value === 'number' || /^\d/.test(String(value)) ? (
          <Text style={[styles.value, { color: tint.fg, fontSize: s.valueSize }]}>{value}</Text>
        ) : (
          <Text style={[styles.value, { color: tint.fg, fontSize: s.valueSize }]}>{value}</Text>
        )}
        {label && (
          <Text style={[styles.label, { color: tint.fg, fontSize: s.labelSize, opacity: 0.75 }]}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
  },
  value: {
    fontWeight: '700',
  },
  label: {
    fontWeight: '500',
  },
  iconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StatPill;
