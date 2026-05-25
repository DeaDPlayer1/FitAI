import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '@/constants/theme';

interface BarChartProps {
  data: Array<{ day: string; value: number; isToday?: boolean }>;
  maxValue?: number;
  color?: string;
  height?: number;
}

const Bar = ({ item, maxValue, color, index, chartHeight }: { item: any; maxValue: number; color: string; index: number; chartHeight: number }) => {
  const animHeight = useRef(new Animated.Value(0)).current;
  const ratio = Math.max(0, Math.min(item.value / maxValue, 1));

  useEffect(() => {
    Animated.timing(animHeight, {
      toValue: ratio * chartHeight,
      duration: 500 + index * 60,
      useNativeDriver: false,
    }).start();
  }, [ratio, chartHeight, index, animHeight]);

  return (
    <View style={styles.barCol}>
      <Text style={styles.valueText}>{Math.round((item.value / maxValue) * 100)}%</Text>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { height: animHeight, backgroundColor: item.isToday ? color : theme.colors.accent.greenSoft },
          ]}
        />
      </View>
      <Text style={[styles.dayText, item.isToday && styles.activeDayText]}>{item.day}</Text>
    </View>
  );
};

const BarChartComponent = ({ data, maxValue = 100, color = theme.colors.accent.orange, height = 140 }: BarChartProps) => {
  return (
    <View style={styles.container}>
      <View style={[styles.chartArea, { height }]}>
        {data.map((item, i) => (
          <Bar key={`${item.day}-${i}`} item={item} maxValue={maxValue} color={color} index={i} chartHeight={height - 20} />
        ))}
      </View>
    </View>
  );
};

export const BarChart = memo(BarChartComponent);
export default BarChart;

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', flex: 1 },
  valueText: { fontSize: 10, color: theme.colors.text.muted, marginBottom: 4 },
  track: { width: 14, height: 120, backgroundColor: theme.colors.border.soft, borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  dayText: { fontSize: 12, color: theme.colors.text.muted, marginTop: 8 },
  activeDayText: { color: theme.colors.text.primary, fontWeight: '700' },
});
