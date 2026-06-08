import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textTranslate = useSharedValue(20);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslate.value }],
  }));

  return (
    <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={styles.container}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoMark}>
          <Feather name="activity" size={40} color="#C4B5FD" />
        </View>
      </Animated.View>
      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={styles.brandName}>FitAI</Text>
        <Text style={styles.tagline}>Your AI Coach. Personalized.</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  logoWrap: {
    marginBottom: 20,
  },
  logoMark: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(196, 181, 253, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  textWrap: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 48, fontWeight: '800', color: '#F5F5F5',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 14, color: '#8B5CF6', marginTop: 6,
    letterSpacing: 0.5,
  },
});
