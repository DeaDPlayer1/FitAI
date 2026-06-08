import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { signInUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxAttempts = 5, windowMs = 30000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxAttempts) return false;
  entry.count++;
  return true;
}

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active state for input highlights
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Animations
  const mountOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(60)).current;
  const brandScale = useRef(new Animated.Value(0.85)).current;

  // Active borders
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mountOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslateY, {
        toValue: 0,
        damping: 18,
        stiffness: 90,
        useNativeDriver: true,
      }),
      Animated.spring(brandScale, {
        toValue: 1,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateFocus = (anim: Animated.Value, focused: boolean) => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Please fill in all fields.');
      return;
    }
    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Please enter a valid email address.');
      return;
    }
    if (!checkRateLimit(trimmedEmail)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Too many attempts. Please wait 30 seconds.');
      return;
    }
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Timeout the Supabase call so loading never hangs forever
      await Promise.race([
        signInUser(trimmedEmail, password),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Check your connection.')), 15000)
        ),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // RULE: Don't call setUser or navigate here — the onAuthStateChange
      // listener in _layout.tsx handles state updates, and the route guard
      // handles navigation. This prevents race conditions between the
      // login screen and the auth system.
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.message || 'Login failed.';
      if (msg.includes('Invalid login')) setError('Wrong email or password.');
      else if (msg.includes('User not found')) setError('User not found.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const emailBorderColor = emailBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(109, 40, 217, 0.08)', '#8B5CF6'],
  });

  const passwordBorderColor = passwordBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(109, 40, 217, 0.08)', '#8B5CF6'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6D28D9', '#8B5CF6', '#C4B5FD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            {/* Top visual branding section */}
            <Animated.View style={[styles.brandSection, { opacity: mountOpacity, transform: [{ scale: brandScale }] }]}>
              <View style={styles.logoRow}>
                <View style={styles.logoBadge}>
                  <Feather name="activity" size={24} color="white" />
                </View>
                <Text style={styles.logoText}>FitAI</Text>
              </View>
              <Text style={styles.brandTitle}>Welcome Back</Text>
              <Text style={styles.brandSubtitle}>Train Smart. Eat Right. Perform Best.</Text>
            </Animated.View>

            {/* Bottom floating auth card section */}
            <Animated.View style={[styles.authCard, { transform: [{ translateY: cardTranslateY }] }]}>
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.cardScrollContent}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Sign In</Text>
                  <Text style={styles.cardSubtitle}>Access your premium fit profile</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                  {/* Email Address */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <Animated.View style={[styles.inputWrap, { borderColor: emailBorderColor }]}>
                      <Feather name="mail" size={18} color={emailFocused ? '#8B5CF6' : theme.colors.text.muted} style={styles.fieldIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="name@example.com"
                        placeholderTextColor={theme.colors.text.disabled}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={(val) => {
                          setEmail(val);
                          if (error) setError('');
                        }}
                        onFocus={() => {
                          setEmailFocused(true);
                          animateFocus(emailBorderAnim, true);
                        }}
                        onBlur={() => {
                          setEmailFocused(false);
                          animateFocus(emailBorderAnim, false);
                        }}
                      />
                    </Animated.View>
                  </View>

                  {/* Password */}
                  <View style={styles.inputGroup}>
                    <View style={styles.passwordHeader}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <TouchableOpacity 
                        activeOpacity={0.7}
                        onPress={async () => {
                          if (!email.trim()) {
                            Alert.alert('Email Required', 'Please enter your email address first.');
                            return;
                          }
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          try {
                            await supabase.auth.resetPasswordForEmail(email.trim());
                            Alert.alert('Check Your Inbox', 'If an account exists, a password reset link has been sent.');
                          } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to send reset email.');
                          }
                        }}
                      >
                        <Text style={styles.forgotText}>Forgot password?</Text>
                      </TouchableOpacity>
                    </View>
                    <Animated.View style={[styles.inputWrap, { borderColor: passwordBorderColor }]}>
                      <Feather name="lock" size={18} color={passwordFocused ? '#8B5CF6' : theme.colors.text.muted} style={styles.fieldIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="••••••••"
                        placeholderTextColor={theme.colors.text.disabled}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={(val) => {
                          setPassword(val);
                          if (error) setError('');
                        }}
                        onFocus={() => {
                          setPasswordFocused(true);
                          animateFocus(passwordBorderAnim, true);
                        }}
                        onBlur={() => {
                          setPasswordFocused(false);
                          animateFocus(passwordBorderAnim, false);
                        }}
                      />
                      <TouchableOpacity 
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setShowPassword(!showPassword);
                        }}
                        style={styles.eyeBtn}
                      >
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.colors.text.muted} />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  {error ? (
                    <View style={styles.errorBox}>
                      <Feather name="alert-circle" size={16} color={theme.colors.status.danger} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {/* Login CTA */}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.loginBtn}
                    disabled={loading}
                    onPress={handleLogin}
                  >
                    <LinearGradient
                      colors={['#8B5CF6', '#6D28D9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.loginBtnText}>Login</Text>
                    )}
                  </TouchableOpacity>

                  {/* Social Login */}
                  <View style={styles.socialDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialRow}>
                    <TouchableOpacity
                      style={styles.socialIconBtn}
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        try {
                          await supabase.auth.signInWithOAuth({ provider: 'google' });
                        } catch (err: any) {
                          Alert.alert('OAuth Error', err.message);
                        }
                      }}
                    >
                      <FontAwesome5 name="google" size={16} color="#EA4335" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.socialIconBtn}
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        try {
                          await supabase.auth.signInWithOAuth({ provider: 'apple' });
                        } catch (err: any) {
                          Alert.alert('OAuth Error', err.message);
                        }
                      }}
                    >
                      <FontAwesome5 name="apple" size={18} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.socialIconBtn}
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        try {
                          await supabase.auth.signInWithOAuth({ provider: 'facebook' });
                        } catch (err: any) {
                          Alert.alert('OAuth Error', err.message);
                        }
                      }}
                    >
                      <FontAwesome5 name="facebook-f" size={16} color="#1877F2" />
                    </TouchableOpacity>
                  </View>

                  {/* Signup Route */}
                    <TouchableOpacity 
                      activeOpacity={0.7}
                      onPress={() => router.push('/onboarding/welcome')}
                      style={styles.signUpLink}
                    >
                      <Text style={styles.signUpText}>
                        Don't have an account? <Text style={styles.signUpTextHighlight}>Sign Up</Text>
                      </Text>
                    </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  brandSection: {
    paddingHorizontal: 32,
    paddingTop: height * 0.03,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
  brandTitle: {
    fontSize: 26,
    fontFamily: theme.font.family.heading,
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  authCard: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  cardScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 20 : 24,
  },
  cardHeader: {
    marginBottom: 22,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 12,
    fontFamily: theme.font.family.bold,
    color: '#8B5CF6',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.primary,
  },
  eyeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: theme.colors.status.danger,
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    flex: 1,
  },
  loginBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
  socialDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  dividerText: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  signUpLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  signUpText: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  signUpTextHighlight: {
    fontFamily: theme.font.family.bold,
    color: '#8B5CF6',
  },
});