import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Dimensions, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  chips: { label: string; icon: keyof typeof Feather.glyphMap }[];
  onChipPress: (label: string) => void;
}

export function BottomSheet({ visible, onClose, title, chips, onChipPress }: BottomSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 150 });
      backdropOpacity.value = withTiming(0.5, { duration: 200 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: visible ? 'auto' : 'none',
  }));

  if (!visible) return null;

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, sheetStyle]}>
        <View style={styles.handle}>
          <View style={styles.handleBar} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <ScrollView style={styles.chipsContainer}>
          {chips.map((chip) => (
            <TouchableOpacity
              key={chip.label}
              style={styles.chip}
              onPress={() => {
                onChipPress(chip.label);
                onClose();
              }}
            >
              <Feather name={chip.icon} size={16} color={theme.colors.accent.primary} />
              <Text style={styles.chipText}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 998,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 999,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.5,
    ...theme.shadow.hero,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 10,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
