import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Rect, Line, G, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import type { DataPoint } from './LineChartPremium';

const PURPLE_MID = 'rgba(106,73,250,0.5)';
const MUTED = '#8E8E93';

export default React.memo(({
  data, color, goalLine, onBarTap, highlightIndex,
}: {
  data: DataPoint[]; color?: string; goalLine?: number; onBarTap?: (p: DataPoint, idx: number) => void; highlightIndex?: number;
}) => {
  const CHART_W = Dimensions.get('window').width - 72;
  const CHART_H = 148;
  const c = color || '#6A49FA';
  if (data.length === 0) return null;
  const vals = data.map(d => d.value);
  const maxV = Math.max(...vals, goalLine || 0, 1);
  const barGap = Math.max(CHART_W / data.length / 5, 3);
  const barW = Math.max((CHART_W - barGap * (data.length + 1)) / data.length, 6);
  const padX = 4;
  const padY = 18;
  const graphH = CHART_H - padY;

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <SvgGradient id={`barFill-${c.replace('#','')}`} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={c} stopOpacity={0.6} />
            <Stop offset="1" stopColor={c} stopOpacity={1} />
          </SvgGradient>
        </Defs>
        {goalLine != null && goalLine > 0 && (
          <G>
            <Line
              x1={padX} y1={padY + graphH - (goalLine / maxV) * graphH}
              x2={CHART_W - padX} y2={padY + graphH - (goalLine / maxV) * graphH}
              stroke={PURPLE_MID} strokeWidth={1} strokeDasharray="4,3"
            />
            <SvgText x={CHART_W - padX} y={padY + graphH - (goalLine / maxV) * graphH - 4} fontSize={8} fill={PURPLE_MID} textAnchor="end" fontFamily="Inter">
              Goal {Math.round(goalLine)}
            </SvgText>
          </G>
        )}
        {data.map((d, i) => {
          const barH = (d.value / maxV) * graphH;
          const x = padX + barGap + i * (barW + barGap);
          const y = padY + graphH - barH;
          const isHighlight = highlightIndex === i;
          const fillSolid = d.value === 0 ? '#E8E8ED' : (isHighlight ? '#4A2FD0' : c);
          return (
            <G key={i}>
              <Rect x={x} y={y} width={barW} height={Math.max(barH, d.value > 0 ? 2 : 0)} rx={barW / 2} fill={fillSolid} />
              {isHighlight && (
                <Rect x={x - 1} y={y - 1} width={barW + 2} height={Math.max(barH, d.value > 0 ? 2 : 0) + 2} rx={barW / 2 + 1} fill="none" stroke={c} strokeWidth={1.5} />
              )}
            </G>
          );
        })}
        {data.map((d, i) => {
          const x = padX + barGap + i * (barW + barGap);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onBarTap?.(d, i)}
              style={{ position: 'absolute', left: x, top: padY, width: barW, height: graphH }}
              activeOpacity={0.6}
            />
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, paddingHorizontal: padX + 2 }}>
        {data.map((d, i) => (
          <Text key={i} style={{ fontSize: 8, color: MUTED, width: barW + barGap, textAlign: 'center' }} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
});
