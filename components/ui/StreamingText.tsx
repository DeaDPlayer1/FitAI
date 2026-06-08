import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export interface ThinkingStage {
  label: string;
  duration: number;
  icon?: string;
}

interface StreamingTextProps {
  text: string;
  speed?: number;
  stages?: ThinkingStage[];
  onComplete?: () => void;
  textStyle?: any;
}

function StageIndicator({ stages, currentIndex }: { stages: ThinkingStage[]; currentIndex: number }) {
  return (
    <View style={styles.stageRow}>
      {stages.map((stage, i) => (
        <React.Fragment key={stage.label}>
          {i > 0 && <View style={[styles.stageLine, i <= currentIndex && styles.stageLineActive]} />}
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.stageDot, i <= currentIndex && styles.stageDotActive, i === currentIndex && styles.stageDotCurrent]}
          >
            {i < currentIndex && <Text style={styles.stageCheck}>✓</Text>}
          </Animated.View>
          <Text style={[styles.stageLabel, i <= currentIndex && styles.stageLabelActive]}>
            {stage.label}
          </Text>
        </React.Fragment>
      ))}
    </View>
  );
}

export function StreamingText({
  text,
  speed = 18,
  stages,
  onComplete,
  textStyle,
}: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [isThinking, setIsThinking] = useState(true);
  const [stageIndex, setStageIndex] = useState(-1);

  useEffect(() => {
    if (!stages || stages.length === 0) {
      setIsThinking(false);
      return;
    }
    let cancelled = false;
    let totalDelay = 0;

    stages.forEach((stage, i) => {
      totalDelay += stage.duration;
      const timeout = setTimeout(() => {
        if (!cancelled) setStageIndex(i);
      }, totalDelay);
    });

    const thinkingEnd = setTimeout(() => {
      if (!cancelled) {
        setStageIndex(stages.length);
        setIsThinking(false);
      }
    }, totalDelay + 200);

    return () => {
      cancelled = true;
    };
  }, [stages]);

  useEffect(() => {
    if (isThinking) return;
    let cancelled = false;
    let idx = 0;
    setDisplayed('');

    const interval = setInterval(() => {
      idx++;
      if (cancelled) return;
      setDisplayed(text.slice(0, idx));
      if (idx >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [text, isThinking, speed]);

  if (isThinking && stages && stages.length > 0) {
    return <StageIndicator stages={stages} currentIndex={stageIndex} />;
  }

  return <Text style={textStyle}>{displayed}</Text>;
}

const styles = StyleSheet.create({
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  stageDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotActive: {
    backgroundColor: 'rgba(139,92,246,0.3)',
  },
  stageDotCurrent: {
    backgroundColor: '#8B5CF6',
  },
  stageCheck: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stageLine: {
    width: 12,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stageLineActive: {
    backgroundColor: 'rgba(139,92,246,0.4)',
  },
  stageLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginRight: 8,
  },
  stageLabelActive: {
    color: 'rgba(255,255,255,0.8)',
  },
});
