import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, Easing, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { analyzeImageWithAI } from '@/lib/nutritionAI';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

const CAMERA_GUIDANCE_KEY = 'has_seen_camera_guidance';

type UIState = 'idle' | 'capturing' | 'processing';
type FlashMode = 'off' | 'on' | 'auto';

function CameraCaptureModal() {
  const router = useRouter();
  const { user } = useUserStore();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [uiState, setUIState] = useState<UIState>('idle');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [showGrid, setShowGrid] = useState(false);
  const [showGuidance, setShowGuidance] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const pulse = useSharedValue(1);
  const shutterScale = useSharedValue(1);
  const gridOpacity = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true
    );
  }, []);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted]);

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(CAMERA_GUIDANCE_KEY);
        if (seen === 'true') setShowGuidance(false);
        else setShowGuidance(true);
      } catch {
        setShowGuidance(true);
      }
    })();
  }, []);

  const dismissGuidance = useCallback(async () => {
    if (dontShowAgain) {
      await AsyncStorage.setItem(CAMERA_GUIDANCE_KEY, 'true').catch(() => {});
    }
    setShowGuidance(false);
  }, [dontShowAgain]);

  const triggerHaptic = useCallback(async () => {
    try {
      const Haptics = await import('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  }, []);

  const animateShutter = useCallback(async () => {
    shutterScale.value = withSequence(
      withTiming(0.8, { duration: 80 }),
      withTiming(1.1, { duration: 120 }),
      withTiming(1, { duration: 100 }),
    );
  }, [shutterScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const shutterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  const gridStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => {
      const next = !prev;
      gridOpacity.value = withTiming(next ? 1 : 0, { duration: 200 });
      return next;
    });
  }, [gridOpacity]);

  const pickFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Photo library access is needed to import food images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled) return;
      setSelectedImageUri(result.assets[0].uri);
      setUIState('processing');
      try {
        const analysisResult = await analyzeImageWithAI(result.assets[0].uri, user?.id);
        (router as any).replace({
          pathname: '/modals/confirm-food',
          params: {
            imageUri: result.assets[0].uri,
            aiDescription: analysisResult.ai_description,
            items: JSON.stringify(analysisResult.items),
            inputType: 'gallery',
          },
        });
      } catch (err: any) {
        setUIState('idle');
        const msg = err.message?.includes('No food detected')
          ? 'No food detected. Try a clearer photo.'
          : 'Analysis failed. Try again.';
        alert(msg);
      }
    } catch {}
  }, [router, user]);

  const capturePhoto = useCallback(async () => {
    if (!cameraRef.current || uiState !== 'idle') return;
    setUIState('capturing');
    await triggerHaptic();
    animateShutter();
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        ...(flash !== 'off' ? {} : {}),
      }) as any;
      if (!photo) throw new Error('No photo captured');
      const uri = photo.uri;
      setSelectedImageUri(uri);
      setUIState('processing');

      const result = await analyzeImageWithAI(uri, user?.id);
      (router as any).replace({
        pathname: '/modals/confirm-food',
        params: {
          imageUri: uri,
          aiDescription: result.ai_description,
          items: JSON.stringify(result.items),
          inputType: 'camera',
        },
      });
    } catch (err: any) {
      setUIState('idle');
      const msg = err.message?.includes('No food detected')
        ? 'No food detected. Try better lighting or get closer.'
        : 'Analysis failed. Try again or enter manually.';
      alert(msg);
    }
  }, [cameraRef, uiState, flash, triggerHaptic, animateShutter, router, user]);

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Feather name="camera-off" size={48} color={theme.colors.text.muted} />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>Camera access is needed to analyse food.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.manualBtn} onPress={() => router.back()}>
          <Text style={styles.manualBtnText}>Enter Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showGuidance) {
    return (
      <View style={styles.guidanceContainer}>
        <TouchableOpacity style={styles.guidanceCloseBtn} onPress={() => router.back()}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.guidanceIcon}>📸</Text>
        <Text style={styles.guidanceTitle}>Tips for Best Results</Text>

        <View style={styles.guidanceTip}>
          <Text style={styles.guidanceTipIcon}>📐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guidanceTipTitle}>Fill the frame</Text>
            <Text style={styles.guidanceTipText}>Get close to the food so it fills most of the viewfinder</Text>
          </View>
        </View>

        <View style={styles.guidanceTip}>
          <Text style={styles.guidanceTipIcon}>💡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guidanceTipTitle}>Good lighting</Text>
            <Text style={styles.guidanceTipText}>Avoid dark or backlit photos — natural light works best</Text>
          </View>
        </View>

        <View style={styles.guidanceTip}>
          <Text style={styles.guidanceTipIcon}>🍽️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.guidanceTipTitle}>Flat angle</Text>
            <Text style={styles.guidanceTipText}>Shoot from above or slightly angled for best recognition</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.guidanceBtn} onPress={dismissGuidance} activeOpacity={0.85}>
          <Text style={styles.guidanceBtnText}>Got it</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guidanceCheckboxRow}
          onPress={() => setDontShowAgain(prev => !prev)}
          activeOpacity={0.7}
        >
          <View style={[styles.guidanceCheckbox, dontShowAgain && styles.guidanceCheckboxActive]}>
            {dontShowAgain && <Feather name="check" size={12} color="#FFFFFF" />}
          </View>
          <Text style={styles.guidanceCheckboxLabel}>Don't show again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flash}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topBarBtn}
            onPress={() => router.back()}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Food Scanner</Text>

          <TouchableOpacity
            style={styles.topBarBtn}
            onPress={toggleGrid}
          >
            <Feather name="grid" size={20} color={showGrid ? theme.colors.warning : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        {showGrid && (
          <Animated.View style={[styles.gridOverlay, gridStyle]} pointerEvents="none">
            <View style={styles.gridLineV1} />
            <View style={styles.gridLineV2} />
            <View style={styles.gridLineH1} />
            <View style={styles.gridLineH2} />
          </Animated.View>
        )}

        <View style={styles.centerContent}>
          <Animated.View style={[styles.focusFrame, pulseStyle]}>
            <View style={styles.focusBorder} />
            <View style={styles.focusCornerTL} />
            <View style={styles.focusCornerTR} />
            <View style={styles.focusCornerBL} />
            <View style={styles.focusCornerBR} />
            <Text style={styles.focusLabel}>Photograph your actual food, not a screen or packaging</Text>
          </Animated.View>

          <View style={styles.referenceRow}>
            <View style={styles.referenceCard}>
              <View style={styles.referenceCardInner} />
              <Text style={styles.referenceLabel}>Card</Text>
            </View>
            <View style={styles.referenceCoin}>
              <View style={styles.referenceCoinInner} />
              <Text style={styles.referenceLabel}>Coin</Text>
            </View>
          </View>

          <Text style={styles.guidanceText}>Get close · Good light · Single meal preferred</Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.sideBtn}
            onPress={pickFromGallery}
          >
            <Feather name="image" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {uiState === 'processing' && selectedImageUri ? (
            <View style={styles.processingOverlay}>
              <Image source={{ uri: selectedImageUri }} style={styles.thumbnail} />
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.processingText}>Analysing...</Text>
            </View>
          ) : (
            <Animated.View style={shutterStyle}>
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={capturePhoto}
                disabled={uiState !== 'idle'}
                activeOpacity={0.8}
              >
                <View style={styles.captureOuter}>
                  <View style={styles.captureInner} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          <TouchableOpacity
            style={styles.sideBtn}
            onPress={() => setFlash(prev => prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off')}
          >
            <Feather
              name={flash === 'off' ? 'zap-off' : 'zap'}
              size={20}
              color={flash === 'off' ? 'rgba(255,255,255,0.5)' : theme.colors.warning}
            />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

export default withErrorBoundary(CameraCaptureModal, 'Could not load camera');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topBarBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16, fontWeight: '700', color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  gridOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  gridLineV1: {
    position: 'absolute', left: '33.33%', top: 0, bottom: 0,
    width: 0.5, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridLineV2: {
    position: 'absolute', left: '66.66%', top: 0, bottom: 0,
    width: 0.5, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridLineH1: {
    position: 'absolute', top: '33.33%', left: 0, right: 0,
    height: 0.5, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridLineH2: {
    position: 'absolute', top: '66.66%', left: 0, right: 0,
    height: 0.5, backgroundColor: 'rgba(255,255,255,0.2)',
  },

  centerContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  focusFrame: {
    width: 250, height: 250, borderRadius: 20,
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  focusBorder: {
    position: 'absolute', top: 2, left: 2, right: 2, bottom: 2,
    borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
  },
  focusCornerTL: {
    position: 'absolute', top: 0, left: 0,
    width: 24, height: 24,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderColor: theme.colors.primary,
    borderTopLeftRadius: 12,
  },
  focusCornerTR: {
    position: 'absolute', top: 0, right: 0,
    width: 24, height: 24,
    borderTopWidth: 3, borderRightWidth: 3,
    borderColor: theme.colors.primary,
    borderTopRightRadius: 12,
  },
  focusCornerBL: {
    position: 'absolute', bottom: 0, left: 0,
    width: 24, height: 24,
    borderBottomWidth: 3, borderLeftWidth: 3,
    borderColor: theme.colors.primary,
    borderBottomLeftRadius: 12,
  },
  focusCornerBR: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24,
    borderBottomWidth: 3, borderRightWidth: 3,
    borderColor: theme.colors.primary,
    borderBottomRightRadius: 12,
  },
  focusLabel: {
    fontSize: 13, fontWeight: '600', color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 10, overflow: 'hidden',
    letterSpacing: 0.3,
  },

  referenceRow: {
    flexDirection: 'row', gap: 24, alignItems: 'center',
    marginTop: 20,
  },
  referenceCard: {
    width: 56, height: 36, borderRadius: 4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  referenceCardInner: {
    width: 44, height: 26, borderRadius: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  referenceCoin: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  referenceCoinInner: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  referenceLabel: {
    position: 'absolute', bottom: -16,
    fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.45)',
  },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16, paddingHorizontal: 32,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sideBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtn: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  captureOuter: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: '#FFFFFF',
  },

  processingOverlay: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 20,
  },
  thumbnail: { width: 40, height: 40, borderRadius: 10 },
  processingText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  guidanceContainer: {
    flex: 1, backgroundColor: '#1A1A2E',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 60,
  },
  guidanceCloseBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 40, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  guidanceIcon: { fontSize: 56, marginBottom: 12 },
  guidanceTitle: {
    fontSize: 22, fontWeight: '800', color: '#FFFFFF',
    marginBottom: 28, textAlign: 'center',
  },
  guidanceTip: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 16, marginBottom: 12,
    width: '100%',
  },
  guidanceTipIcon: { fontSize: 28, marginTop: 2 },
  guidanceTipTitle: {
    fontSize: 16, fontWeight: '700', color: '#FFFFFF',
    marginBottom: 4,
  },
  guidanceTipText: {
    fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  guidanceBtn: {
    backgroundColor: '#6C3CE1',
    paddingVertical: 16, paddingHorizontal: 48,
    borderRadius: 16, marginTop: 20, width: '100%', alignItems: 'center',
  },
  guidanceBtnText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  guidanceCheckboxRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 16, paddingVertical: 8,
  },
  guidanceCheckbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  guidanceCheckboxActive: {
    backgroundColor: '#6C3CE1', borderColor: '#6C3CE1',
  },
  guidanceCheckboxLabel: {
    fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)',
  },

  guidanceText: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3, marginTop: 28,
    backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 8, overflow: 'hidden',
  },

  permissionContainer: {
    flex: 1, backgroundColor: theme.colors.background,
    alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12,
  },
  permissionTitle: {
    fontSize: 20, fontWeight: '800', color: theme.colors.text.primary,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14, fontWeight: '500', color: theme.colors.text.muted,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: theme.colors.primary, paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 16, marginTop: 12,
  },
  permissionBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  manualBtn: { paddingVertical: 12 },
  manualBtnText: { fontSize: 14, fontWeight: '700', color: theme.colors.text.muted },
});
