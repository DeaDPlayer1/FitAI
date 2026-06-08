// UI: Premium Floating Tab Bar (Lavender Wellness Edition)
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Keyboard, Platform, Pressable, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const TAB_CONFIG: Record<string, { label: string; icon: string }> = {
  index: { label: 'Home', icon: 'grid' },
  train: { label: 'Train', icon: 'zap' },
  food: { label: 'Nutrition', icon: 'coffee' },
  profile: { label: 'Profile', icon: 'user' },
  coach: { label: 'Coach', icon: 'message-circle' },
  nutrition: { label: 'Nutrition', icon: 'coffee' },
  progress: { label: 'Progress', icon: 'trending-up' },
};

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(true);

  const currentRoute = state.routes[state.index]?.name;
  const isCoachScreen = currentRoute === 'coach';

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      () => setVisible(false)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', 
      () => setVisible(true)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (!visible || isCoachScreen) return null;

  const visibleTabs = state.routes.filter(r => TAB_CONFIG[r.name]).slice(0, 5);

  return (
    <View style={[styles.container, { bottom: insets.bottom > 0 ? insets.bottom : 12 }]} pointerEvents="box-none">
      <View style={styles.tabBarBackground}>
        {/* Absolute layered containers for center docking illusion */}
        <View style={styles.tabBarPill} />
      </View>

      <View style={styles.tabsContainer}>
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
  );
}

function TabItem({ tab, isActive, onPress }: { tab: any; isActive: boolean; onPress: () => void }) {
  const activeValue = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeValue.value = withTiming(isActive ? 1 : 0, {
      duration: 350,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isActive]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(activeValue.value, [0, 1], [1, 1.1]) }],
    opacity: interpolate(activeValue.value, [0, 1], [0.5, 1]),
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeValue.value, [0, 1], [0.5, 1]),
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeValue.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(activeValue.value, [0, 1], [0.8, 1]) }],
  }));

  return (
    <Pressable
      style={styles.tabItem}
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={[styles.activePill, animatedPillStyle]} />
      <Animated.View style={animatedIconStyle}>
        <Feather 
          name={tab.icon as any} 
          size={20}
          strokeWidth={isActive ? 2.5 : 2}
          color={isActive ? theme.colors.accent.primary : theme.colors.text.muted}
        />
      </Animated.View>
      <Animated.View style={animatedLabelStyle}>
        <Text style={[styles.tabLabel, { color: isActive ? theme.colors.accent.primary : theme.colors.text.muted }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tabBarPill: {
    width: width * 0.92,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 32,
    ...theme.shadow.premium,
    shadowColor: '#1F2937',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  tabsContainer: {
    width: width * 0.92,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activePill: {
    position: 'absolute',
    width: 48,
    height: 36,
    backgroundColor: theme.colors.accent.lavender + '20',
    borderRadius: 18,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: theme.font.family.medium,
    marginTop: 2,
  },
});
