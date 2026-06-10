import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, G, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const MUTED = '#8E8E93';

export interface DataPoint {
  label: string;
  value: number;
  date?: string;
  meta?: any;
}

export default React.memo(({
  data, color, onPointTap, activePoint,
}: {
  data: DataPoint[]; color?: string; onPointTap?: (p: DataPoint, idx: number) => void; activePoint?: number | null;
}) => {
  const CHART_W = Dimensions.get('window').width - 72;
  const CHART_H = 148;
  const c = color || '#6A49FA';
  if (data.length < 2) return null;
  const vals = data.map(d => d.value);
  const dataMin = Math.min(...vals);
  const dataMax = Math.max(...vals);
  const padding = Math.max((dataMax - dataMin) * 0.15, 0.5);
  const maxV = dataMax + padding;
  const minV = Math.max(dataMin - padding, 0);
  const range = maxV - minV || 1;
  const padX = 28;
  const padY = 12;
  const graphW = CHART_W - padX;
  const graphH = CHART_H - padY * 2;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * graphW;
    const y = padY + graphH - ((d.value - minV) / range) * graphH;
    return { x, y, pt: d, idx: i };
  });

  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  ).join(' ');

  const areaPath = `${linePath} L${points[points.length - 1].x},${padY + graphH} L${points[0].x},${padY + graphH} Z`;

  const yTicks = 3;
  const tickLabels = Array.from({ length: yTicks }, (_, i) => {
    const v = minV + (range / (yTicks - 1)) * i;
    return Math.round(v * 10) / 10;
  });

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <SvgGradient id={`lineFill-${c.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c} stopOpacity={0.3} />
            <Stop offset="1" stopColor={c} stopOpacity={0.02} />
          </SvgGradient>
        </Defs>
        {tickLabels.map((v, i) => {
          const y = padY + graphH - ((v - minV) / range) * graphH;
          return (
            <G key={i}>
              <Line x1={padX} y1={y} x2={CHART_W} y2={y} stroke="#E8E8ED" strokeWidth={0.5} />
              <SvgText x={padX - 4} y={y + 4} fontSize={9} fill={MUTED} textAnchor="end" fontFamily="Inter">
                {v}
              </SvgText>
            </G>
          );
        })}
        <Path d={areaPath} fill={`url(#lineFill-${c.replace('#','')})`} />
        <Path d={linePath} stroke={c} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const isActive = activePoint === i;
          return (
            <G key={i}>
              <Circle cx={p.x} cy={p.y} r={isActive ? 7 : 4} fill={isActive ? '#FFFFFF' : c} stroke={c} strokeWidth={isActive ? 3 : 0} />
              {isActive && (
                <Circle cx={p.x} cy={p.y} r={10} fill={c} opacity={0.15} />
              )}
            </G>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, paddingHorizontal: padX }}>
        <Text style={{ fontSize: 9, color: MUTED }}>{data[0].label}</Text>
        <Text style={{ fontSize: 9, color: MUTED }}>{data[data.length - 1].label}</Text>
      </View>
      {points.map((p, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onPointTap?.(p.pt, i)}
          style={{ position: 'absolute', left: p.x - 16, top: p.y - 16, width: 32, height: 32, borderRadius: 16 }}
          activeOpacity={0.6}
        />
      ))}
    </View>
  );
});
