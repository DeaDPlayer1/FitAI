import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence,
  FadeIn, FadeOut, interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import {
  scaleNutrition, getServingPresets, getAvailableUnits,
  type BaseNutrition, type ScaledNutrition, type ServingUnit,
  type ServingPreset, UNIT_META,
} from '@/lib/nutritionScale';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Props ──

interface ServingSizeEditorProps {
  baseNutrition: BaseNutrition;
  isPackaged?: boolean;
  initialQuantity?: number;
  initialUnit?: ServingUnit;
  onNutritionChange: (scaled: ScaledNutrition) => void;
}

// ── Micro-interaction: change indicator ──

function AnimatedMacroValue({
  value, unit, color, label,
}: {
  value: number; unit: string; color: string; label: string;
}) {
  const scale = useSharedValue(1);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      scale.value = withSequence(
        withSpring(1.15, { stiffness: 300, damping: 8 }),
        withSpring(1, { stiffness: 300, damping: 8 }),
      );
      prevRef.current = value;
    }
  }, [value, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={se.macroChip}>
      <Text style={[se.macroChipLabel, { color: theme.colors.text.muted }]}>{label}</Text>
      <Animated.Text style={[se.macroChipValue, { color }, animStyle]}>
        {value}
      </Animated.Text>
      <Text style={[se.macroChipUnit, { color: theme.colors.text.muted }]}>{unit}</Text>
    </View>
  );
}

// ── Main component ──

export default function ServingSizeEditor({
  baseNutrition,
  isPackaged = false,
  initialQuantity,
  initialUnit,
  onNutritionChange,
}: ServingSizeEditorProps) {
  const [quantity, setQuantity] = useState(initialQuantity ?? baseNutrition.baseServingValue);
  const [unit, setUnit] = useState<ServingUnit>(initialUnit ?? baseNutrition.baseServingUnit);
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState(String(quantity));
  const inputRef = useRef<TextInput>(null);

  const presets = getServingPresets(baseNutrition);
  const availableUnits = getAvailableUnits(baseNutrition.baseServingUnit, isPackaged);

  const scaled = scaleNutrition({ base: baseNutrition, quantity, unit });

  // Notify parent on change
  useEffect(() => {
    onNutritionChange(scaled);
  }, [scaled.calories, scaled.protein_g, scaled.carbs_g, scaled.fats_g, scaled.servingLabel]);

  const handleQuantityChange = useCallback((newQty: number) => {
    const clamped = Math.max(0.1, Math.min(9999, newQty));
    setQuantity(clamped);
    setInputText(fmtInput(clamped));
    triggerHaptic();
  }, []);

  const handleStepper = useCallback((delta: number) => {
    const step = unit === 'g' || unit === 'ml' ? 10 : 0.5;
    const next = roundToNearest(quantity + delta * step, step);
    handleQuantityChange(Math.max(0.1, next));
  }, [quantity, unit, handleQuantityChange]);

  const handleSliderChange = useCallback((direction: 1 | -1) => {
    const step = unit === 'g' || unit === 'ml' ? 5 : 0.25;
    const next = roundToNearest(quantity + direction * step, step);
    handleQuantityChange(Math.max(0.1, next));
  }, [quantity, unit, handleQuantityChange]);

  const handlePreset = useCallback((preset: ServingPreset) => {
    setUnit(preset.unit);
    handleQuantityChange(preset.value);
  }, [handleQuantityChange]);

  const handleUnitChange = useCallback((newUnit: ServingUnit) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setUnit(newUnit);
  }, []);

  const handleInputSubmit = useCallback(() => {
    const parsed = parseFloat(inputText);
    if (!isNaN(parsed) && parsed > 0) {
      handleQuantityChange(parsed);
    } else {
      setInputText(fmtInput(quantity));
    }
    setEditing(false);
  }, [inputText, quantity, handleQuantityChange]);

  const stepUp = unit === 'g' || unit === 'ml' ? 10 : 0.5;

  return (
    <View style={se.container}>
      {/* ── Quantity Display ── */}
      <View style={se.quantityRow}>
        <TouchableOpacity
          onPress={() => handleStepper(-1)}
          style={se.stepperBtn}
          activeOpacity={0.6}
        >
          <Feather name="minus" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setEditing(true)}
          style={se.quantityDisplay}
          activeOpacity={0.7}
        >
          {editing ? (
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleInputSubmit}
              onBlur={handleInputSubmit}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              style={se.quantityInput}
            />
          ) : (
            <Animated.Text
              key={quantity}
              style={se.quantityText}
            >
              {fmtInput(quantity)}
            </Animated.Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleStepper(1)}
          style={se.stepperBtn}
          activeOpacity={0.6}
        >
          <Feather name="plus" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Unit Selector ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={se.unitRow}
        contentContainerStyle={se.unitRowContent}
      >
        {availableUnits.map((u) => {
          const active = u === unit;
          const meta = UNIT_META[u];
          return (
            <TouchableOpacity
              key={u}
              onPress={() => handleUnitChange(u)}
              style={[se.unitChip, active && se.unitChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[se.unitChipText, active && se.unitChipTextActive]}>
                {meta?.plural || u}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Quick Presets ── */}
      <View style={se.presetRow}>
        {presets.map((p, i) => {
          const active = p.value === quantity && p.unit === unit;
          return (
            <TouchableOpacity
              key={`${p.value}-${p.unit}-${i}`}
              onPress={() => handlePreset(p)}
              style={[se.presetChip, active && se.presetChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[se.presetChipText, active && se.presetChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Fine Adjustment Slider ── */}
      <View style={se.sliderRow}>
        <TouchableOpacity
          onPress={() => handleSliderChange(-1)}
          style={se.sliderBtn}
          activeOpacity={0.6}
        >
          <Feather name="chevron-left" size={16} color={theme.colors.text.muted} />
        </TouchableOpacity>

        <View style={se.sliderTrack}>
          <View style={se.sliderFillTrack}>
            <View
              style={[
                se.sliderFill,
                { width: `${Math.min(100, (quantity / (baseNutrition.baseServingValue * 3)) * 100)}%` as any },
              ]}
            />
          </View>
          <TouchableOpacity
            onPress={() => handleSliderChange(-1)}
            style={[se.sliderNudge, { left: 0 }]}
          >
            <Text style={se.sliderNudgeText}>−{unit === 'g' || unit === 'ml' ? '5' : '¼'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSliderChange(1)}
            style={[se.sliderNudge, { right: 0 }]}
          >
            <Text style={se.sliderNudgeText}>+{unit === 'g' || unit === 'ml' ? '5' : '¼'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => handleSliderChange(1)}
          style={se.sliderBtn}
          activeOpacity={0.6}
        >
          <Feather name="chevron-right" size={16} color={theme.colors.text.muted} />
        </TouchableOpacity>
      </View>

      {/* ── Live Macros Preview ── */}
      <LinearGradient
        colors={[theme.colors.primarySoft, 'rgba(106,73,250,0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={se.macroPreview}
      >
        <Text style={se.macroPreviewTitle}>
          {scaled.servingLabel}
        </Text>
        <View style={se.macroGrid}>
          <AnimatedMacroValue
            label="CALORIES"
            value={scaled.calories}
            unit="kcal"
            color={theme.colors.warning}
          />
          <AnimatedMacroValue
            label="PROTEIN"
            value={scaled.protein_g}
            unit="g"
            color="#FB7185"
          />
          <AnimatedMacroValue
            label="CARBS"
            value={scaled.carbs_g}
            unit="g"
            color="#F59E0B"
          />
          <AnimatedMacroValue
            label="FATS"
            value={scaled.fats_g}
            unit="g"
            color="#3B82F6"
          />
        </View>
        {(scaled.fiber_g > 0 || scaled.sugar_g > 0) && (
          <View style={se.macroSecondary}>
            {scaled.fiber_g > 0 && (
              <Text style={se.macroSecondaryText}>
                Fiber {scaled.fiber_g}g
              </Text>
            )}
            {scaled.sugar_g > 0 && (
              <Text style={se.macroSecondaryText}>
                Sugar {scaled.sugar_g}g
              </Text>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

function roundToNearest(val: number, step: number): number {
  return Math.round(val / step) * step;
}

function fmtInput(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace(/\.0$/, '');
}

async function triggerHaptic() {
  try {
    const Haptics = await import('expo-haptics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

// ── Styles ──

const se = StyleSheet.create({
  container: {
    gap: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplay: {
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border.soft,
  },
  quantityText: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  quantityInput: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
    padding: 0,
    margin: 0,
    minWidth: 100,
  },
  unitRow: {
    maxHeight: 40,
  },
  unitRowContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  unitChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border.soft,
  },
  unitChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  unitChipTextActive: {
    color: '#FFFFFF',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border.soft,
    alignItems: 'center',
  },
  presetChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.soft,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border.soft,
    position: 'relative',
    overflow: 'visible',
  },
  sliderFillTrack: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: theme.colors.border.soft,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
    width: '0%',
  },
  sliderNudge: {
    position: 'absolute',
    top: -14,
    paddingHorizontal: 4,
  },
  sliderNudgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.muted,
  },
  macroPreview: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(106,73,250,0.1)',
  },
  macroPreviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 14,
    textAlign: 'center',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroChip: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(106,73,250,0.08)',
    gap: 2,
  },
  macroChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroChipValue: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  macroChipUnit: {
    fontSize: 10,
    fontWeight: '600',
  },
  macroSecondary: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 8,
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(106,73,250,0.08)',
  },
  macroSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.muted,
  },
});
