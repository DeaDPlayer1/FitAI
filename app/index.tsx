import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface OnboardingPage {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Feather.glyphMap | string;
  isMci?: boolean;
  colors: string[];
}

const PAGES: OnboardingPage[] = [
  {
    id: '1',
    title: 'Train Smarter',
    subtitle: 'AI-DRIVEN WORKOUTS',
    description: 'Get dynamic, adaptive training routines tailored to your muscles and equipment. Let our AI elevate every lift.',
    icon: 'zap',
    colors: ['#6D28D9', '#8B5CF6'],
  },
  {
    id: '2',
    title: 'Track Nutrition',
    subtitle: 'MACROS & HYDRATION',
    description: 'Log your food easily with AI macro breakdowns. Maintain the perfect balance of calories, protein, and water.',
    icon: 'coffee',
    colors: ['#7C3AED', '#A78BFA'],
  },
  {
    id: '3',
    title: 'Adaptive Coach',
    subtitle: 'YOUR PULSE AI PARTNER',
    description: 'Receive real-time chat guidance, fitness analytics, and progress tracking like a personal trainer in your pocket.',
    icon: 'cpu',
    colors: ['#4C1D95', '#7C3AED'],
  },
];

export default function WelcomeOnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  // Animated values for transitions
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/login');
  };

  const onMomentumScrollEnd = (e: any) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setActiveIndex(index);
  };

  const renderItem = ({ item, index }: { item: OnboardingPage; index: number }) => {
    // Parallax & scale interpolation
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [60, 0, -60],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.pageWrapper, { width }]}>
        <LinearGradient
          colors={item.colors}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Decorative Grid Lines / Spheres */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <SafeAreaView style={styles.safeArea}>
          <Animated.View 
            style={[
              styles.cardContainer,
              { 
                opacity,
                transform: [
                  { scale },
                  { translateY }
                ] 
              }
            ]}
          >
            {/* Visual Icon Box */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Feather name={item.icon as any} size={48} color="white" />
              </View>
            </View>

            {/* Typography Section */}
            <View style={styles.textContainer}>
              <Text style={styles.pageSubtitle}>{item.subtitle}</Text>
              <Text style={styles.pageTitle}>{item.title}</Text>
              <Text style={styles.pageDescription}>{item.description}</Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={PAGES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Floating Bottom Navigation Container */}
      <View style={styles.bottomNavContainer}>
        {/* Skip button / Left */}
        {activeIndex < PAGES.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyButtonSpace} />
        )}

        {/* Center Indicators */}
        <View style={styles.indicatorsContainer}>
          {PAGES.map((_, index) => {
            const widthAnim = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [8, 20, 8],
              extrapolate: 'clamp',
            });
            const opacityAnim = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { 
                    width: widthAnim,
                    opacity: opacityAnim
                  }
                ]}
              />
            );
          })}
        </View>

        {/* Right Action Button */}
        <TouchableOpacity onPress={handleNext} style={[styles.nextBtn, activeIndex === PAGES.length - 1 && styles.getStartedBtn]}>
          <Text style={styles.nextBtnText}>
            {activeIndex === PAGES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          {activeIndex < PAGES.length - 1 && (
            <Feather name="arrow-right" size={16} color="white" style={{ marginLeft: 6 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  pageWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 32,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  pageSubtitle: {
    fontSize: 11,
    fontFamily: theme.font.family.bold,
    color: '#D1D5DB',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: theme.font.family.heading,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  pageDescription: {
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 24,
    left: 24,
    right: 24,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
    }),
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  skipBtnText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontFamily: theme.font.family.semibold,
  },
  emptyButtonSpace: {
    width: 48,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  getStartedBtn: {
    backgroundColor: '#8B5CF6',
  },
  nextBtnText: {
    color: 'black',
    fontSize: 14,
    fontFamily: theme.font.family.bold,
  },
});
