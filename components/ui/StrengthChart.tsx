import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface DataPoint {
  label: string;
  value: number;
}

interface LineSeries {
  name: string;
  data: DataPoint[];
  color: string;
}

interface Props {
  series: LineSeries[];
  width?: number;
  height?: number;
  title?: string;
}

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

function SeriesLine({ series, width, height, maxVal, minVal }: { series: LineSeries; width: number; height: number; maxVal: number; minVal: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 800 });
  }, []);

  const padding = { top: 20, bottom: 30, left: 40, right: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const range = maxVal - minVal || 1;

  const points = series.data.map((d, i) => {
    const x = padding.left + (i / Math.max(1, series.data.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
    return `${x},${y}`;
  });

  const animatedProps = useAnimatedProps(() => ({
    points: points.join(' '),
    opacity: progress.value,
  }));

  return (
    <AnimatedPolyline
      animatedProps={animatedProps}
      fill="none"
      stroke={series.color}
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

const StrengthChart = memo(function StrengthChart({ series, width = 300, height = 200, title }: Props) {
  if (!series.length || !series[0].data.length) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.empty}>No strength data yet</Text>
      </View>
    );
  }

  const allValues = series.flatMap(s => s.data.map(d => d.value));
  const maxVal = Math.max(...allValues) * 1.1 || 100;
  const minVal = Math.min(...allValues) * 0.9 || 0;
  const padding = { top: 20, bottom: 30, left: 40, right: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const range = maxVal - minVal || 1;

  const labels = series[0].data.map(d => d.label);
  const yTicks = 4;

  return (
    <View style={[styles.container, { width, height }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height - (title ? 20 : 0)}>
        {Array.from({ length: yTicks }).map((_, i) => {
          const y = padding.top + (i / (yTicks - 1)) * chartH;
          const val = maxVal - (i / (yTicks - 1)) * range;
          return (
            <React.Fragment key={i}>
              <Line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#E5E7EB" strokeWidth={1} />
              <SvgText x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#9CA3AF">
                {Math.round(val)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {labels.map((label, i) => {
          const x = padding.left + (i / Math.max(1, labels.length - 1)) * chartW;
          return (
            <SvgText key={i} x={x} y={height - 8} textAnchor="middle" fontSize={9} fill="#9CA3AF">
              {label}
            </SvgText>
          );
        })}
        {series.map((s, i) => (
          <SeriesLine key={i} series={s} width={width} height={height} maxVal={maxVal} minVal={minVal} />
        ))}
        {series.map((s, si) =>
          s.data.map((d, di) => {
            const x = padding.left + (di / Math.max(1, s.data.length - 1)) * chartW;
            const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
            return <Circle key={`${si}-${di}`} cx={x} cy={y} r={3} fill={s.color} />;
          })
        )}
      </Svg>
      {series.length > 1 && (
        <View style={styles.legend}>
          {series.map((s, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

export default StrengthChart;

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderRadius: 16, padding: 12, overflow: 'hidden' },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  empty: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingTop: 40 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#6B7280' },
});
