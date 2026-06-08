import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import PulseDot from '@/components/ui/PulseDot';

interface AINutritionCardProps {
  analyzing: boolean;
  analysisResult: string | null;
  onAnalyze: () => void;
  onDismiss: () => void;
  onGenerateMeal?: () => void;
  onFixMacros?: () => void;
  onHighProtein?: () => void;
}

export function AINutritionCard({
  analyzing,
  analysisResult,
  onAnalyze,
  onDismiss,
  onGenerateMeal,
  onFixMacros,
  onHighProtein,
}: AINutritionCardProps) {
  const expanded = useSharedValue(0);
  const toggleExpand = () => {
    expanded.value = withTiming(expanded.value === 0 ? 1 : 0, { duration: 350 });
  };
  const bodyAnim = useAnimatedStyle(() => ({
    maxHeight: interpolate(expanded.value, [0, 1], [0, 300], Extrapolate.CLAMP),
    opacity: expanded.value,
  }));
  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expanded.value, [0, 1], [0, 180])}deg` }],
  }));

  if (!analysisResult && !analyzing) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={onAnalyze} activeOpacity={0.9}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.ctaCard, theme.shadow.glow]}
          >
            <View style={styles.ctaContent}>
              <View style={styles.ctaIconWrap}>
                <Feather name="cpu" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ctaTitle}>AI Nutrition Analysis</Text>
                <Text style={styles.ctaSub}>Get intelligent feedback on your meals</Text>
              </View>
              <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.60)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.resultCard, theme.shadow.card]}>
        <View style={styles.resultHeader}>
          <PulseDot color={theme.colors.primary} size={6} ringSize={14} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.resultTitle}>Pulse AI Nutrition</Text>
            <Text style={styles.resultSub}>
              {analyzing ? 'Analyzing your meals...' : 'Analysis complete'}
            </Text>
          </View>
          {!analyzing && (
            <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={18} color={theme.colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        {analyzing ? (
          <View style={styles.analyzingBody}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.analyzingText}>Pulse AI is reviewing your nutrition data...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultBody}>{analysisResult}</Text>

            <TouchableOpacity onPress={toggleExpand} style={styles.expandRow} activeOpacity={0.7}>
              <Text style={styles.expandText}>Actions</Text>
              <Animated.View style={iconAnim}>
                <Feather name="chevron-down" size={14} color={theme.colors.text.muted} />
              </Animated.View>
            </TouchableOpacity>

            <Animated.View style={[styles.actionChips, bodyAnim]}>
              {onGenerateMeal && (
                <TouchableOpacity style={styles.chip} onPress={onGenerateMeal} activeOpacity={0.7}>
                  <Feather name="plus-circle" size={13} color={theme.colors.primary} />
                  <Text style={styles.chipText}>Generate meal</Text>
                </TouchableOpacity>
              )}
              {onFixMacros && (
                <TouchableOpacity style={styles.chip} onPress={onFixMacros} activeOpacity={0.7}>
                  <Feather name="sliders" size={13} color={theme.colors.warning} />
                  <Text style={[styles.chipText, { color: theme.colors.warning }]}>Fix macros</Text>
                </TouchableOpacity>
              )}
              {onHighProtein && (
                <TouchableOpacity style={styles.chip} onPress={onHighProtein} activeOpacity={0.7}>
                  <Feather name="zap" size={13} color={theme.colors.success} />
                  <Text style={[styles.chipText, { color: theme.colors.success }]}>High protein ideas</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 20 },
  ctaCard: {
    borderRadius: theme.radius.xl,
    padding: 18,
    overflow: 'hidden',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: theme.font.size.body,
    fontWeight: '700',
  },
  ctaSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: theme.font.size.caption,
    fontWeight: '500',
    marginTop: 2,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 18,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  resultSub: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    marginTop: 1,
  },
  analyzingBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  analyzingText: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  resultBody: {
    fontSize: theme.font.size.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
    fontWeight: '500',
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  expandText: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    color: theme.colors.text.muted,
    flex: 1,
  },
  actionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceTint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  chipText: {
    fontSize: theme.font.size.micro,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

export default AINutritionCard;
