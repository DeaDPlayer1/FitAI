import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { theme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecoveryFlow] = useState(params.type === 'recovery');

  const mountOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(60)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(mountOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(cardTranslateY, { toValue: 0, damping: 18, stiffness: 90, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleReset = async () => {
    if (!password || password.length < 8) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Password Updated',
        'Your password has been changed successfully.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err.message || 'Failed to update password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6D28D9', '#8B5CF6', '#C4B5FD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <Animated.View style={[styles.brandSection, { opacity: mountOpacity }]}>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Feather name="lock" size={24} color="white" />
              </View>
              <Text style={styles.logoText}>FitAI</Text>
            </View>
            <Text style={styles.brandTitle}>Reset Password</Text>
            <Text style={styles.brandSubtitle}>Enter your new password below</Text>
          </Animated.View>

          <Animated.View style={[styles.authCard, { transform: [{ translateY: cardTranslateY }] }]}>
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputWrap}>
                  <Feather name="lock" size={18} color={theme.colors.text.muted} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor={theme.colors.text.disabled}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(val) => { setPassword(val); if (error) setError(''); }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.colors.text.muted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrap}>
                  <Feather name="shield" size={18} color={theme.colors.text.muted} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter your password"
                    placeholderTextColor={theme.colors.text.disabled}
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={(val) => { setConfirmPassword(val); if (error) setError(''); }}
                  />
                </View>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={16} color={theme.colors.status.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.resetBtn}
                disabled={loading}
                onPress={handleReset}
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
                  <Text style={styles.resetBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.replace('/(auth)/login')}
                style={styles.backLink}
              >
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  brandSection: { paddingHorizontal: 32, paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  logoBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 20, fontFamily: theme.font.family.bold, color: 'white' },
  brandTitle: { fontSize: 26, fontFamily: theme.font.family.heading, color: 'white', textAlign: 'center', marginBottom: 4 },
  brandSubtitle: { fontSize: 13, fontFamily: theme.font.family.medium, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' },
  authCard: { flex: 1, backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 32 },
  formContainer: { gap: 20 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontFamily: theme.font.family.semibold, color: theme.colors.text.primary, marginLeft: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 1.5, borderColor: 'rgba(109, 40, 217, 0.15)', borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#F9FAFB' },
  fieldIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 15, fontFamily: theme.font.family.medium, color: theme.colors.text.primary },
  eyeBtn: { padding: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12 },
  errorText: { color: theme.colors.status.danger, fontSize: 13, fontFamily: theme.font.family.medium, flex: 1 },
  resetBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: 6, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  resetBtnText: { fontSize: 16, fontFamily: theme.font.family.bold, color: 'white' },
  backLink: { alignItems: 'center', marginTop: 16 },
  backLinkText: { fontSize: 14, fontFamily: theme.font.family.bold, color: '#8B5CF6' },
});
