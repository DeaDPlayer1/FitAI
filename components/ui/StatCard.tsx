// UI: Dark elevated StatCard showing a single metric with a subtle gradient glow border
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, icon, color, trend }) => {
  return (
    <View style={styles.container}>
      {/* Subtle glow border using LinearGradient as background wrapper */}
      <LinearGradient
        colors={[color + '40', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glowWrapper}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon} size={20} color={color} />
            </View>
            {trend && (
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'} 
                  size={16} 
                  color={trend === 'up' ? theme.colors.accent.green : trend === 'down' ? theme.colors.accent.pink : theme.text.muted} 
                />
              </View>
            )}
          </View>
          
          <View style={styles.dataContainer}>
            <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
            {unit && <Text style={styles.unit}>{unit}</Text>}
          </View>
          
          <Text style={styles.label}>{label}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.elevated,
    shadowColor: theme.shadow.card.shadowColor,
    shadowOffset: theme.shadow.card.shadowOffset,
    shadowOpacity: theme.shadow.card.shadowOpacity,
    shadowRadius: theme.shadow.card.shadowRadius,
    elevation: theme.shadow.card.elevation,
  },
  glowWrapper: {
    borderRadius: theme.radius.lg,
    padding: 1, // Glow acts as a 1px border
  },
  content: {
    backgroundColor: theme.colors.bg.elevated,
    borderRadius: theme.radius.lg - 1, // Adjust for 1px padding
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    padding: 4,
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  value: {
    color: theme.text.primary,
    fontSize: theme.font.size.xxl,
    fontWeight: '700',
  },
  unit: {
    color: theme.text.muted,
    fontSize: theme.font.size.sm,
    fontWeight: '500',
  },
  label: {
    color: theme.text.secondary,
    fontSize: theme.font.size.sm,
    fontWeight: '500',
  },
});
