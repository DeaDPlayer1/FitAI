import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signUpUser, updateUserProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { COLORS } from '@/constants/theme';

export default function CreateAccountScreen() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const { data } = useOnboardingStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [focused, setFocused] = useState<string | null>(null);

  const passwordsMatch = password === confirmPassword;
  const isValid = name.trim() && email.trim() && password.length >= 8 && passwordsMatch;

  const mapGoalToEnum = (goal: string | null): string => {
    switch (goal) {
      case 'fat_loss': return 'fat_loss';
      case 'muscle_gain': return 'muscle_gain';
      case 'endurance': return 'strength';
      case 'active': return 'maintenance';
      default: return 'fat_loss';
    }
  };

  const handleSignUp = async () => {
    if (!isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
      } else if (password.length < 8) {
        setError('Password must be at least 8 characters.');
      } else {
        setError('Please fill in all fields.');
      }
      return;
    }
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const profile = await Promise.race([
        signUpUser(email.trim(), password, name.trim()),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Check your connection.')), 15000)
        ),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(profile);
      await AsyncStorage.setItem('@has_account', 'true').catch(() => {});

      await updateUserProfile(profile.id, {
        name: name.trim(),
        app_mode: 'normal',
        onboarding_complete: false,
        health_profile: {
          goal: mapGoalToEnum(data.goal) as any,
          age: data.age ? parseInt(data.age) : null,
          height: data.height ? parseFloat(data.height) : null,
          heightUnit: data.heightUnit,
          weight: data.weight ? parseFloat(data.weight) : null,
          weightUnit: data.weightUnit,
          experience_level: (data.experienceLevel ?? null) as any,
          equipment: (data.equipment ?? null) as any,
          available_days: data.frequency ?? null,
          conditions: [],
          gender: null,
          targetWeight: null,
          activity_level: null,
          diet_type: null,
          injuries: null,
          sleep_hours: null,
          stress_level: null,
          cardio_preference: null,
        },
      });

      await updateUserProfile(profile.id, { onboarding_complete: true });

      setUser({ ...profile, onboarding_complete: true });
      router.replace('/onboarding/summary');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.message || 'Signup failed.';
      if (msg.includes('already registered')) setError('An account with this email already exists.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    try {
      await supabase.auth.signInWithOAuth({ provider });
    } catch (err: any) {
      Alert.alert('OAuth Error', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#1B1B1F" />
          </TouchableOpacity>
          <View style={styles.dotsRow}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={[styles.dot, i <= 6 && styles.dotActive]} />
            ))}
          </View>
          <View style={styles.backBtn} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subtitle}>Free forever. No credit card needed.</Text>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={[styles.inputWrap, focused === 'name' && styles.inputWrapFocused]}>
              <Ionicons name="person-outline" size={18} color={focused === 'name' ? '#6A49FA' : '#AEAEB2'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#D1D5DB"
                autoCapitalize="words"
                value={name}
                onChangeText={(v) => { setName(v); setError(''); }}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={[styles.inputWrap, focused === 'email' && styles.inputWrapFocused]}>
              <Ionicons name="mail-outline" size={18} color={focused === 'email' ? '#6A49FA' : '#AEAEB2'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#D1D5DB"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={[styles.inputWrap, focused === 'password' && styles.inputWrapFocused]}>
              <Ionicons name="lock-closed-outline" size={18} color={focused === 'password' ? '#6A49FA' : '#AEAEB2'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Min. 8 characters"
                placeholderTextColor="#D1D5DB"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(''); }}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#AEAEB2" />
              </TouchableOpacity>
            </View>
            {password.length > 0 && password.length < 8 && (
              <Text style={styles.hint}>At least 8 characters needed</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <View style={[styles.inputWrap, focused === 'confirm' && styles.inputWrapFocused]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={focused === 'confirm' ? '#6A49FA' : '#AEAEB2'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#D1D5DB"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused(null)}
              />
            </View>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.hint}>Passwords do not match</Text>
            )}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.signupBtn, (!isValid || loading) && styles.signupBtnDisabled]}
            disabled={!isValid || loading}
            onPress={handleSignUp}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.signupBtnText, (!isValid || loading) && styles.signupBtnTextDisabled]}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialBtn} onPress={() => handleOAuth('google')}>
            <Ionicons name="logo-google" size={20} color="#1B1B1F" />
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn} onPress={() => handleOAuth('apple')}>
            <Ionicons name="logo-apple" size={20} color="#1B1B1F" />
            <Text style={styles.socialBtnText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkHighlight}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5FB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  dotActive: { backgroundColor: '#6A49FA', width: 20, borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingTop: 16, paddingBottom: 24 },
  heading: { fontSize: 28, fontWeight: '800', color: '#1B1B1F', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6E6E73', marginBottom: 24 },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 14, fontWeight: '600', color: '#1B1B1F',
    marginBottom: 8, marginLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderRadius: 14,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  inputWrapFocused: { borderColor: '#6A49FA' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1B1B1F', padding: 0 },
  eyeBtn: { padding: 4 },
  hint: { fontSize: 12, color: '#6E6E73', marginTop: 4, marginLeft: 4 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 12,
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '500', flex: 1 },
  signupBtn: {
    backgroundColor: '#6A49FA', borderRadius: 16, height: 54,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: '#6A49FA', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  signupBtnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  signupBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  signupBtnTextDisabled: { color: '#9CA3AF' },
  divider: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 13, color: '#AEAEB2', fontWeight: '600' },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 50, borderRadius: 14,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  socialBtnText: { fontSize: 15, fontWeight: '600', color: '#1B1B1F' },
  loginLink: { alignItems: 'center', marginTop: 8, paddingVertical: 8 },
  loginLinkText: { fontSize: 14, color: '#6E6E73', fontWeight: '500' },
  loginLinkHighlight: { color: '#6A49FA', fontWeight: '700' },
});
