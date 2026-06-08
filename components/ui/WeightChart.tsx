import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  targetZone?: [number, number];
  width?: number;
  height?: number;
  title?: string;
}

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

const WeightChart = memo(function WeightChart({ data, targetZone, width = 300, height = 200, title }: Props) {
  if (!data.length) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.empty}>No weight data yet</Text>
      </View>
    );
  }

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 800 });
  }, []);

  const padding = { top: 20, bottom: 30, left: 45, right: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const values = data.map(d => d.value);
  const minVal = Math.min(...values) * 0.995;
  const maxVal = Math.max(...values) * 1.005;
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(1, data.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
    return `${x},${y}`;
  });

  const animatedProps = useAnimatedProps(() => ({
    points: points.join(' '),
    opacity: progress.value,
  }));

  const yTicks = 4;

  const targetPolygon = targetZone
    ? [
        `${padding.left},${padding.top + chartH - ((targetZone[0] - minVal) / range) * chartH}`,
        `${padding.left},${padding.top + chartH - ((targetZone[1] - minVal) / range) * chartH}`,
        `${width - padding.right},${padding.top + chartH - ((targetZone[1] - minVal) / range) * chartH}`,
        `${width - padding.right},${padding.top + chartH - ((targetZone[0] - minVal) / range) * chartH}`,
      ].join(' ')
    : null;

  return (
    <View style={[styles.container, { width, height }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height - (title ? 20 : 0)}>
        {targetPolygon && (
          <Polygon points={targetPolygon} fill="rgba(16, 185, 129, 0.08)" stroke="none" />
        )}
        {Array.from({ length: yTicks }).map((_, i) => {
          const y = padding.top + (i / (yTicks - 1)) * chartH;
          const val = maxVal - (i / (yTicks - 1)) * range;
          return (
            <React.Fragment key={i}>
              <Line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#F3F4F6" strokeWidth={1} />
              <SvgText x={padding.left - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">
                {val.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {targetZone && (
          <>
            <Line x1={padding.left} y1={padding.top + chartH - ((targetZone[1] - minVal) / range) * chartH}
              x2={width - padding.right} y2={padding.top + chartH - ((targetZone[1] - minVal) / range) * chartH}
              stroke="#10B981" strokeWidth={1} strokeDasharray="3,3" />
            <Line x1={padding.left} y1={padding.top + chartH - ((targetZone[0] - minVal) / range) * chartH}
              x2={width - padding.right} y2={padding.top + chartH - ((targetZone[0] - minVal) / range) * chartH}
              stroke="#10B981" strokeWidth={1} strokeDasharray="3,3" />
          </>
        )}
        <AnimatedPolyline
          animatedProps={animatedProps}
          fill="none"
          stroke="#7C3AED"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => {
          const x = padding.left + (i / Math.max(1, data.length - 1)) * chartW;
          const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
          return (
            <React.Fragment key={i}>
              <Circle cx={x} cy={y} r={3} fill="white" stroke="#7C3AED" strokeWidth={2} />
              <SvgText x={x} y={height - 8} textAnchor="middle" fontSize={8} fill="#9CA3AF">
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
});

export default WeightChart;

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderRadius: 16, padding: 12, overflow: 'hidden' },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  empty: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingTop: 40 },
});
