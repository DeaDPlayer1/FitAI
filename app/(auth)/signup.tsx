import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { signUpUser } from '@/lib/auth';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

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

const GOAL_OPTIONS = ['Build Muscle', 'Lose Weight', 'Endurance', 'General Fitness'];

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [goal, setGoal] = useState('Build Muscle');
  const [weight, setWeight] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Active state states for input highlights
  const [focusField, setFocusField] = useState<string | null>(null);

  // Animations
  const mountOpacity = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mountOpacity, {
        toValue: 1,
        duration: 800,
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

  // Validation
  const isPasswordValid = useMemo(() => PASSWORD_RE.test(password), [password]);
  const doPasswordsMatch = useMemo(() => password === confirmPassword && confirmPassword.length > 0, [password, confirmPassword]);

  const passwordStrength = useMemo(() => {
    if (!password) return { text: 'Empty', color: '#D1D5DB', width: '0%' };
    if (password.length < 6) return { text: 'Too Weak', color: '#EF4444', width: '25%' };
    if (!/(?=.*[a-z])/.test(password)) return { text: 'Add lowercase', color: '#EF4444', width: '40%' };
    if (!/(?=.*[A-Z])/.test(password)) return { text: 'Add uppercase', color: '#EF4444', width: '40%' };
    if (!/(?=.*\d)/.test(password)) return { text: 'Add digit', color: '#EF4444', width: '40%' };
    if (!/(?=.*[!@#$%^&*])/.test(password)) return { text: 'Add symbol', color: '#EF4444', width: '50%' };
    if (password.length < 10) return { text: 'Moderate', color: '#F59E0B', width: '60%' };
    return { text: 'Strong', color: '#10B981', width: '100%' };
  }, [password]);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
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
    if (!isPasswordValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Password must be 8+ characters with uppercase, lowercase, digit, and special character.');
      return;
    }
    if (!doPasswordsMatch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Passwords do not match.');
      return;
    }
    
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Pass optional data to profile via metadata if needed or store
      const profile = await signUpUser(trimmedEmail, password, name.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // RULE: Don't call setUser or navigate here — the onAuthStateChange
      // listener in _layout.tsx handles state updates, and the route guard
      // handles navigation. Same pattern as login.tsx.
      router.replace('/onboarding/welcome');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6D28D9', '#8B5CF6', '#F5F3FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header Section */}
        <Animated.View style={[styles.brandSection, { opacity: mountOpacity, transform: [{ scale: brandScale }] }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="chevron-left" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <Feather name="activity" size={20} color="white" />
              <Text style={styles.logoText}>FitAI</Text>
            </View>
            <View style={{ width: 32 }} />
          </View>
          <Text style={styles.brandTitle}>Join FitAI</Text>
          <Text style={styles.brandSubtitle}>Your personalized AI-driven fitness journey starts here</Text>
        </Animated.View>

        {/* Bottom Curved White Card */}
        <View style={styles.authCard}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            style={{ flex: 1 }}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Create Account</Text>
                <Text style={styles.cardSubtitle}>Complete details to build your customized routine</Text>
              </View>

              {/* Form fields */}
              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={[styles.inputWrap, focusField === 'name' && styles.inputWrapActive]}>
                    <Feather name="user" size={18} color={focusField === 'name' ? '#8B5CF6' : theme.colors.text.muted} style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Your Name"
                      placeholderTextColor={theme.colors.text.disabled}
                      autoCapitalize="words"
                      value={name}
                      onChangeText={(val) => {
                        setName(val);
                        if (error) setError('');
                      }}
                      onFocus={() => setFocusField('name')}
                      onBlur={() => setFocusField(null)}
                    />
                  </View>
                </View>

                {/* Email Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={[styles.inputWrap, focusField === 'email' && styles.inputWrapActive]}>
                    <Feather name="mail" size={18} color={focusField === 'email' ? '#8B5CF6' : theme.colors.text.muted} style={styles.fieldIcon} />
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
                      onFocus={() => setFocusField('email')}
                      onBlur={() => setFocusField(null)}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.inputWrap, focusField === 'password' && styles.inputWrapActive]}>
                    <Feather name="lock" size={18} color={focusField === 'password' ? '#8B5CF6' : theme.colors.text.muted} style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Min. 8 characters"
                      placeholderTextColor={theme.colors.text.disabled}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (error) setError('');
                      }}
                      onFocus={() => setFocusField('password')}
                      onBlur={() => setFocusField(null)}
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
                  </View>
                  
                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <View style={styles.strengthBox}>
                      <View style={styles.strengthBarBg}>
                        <View 
                          style={[
                            styles.strengthBarFill, 
                            { width: passwordStrength.width as any, backgroundColor: passwordStrength.color }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                        {passwordStrength.text}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[styles.inputWrap, focusField === 'confirmPassword' && styles.inputWrapActive]}>
                    <Feather name="shield" size={18} color={focusField === 'confirmPassword' ? '#8B5CF6' : theme.colors.text.muted} style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Re-enter password"
                      placeholderTextColor={theme.colors.text.disabled}
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (error) setError('');
                      }}
                      onFocus={() => setFocusField('confirmPassword')}
                      onBlur={() => setFocusField(null)}
                    />
                  </View>
                  {confirmPassword.length > 0 && (
                    <View style={styles.confirmValidation}>
                      <Feather 
                        name={doPasswordsMatch ? 'check-circle' : 'x-circle'} 
                        size={12} 
                        color={doPasswordsMatch ? '#10B981' : '#EF4444'} 
                      />
                      <Text style={[styles.confirmValText, { color: doPasswordsMatch ? '#10B981' : '#EF4444' }]}>
                        {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Fitness Goal Selection (Pills) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fitness Goal</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.goalScroll}
                  >
                    {GOAL_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setGoal(opt);
                        }}
                        style={[styles.goalPill, goal === opt && styles.goalPillActive]}
                      >
                        <Text style={[styles.goalPillText, goal === opt && styles.goalPillTextActive]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Optional Weight */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Body Weight (Optional)</Text>
                  <View style={[styles.inputWrap, focusField === 'weight' && styles.inputWrapActive]}>
                    <MaterialCommunityIcons name="scale-bathroom" size={18} color={focusField === 'weight' ? '#8B5CF6' : theme.colors.text.muted} style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 75"
                      placeholderTextColor={theme.colors.text.disabled}
                      keyboardType="numeric"
                      value={weight}
                      onChangeText={(val) => {
                        setWeight(val);
                        if (error) setError('');
                      }}
                      onFocus={() => setFocusField('weight')}
                      onBlur={() => setFocusField(null)}
                    />
                    <Text style={styles.weightUnit}>kg</Text>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Feather name="alert-circle" size={16} color={theme.colors.status.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Register CTA */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.signupBtn}
                  disabled={loading}
                  onPress={handleSignup}
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
                    <Text style={styles.signupBtnText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                {/* Return to Login */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => router.back()}
                  style={styles.loginBackLink}
                >
                  <Text style={styles.loginBackText}>
                    Already have an account? <Text style={styles.loginBackHighlight}>Login</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
  brandTitle: {
    fontSize: 24,
    fontFamily: theme.font.family.heading,
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  authCard: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    ...theme.shadow.hero,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 50 : 34,
  },
  cardHeader: {
    marginBottom: 24,
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
    gap: 18,
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: 'rgba(109, 40, 217, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  inputWrapActive: {
    borderColor: '#8B5CF6',
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
  strengthBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginRight: 10,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 11,
    fontFamily: theme.font.family.bold,
  },
  confirmValidation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  confirmValText: {
    fontSize: 11,
    fontFamily: theme.font.family.medium,
  },
  goalScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  goalPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  goalPillActive: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  goalPillText: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  goalPillTextActive: {
    color: 'white',
    fontFamily: theme.font.family.bold,
  },
  weightUnit: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.muted,
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
  signupBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 10,
    ...theme.shadow.button,
  },
  signupBtnText: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
  loginBackLink: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  loginBackText: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  loginBackHighlight: {
    fontFamily: theme.font.family.bold,
    color: '#8B5CF6',
  },
});
