/**
 * FloatingTabBar — Premium pill tab bar matching the reference design.
 * Translucent white pill, floating above content, spring-animated active state.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform, Pressable, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  withDelay,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

// PREFLIGHT FIX: Avoid importing `expo-blur` on Android (hardware bitmap crash risk).
// SAFETY: Only require BlurView at runtime on iOS; Android uses a translucent solid surface.
const BlurViewIOS: null | React.ComponentType<any> =
  Platform.OS === 'ios' ? require('expo-blur').BlurView : null;

const { width } = Dimensions.get('window');

const TAB_CONFIG: Record<string, { label: string; icon: React.ComponentProps<typeof Feather>['name']; highlight?: boolean }> = {
  index: { label: 'Home', icon: 'home' },
  train: { label: 'Train', icon: 'zap' },
  food: { label: 'Nutrition', icon: 'coffee' },
  profile: { label: 'Profile', icon: 'user' },
  coach: { label: 'Coach', icon: 'message-circle', highlight: true },
  nutrition: { label: 'Nutrition', icon: 'coffee' },
  progress: { label: 'Progress', icon: 'bar-chart-2' },
};

interface FloatingTabBarProps extends BottomTabBarProps {
  maxVisible?: number;
}

export default function FloatingTabBar({ state, navigation, maxVisible = 5 }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index]?.name;
  const isCoachScreen = currentRoute === 'coach';

  if (isCoachScreen) {
    return (
      <View style={[styles.container, { bottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]} pointerEvents="box-none">
        <View style={[styles.blur, styles.androidBlur, { width: 90, alignItems: 'center' }]}>
          <View style={styles.pill}>
            <TabItem
              tab={{ id: 'back', label: 'Back', icon: 'chevron-left' }}
              isActive={false}
               onPress={() => navigation.navigate('index')}
            />
          </View>
        </View>
      </View>
    );
  }

  const visibleTabs = state.routes.filter((r) => TAB_CONFIG[r.name]).slice(0, maxVisible);

  return (
    <View
      style={[
        styles.container,
        { bottom: insets.bottom > 0 ? insets.bottom + 8 : 16 },
      ]}
      pointerEvents="box-none"
    >
      {BlurViewIOS ? (
        <BlurViewIOS intensity={40} tint="light" style={styles.blur}>
          <View style={styles.pill}>
            {visibleTabs.map((route) => {
              const config = TAB_CONFIG[route.name];
              const isActive = state.index === state.routes.indexOf(route);
              return (
                <TabItem
                  key={route.name}
                  tab={{ id: route.name, ...config }}
                  isActive={isActive}
                  onPress={() => {
                    if (!isActive) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate(route.name);
                    }
                  }}
                />
              );
            })}
          </View>
        </BlurViewIOS>
      ) : (
        <View style={[styles.blur, styles.androidBlur]}>
          <View style={styles.pill}>
            {visibleTabs.map((route) => {
              const config = TAB_CONFIG[route.name];
              const isActive = state.index === state.routes.indexOf(route);
              return (
                <TabItem
                  key={route.name}
                  tab={{ id: route.name, ...config }}
                  isActive={isActive}
                  onPress={() => {
                    if (!isActive) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate(route.name);
                    }
                  }}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

interface TabItemProps {
  tab: { id: string; label: string; icon: React.ComponentProps<typeof Feather>['name']; highlight?: boolean };
  isActive: boolean;
  onPress: () => void;
}

function TabItem({ tab, isActive, onPress }: TabItemProps) {
  const activeValue = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeValue.value = withSpring(isActive ? 1 : 0, { damping: 16, stiffness: 140 });
  }, [isActive, activeValue]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeValue.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(activeValue.value, [0, 1], [0.85, 1]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeValue.value, [0, 1], [0, 1]),
    maxWidth: interpolate(activeValue.value, [0, 1], [0, 60]),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(activeValue.value, [0, 1], [1, 1.05]) }],
  }));

  if (tab.highlight && isActive) {
    return (
      <Pressable style={styles.tabItem} onPress={onPress} hitSlop={8}>
        <Animated.View style={[styles.activeGradientPill, pillStyle]}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFill}
          >
            <Feather name={tab.icon} size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Animated.Text style={[styles.activeLabel, labelStyle]} numberOfLines={1}>
              {tab.label}
            </Animated.Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.tabItem} onPress={onPress} hitSlop={8}>
      {isActive && (
        <Animated.View style={[styles.activePurplePill, pillStyle]}>
          <Animated.View style={[styles.purplePillInner, iconStyle]}>
            <Feather name={tab.icon} size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Animated.Text style={[styles.activeLabel, labelStyle]} numberOfLines={1}>
              {tab.label}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      )}
      {!isActive && (
        <Animated.View style={iconStyle}>
          <Feather name={tab.icon} size={20} color={theme.colors.text.muted} strokeWidth={2} />
          <Text style={styles.inactiveLabel}>{tab.label}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

const PILL_HEIGHT = 44;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  blur: {
    width: width - 48,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.50)',
    ...theme.shadow.navbar,
    ...Platform.select({
      ios: {
        shadowColor: '#6A49FA',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  androidBlur: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  activeGradientPill: {
    height: PILL_HEIGHT,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    ...theme.shadow.glow,
  },
  gradientFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  activePurplePill: {
    height: PILL_HEIGHT,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    ...theme.shadow.soft,
  },
  purplePillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontSize: theme.font.size.caption,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inactiveLabel: {
    color: theme.colors.text.muted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
    letterSpacing: 0.1,
  },
});
