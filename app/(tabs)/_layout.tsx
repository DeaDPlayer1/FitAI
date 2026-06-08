import React from 'react';
import { Tabs } from 'expo-router';
import FloatingTabBar from '@/components/ui/FloatingTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />
      <Tabs.Screen
        name="train"
        options={{ title: 'Training' }}
      />
      {/* stats is removed from visible tabs by the custom TabBar, but we hide it natively just in case */}
      <Tabs.Screen
        name="stats"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="food"
        options={{ title: 'Nutrition' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
      <Tabs.Screen
        name="workout"
        options={{ title: 'Workout', href: null }}
      />
      <Tabs.Screen
        name="ai-dashboard"
        options={{ title: 'AI Dashboard' }}
      />
    </Tabs>
  );
}
