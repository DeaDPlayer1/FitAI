import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Keyboard, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'index', icon: 'home-outline', activeIcon: 'home', route: '/(tabs)', label: 'Home' },
  { id: 'stats', icon: 'stats-chart-outline', activeIcon: 'stats-chart', route: '/(tabs)/stats', label: 'Stats' },
  { id: 'action', icon: 'add', activeIcon: 'add', route: '/modals/log-food', isAction: true, label: 'Add' },
  { id: 'train', icon: 'barbell-outline', activeIcon: 'barbell', route: '/(tabs)/train', label: 'Train' },
  { id: 'profile', icon: 'person-outline', activeIcon: 'person', route: '/(tabs)/profile', label: 'Profile' },
];

// PREFLIGHT FIX: Avoid importing `expo-blur` on Android (hardware bitmap crash risk).
// SAFETY: Only require BlurView at runtime on iOS.
const BlurViewIOS: null | React.ComponentType<any> =
  Platform.OS === 'ios' ? require('expo-blur').BlurView : null;

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setVisible(false));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setVisible(true));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (!visible) return null;

  const renderTabs = () => {
    return TABS.map((tab) => {
      const routeIndex = state.routes.findIndex(r => r.name === tab.id);
      const isActive = routeIndex !== -1 && state.index === routeIndex;
      
      const onPress = () => {
        if (tab.isAction) {
          router.push(tab.route as any);
        } else if (routeIndex !== -1) {
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[routeIndex].key,
            canPreventDefault: true,
          });

          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(tab.id);
          }
        }
      };

      if (tab.isAction) {
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.fabContainer}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.COLORS.primary, theme.COLORS.purple]}
              style={styles.fab}
            >
              <Ionicons name="add" size={32} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        );
      }

      return (
        <TouchableOpacity
          key={tab.id}
          style={styles.tabItem}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={(isActive ? tab.activeIcon : tab.icon) as any} 
            size={24} 
            color={isActive ? theme.COLORS.primary : theme.TEXT.muted} 
          />
          {isActive && <View style={styles.activeDot} />}
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={styles.outerContainer}>
      <View style={[
        styles.blurWrapper,
        Platform.OS === 'android' && { backgroundColor: 'rgba(255,255,255,0.96)' }
      ]}>
        {/* PREFLIGHT FIX: BlurView iOS-only; Android uses safe solid surface */}
        {BlurViewIOS ? (
          <BlurViewIOS intensity={80} tint="light" style={styles.tabBar}>
            {renderTabs()}
          </BlurViewIOS>
        ) : (
          <View style={styles.tabBar}>{renderTabs()}</View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  blurWrapper: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.6)',
    overflow: 'hidden',
    ...theme.SHADOW,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  fabContainer: {
    marginTop: -30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.SHADOW,
    shadowOpacity: 0.3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.COLORS.primary,
    marginTop: 4,
  },
});
