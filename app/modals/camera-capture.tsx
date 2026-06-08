import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { analyzeImageWithAI } from '@/lib/nutritionAI';

type UIState = 'idle' | 'capturing' | 'processing';

export default function CameraCaptureModal() {
  const router = useRouter();
  const { user } = useUserStore();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [uiState, setUIState] = useState<UIState>('idle');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted]);

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

  const capturePhoto = async () => {
    if (!cameraRef.current || uiState !== 'idle') return;
    setUIState('capturing');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 }) as any;
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
          foodName: result.name,
          calories: String(result.calories),
          protein: String(result.protein),
          carbs: String(result.carbs),
          fat: String(result.fat),
          fiber: String(result.fiber),
          serving: result.serving,
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
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
        >
          <Feather name="x" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.overlayContent}>
          <View style={styles.focusFrame}>
            <View style={styles.focusBorder} />
            <Text style={styles.focusLabel}>Place food here</Text>
          </View>
          <Text style={styles.hintText}>Get close and fill the frame</Text>
        </View>

        <View style={styles.bottomRow}>
          {uiState === 'processing' && selectedImageUri ? (
            <View style={styles.processingOverlay}>
              <Image source={{ uri: selectedImageUri }} style={styles.thumbnail} />
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.thumbnailSpinner} />
              <Text style={styles.processingText}>Analysing your food...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.captureBtn}
              onPress={capturePhoto}
              disabled={uiState !== 'idle'}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  closeBtn: {
    position: 'absolute', top: 60, left: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  overlayContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  focusFrame: {
    width: 260, height: 260, borderRadius: 16,
    borderWidth: 2, borderColor: theme.colors.primary + '80',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  focusBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16, borderWidth: 2, borderColor: theme.colors.primary,
  },
  focusLabel: {
    fontSize: 13, fontWeight: '600', color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
  },
  bottomRow: {
    alignItems: 'center', paddingBottom: 60,
  },
  captureBtn: {
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
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 16,
  },
  thumbnail: { width: 40, height: 40, borderRadius: 8 },
  thumbnailSpinner: { position: 'absolute', left: 10, top: 10 },
  processingText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
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
