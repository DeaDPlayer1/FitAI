import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface ProgressBarProps {
  progress: number;
  label?: string;
  color?: string;
  height?: number;
  percent?: boolean;
}

// UI: Revamped Premium ProgressBar with dynamic labels and rounded design
export const ProgressBar = ({ 
  progress, 
  label, 
  color = theme.colors.accent.green, 
  height = 8,
  percent = false
}: ProgressBarProps) => {
  const displayProgress = Math.min(Math.max(progress, 0), 1);
  
  return (
    <View style={styles.container}>
      {(label || percent) && (
        <View style={styles.header}>
          {label && <Text style={styles.label}>{label}</Text>}
          {percent && (
            <Text style={styles.percentText}>
              {Math.round(displayProgress * 100)}%
            </Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <View 
          style={[
            styles.fill, 
            { 
              width: `${displayProgress * 100}%`, 
              backgroundColor: color,
              borderRadius: height / 2 
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  track: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
