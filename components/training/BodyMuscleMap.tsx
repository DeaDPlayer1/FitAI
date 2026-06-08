import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, withRepeat, withSequence, Easing, interpolate } from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface MuscleState {
  key: string;
  label: string;
  d: string;
  intensity?: number;
  color?: string;
}

interface BodyMuscleMapProps {
  size?: number;
  muscles?: MuscleState[];
  animated?: boolean;
}

const DEFAULT_MUSCLES: MuscleState[] = [
  {
    key: 'shoulders',
    label: 'Shoulders',
    d: 'M95 45 Q110 30 125 45 Q120 55 110 58 Q100 55 95 45Z',
    intensity: 0.8,
    color: '#6A49FA',
  },
  {
    key: 'chest',
    label: 'Chest',
    d: 'M100 60 Q110 50 120 60 Q118 80 110 85 Q102 80 100 60Z',
    intensity: 0.5,
    color: '#6A49FA',
  },
  {
    key: 'biceps',
    label: 'Biceps',
    d: 'M80 50 Q75 65 78 80 Q82 78 84 65 Q83 55 80 50Z M136 50 Q141 65 138 80 Q134 78 132 65 Q133 55 136 50Z',
    intensity: 0.6,
    color: '#6A49FA',
  },
  {
    key: 'abs',
    label: 'Core',
    d: 'M102 88 Q110 84 118 88 Q117 110 110 113 Q103 110 102 88Z',
    intensity: 0.3,
    color: '#F59E0B',
  },
  {
    key: 'quads',
    label: 'Quads',
    d: 'M98 118 Q110 112 122 118 Q120 140 110 148 Q100 140 98 118Z',
    intensity: 0.4,
    color: '#00D68F',
  },
  {
    key: 'calves',
    label: 'Calves',
    d: 'M103 152 Q110 148 117 152 Q115 170 110 175 Q105 170 103 152Z',
    intensity: 0.2,
    color: '#00D68F',
  },
];

function MusclePath({ muscle, index, animated }: { muscle: MuscleState; index: number; animated?: boolean }) {
  const glow = useSharedValue(muscle.intensity || 0.3);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      glow.value = withTiming(muscle.intensity || 0.3, { duration: 600, easing: Easing.out(Easing.quad) });
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2500 + index * 300, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2500 + index * 300, easing: Easing.inOut(Easing.sin) }),
        ), -1, true
      );
    } else {
      glow.value = muscle.intensity || 0.3;
    }
  }, [muscle.intensity, animated]);

  const animProps = useAnimatedProps(() => {
    const opacity = animated
      ? interpolate(pulse.value, [0, 1], [0.5, 0.85]) * (muscle.intensity || 0.5)
      : (muscle.intensity || 0.5);
    return {
      opacity: Math.max(0.1, opacity),
    };
  });

  const baseProps = {
    d: muscle.d,
    fill: muscle.color || '#6A49FA',
    opacity: 0.06,
  };

  return (
    <G>
      <Path {...baseProps} />
      <AnimatedPath
        d={muscle.d}
        fill={muscle.color || '#6A49FA'}
        animatedProps={animProps}
      />
    </G>
  );
}

export default function BodyMuscleMap({ size = 220, muscles = DEFAULT_MUSCLES, animated = true }: BodyMuscleMapProps) {
  const viewW = 220;
  const viewH = 200;
  const scale = size / viewW;

  return (
    <View style={{ width: size, height: size * (viewH / viewW), alignItems: 'center', justifyContent: 'center' }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${viewW} ${viewH}`}>
        {/* Silhouette outline */}
        <Path
          d="M108 10 Q130 12 140 25 Q145 35 142 45 L148 48 Q155 55 150 65 L145 60 Q142 50 136 48 L136 52 Q140 55 140 65 Q138 75 130 82 L128 100 Q130 108 128 115 L132 130 Q135 140 132 148 L128 150 Q125 145 122 148 L118 130 Q116 120 115 115 L110 115 Q108 120 106 130 L102 148 Q98 150 95 148 Q92 140 95 130 L98 115 Q96 108 98 100 L96 82 Q88 75 86 65 Q86 55 90 52 L90 48 Q84 50 81 60 L76 65 Q71 55 78 48 L84 45 Q81 35 86 25 Q96 12 108 10Z"
          fill="rgba(0,0,0,0.02)"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={1}
        />
        {muscles.map((m, i) => (
          <MusclePath key={m.key} muscle={m} index={i} animated={animated} />
        ))}
      </Svg>
    </View>
  );
}
