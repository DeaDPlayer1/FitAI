import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const DOT_COUNT = 8;

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/goal');
  };

  return (
    <LinearGradient colors={['#6A49FA', '#453284']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topSection}>
          <Animated.View style={[styles.iconRing, { opacity: fadeIn }]}>
            <View style={styles.iconInner}>
              <Ionicons name="barbell" size={64} color="#FFFFFF" />
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.bottomSection, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
          <Text style={styles.badge}>BUILT FOR RESULTS</Text>
          <Text style={styles.title}>Your Elite{'\n'}Fitness Coach</Text>
          <Text style={styles.subtitle}>
            AI-powered workouts, smart nutrition,{'\n'}real-time guidance.
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.ctaButton}
            onPress={handleStart}
          >
            <Text style={styles.ctaText}>Let's Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#453284" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.dotsRow}>
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, justifyContent: 'space-between' },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: height * 0.06,
  },
  iconRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  iconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.60)',
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 24,
    marginBottom: 36,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 56,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#453284',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
});
