import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');

const palette = {
  lavender: '#F5F3FF',
  white: '#FFFFFF',
  softPurple: '#8B5CF6',
  deepPurple: '#6D28D9',
};

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const { duration, calories, bpm } = useLocalSearchParams<{ duration: string, calories: string, bpm: string }>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(tabs)/workout')}>
           <Feather name="x" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        {/* 3D Graphic Placeholder - Based on Center of Image */}
        <Animated.View entering={ZoomIn.duration(800)} style={styles.graphicContainer}>
           <View style={styles.glowBg} />
           <MaterialCommunityIcons name="dumbbell" size={120} color={theme.colors.accent.primary} />
        </Animated.View>

        {/* Success Message */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.textSection}>
           <Text style={styles.title}>Workout{"\n"}Completed.</Text>
           <Text style={styles.subtitle}>Good Job! Here are your quick post-workout summary.</Text>
        </Animated.View>

        {/* Stats Row - Based on Center of Image */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.statsContainer}>
           <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: '#FF6B2C15' }]}>
                 <Feather name="clock" size={18} color="#FF6B2C" />
              </View>
              <Text style={styles.statVal}>{duration || '42'}</Text>
              <Text style={styles.statLabel}>Minute</Text>
           </View>
           
           <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: '#3B82F615' }]}>
                 <MaterialCommunityIcons name="fire" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.statVal}>{calories || '350'}</Text>
              <Text style={styles.statLabel}>kcal</Text>
           </View>

           <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: '#EF444415' }]}>
                 <MaterialCommunityIcons name="heart-pulse" size={18} color="#EF4444" />
              </View>
              <Text style={styles.statVal}>{bpm || '128'}</Text>
              <Text style={styles.statLabel}>BPM</Text>
           </View>
        </Animated.View>

        {/* Action Button - Based on Center of Image */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.footer}>
           <TouchableOpacity 
             style={styles.doneBtn} 
             activeOpacity={0.9}
             onPress={() => router.replace('/(tabs)/workout')}
           >
              <Text style={styles.doneBtnText}>Complete</Text>
              <Feather name="check" size={20} color="white" />
           </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, padding: 24, alignItems: 'center' },
  
  closeBtn: {
    alignSelf: 'flex-start',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  graphicContainer: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBg: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.accent.primary,
    opacity: 0.1,
  },

  textSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 60,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statVal: {
    fontSize: 24,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 2,
  },

  footer: {
    width: '100%',
  },
  doneBtn: {
    backgroundColor: 'black',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 64,
    borderRadius: 32,
    ...theme.shadow.premium,
  },
  doneBtnText: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
});
