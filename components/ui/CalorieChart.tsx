import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Polyline, Text as SvgText } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  target?: number;
  width?: number;
  height?: number;
  title?: string;
  targetLabel?: string;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function AnimatedBar({ x, y, barWidth, barHeight, color, index }: { x: number; y: number; barWidth: number; barHeight: number; color: string; index: number }) {
  const height = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      height.value = withTiming(barHeight, { duration: 400 });
    }, index * 50);
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    height: height.value,
    y: y + barHeight - height.value,
  }));

  return <AnimatedRect animatedProps={animatedProps} x={x} width={barWidth} rx={3} fill={color} />;
}

const CalorieChart = memo(function CalorieChart({ data, target, width = 300, height = 200, title, targetLabel }: Props) {
  if (!data.length) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.empty}>No calorie data yet</Text>
      </View>
    );
  }

  const padding = { top: 25, bottom: 30, left: 45, right: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const rawMax = Math.max(...data.map(d => d.value), target || 0);
  const maxVal = rawMax > 0 ? rawMax * 1.2 : 200;
  const barWidth = Math.min(chartW / data.length - 4, 30);

  return (
    <View style={[styles.container, { width, height }]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Svg width={width} height={height - (title ? 20 : 0)}>
        {target && (
          <>
            <Line
              x1={padding.left} y1={padding.top + chartH - (target / maxVal) * chartH}
              x2={width - padding.right} y2={padding.top + chartH - (target / maxVal) * chartH}
              stroke="#7C3AED" strokeWidth={1.5} strokeDasharray="4,3"
            />
            <SvgText x={padding.left} y={padding.top + chartH - (target / maxVal) * chartH - 4} fontSize={9} fill="#7C3AED">
              {targetLabel || `Target: ${target}`}
            </SvgText>
          </>
        )}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + chartH - pct * chartH;
          const val = Math.round(maxVal * (1 - pct));
          return (
            <React.Fragment key={i}>
              <Line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#F3F4F6" strokeWidth={1} />
              <SvgText x={padding.left - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">{val}</SvgText>
            </React.Fragment>
          );
        })}
        {data.map((d, i) => {
          const x = padding.left + (i / data.length) * chartW + (chartW / data.length - barWidth) / 2;
          const barHeight = (d.value / maxVal) * chartH;
          const barY = padding.top + chartH - barHeight;
          const color = target ? (d.value > target * 1.1 ? '#EF4444' : d.value < target * 0.8 ? '#F59E0B' : '#10B981') : '#7C3AED';
          return (
            <React.Fragment key={i}>
              <AnimatedBar x={x} y={barY} barWidth={barWidth} barHeight={barHeight} color={color} index={i} />
              <SvgText x={x + barWidth / 2} y={height - 8} textAnchor="middle" fontSize={8} fill="#9CA3AF">
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
});

export default CalorieChart;

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderRadius: 16, padding: 12, overflow: 'hidden' },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  empty: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingTop: 40 },
});
