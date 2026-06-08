import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated as RNAnimated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import { pressSpring, releaseSpring } from '@/lib/animations';

interface SettingItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
}

interface SettingsPersonalizationProps {
  items: SettingItem[];
  onSignOut?: () => void;
}

function SettingRow({ item, index }: { item: SettingItem; index: number }) {
  const scaleAnim = useRef(new RNAnimated.Value(1)).current;

  const onPressIn = useCallback(() => {
    RNAnimated.spring(scaleAnim, {
      toValue: 0.97,
      damping: 14,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressOut = useCallback(() => {
    RNAnimated.spring(scaleAnim, {
      toValue: 1,
      damping: 10,
      stiffness: 120,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <RNAnimated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={styles.row}
          onPress={item.onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          <View style={[styles.iconBg, { backgroundColor: (item.color || theme.colors.primary) + '14' }]}>
            <Feather name={item.icon} size={18} color={item.color || theme.colors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>{item.label}</Text>
            {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
          </View>
          <Feather name="chevron-right" size={18} color={theme.colors.text.muted} />
        </TouchableOpacity>
      </RNAnimated.View>
    </Animated.View>
  );
}

export function SettingsPersonalization({ items, onSignOut }: SettingsPersonalizationProps) {
  return (
    <View style={styles.container}>
      {items.map((item, i) => (
        <SettingRow key={i} item={item} index={i} />
      ))}

      {onSignOut && (
        <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.7}>
          <Feather name="log-out" size={18} color={theme.colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
    ...theme.shadow.soft,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginTop: 8,
  },
  signOutText: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.danger,
  },
});

export default SettingsPersonalization;
