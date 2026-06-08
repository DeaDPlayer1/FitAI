import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Props {
  mode: 'normal' | 'ai_trainer';
  onPress: () => void;
}

export default function ModeBadge({ mode, onPress }: Props) {
  const borderOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (mode !== 'ai_trainer') return;
    borderOpacity.value = withRepeat(
      withTiming(0.6, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [mode]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(200,255,0,${borderOpacity.value})`,
  }));

  if (mode === 'normal') {
    return (
      <TouchableOpacity style={styles.badge} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.normalText}>NORMAL</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.badge, styles.aiBadge, animatedBorderStyle]}>
        <Feather name="zap" size={9} color="#C8FF00" />
        <Text style={styles.aiText}>AI TRAINER</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#1C1C1C',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  normalText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: '#7A7A7A',
    letterSpacing: 1,
  },
  aiBadge: {
    borderColor: 'rgba(200,255,0,0.30)',
  },
  aiText: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    color: '#C8FF00',
    letterSpacing: 1,
  },
});
