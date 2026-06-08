import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { theme } from '@/constants/theme';
import { lookupBarcode } from '@/lib/barcodeService';

type UIState = 'permission' | 'scanning' | 'loading' | 'error';

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [uiState, setUIState] = useState<UIState>('scanning');
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted]);

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || uiState === 'loading') return;
    setScanned(true);
    setUIState('loading');

    try {
      const barcode = result.data;
      const product = await lookupBarcode(barcode);

      if (product) {
        (router as any).replace({
          pathname: '/modals/barcode-result',
          params: {
            barcode: product.barcode,
            name: product.name,
            brand: product.brand,
            serving_size: product.serving_size,
            quantity: product.quantity,
            image_url: product.image_url || '',
            calories_100g: String(product.calories_100g),
            protein_100g: String(product.protein_100g),
            carbs_100g: String(product.carbs_100g),
            fat_100g: String(product.fat_100g),
            fiber_100g: String(product.fiber_100g),
            sugar_100g: String(product.sugar_100g),
            sodium_100g: String(product.sodium_100g),
          },
        });
      } else {
        setUIState('scanning');
        setScanned(false);
        Alert.alert(
          'Product Not Found',
          'This barcode was not found in our database. Would you like to enter nutrition manually?',
          [
            { text: 'Scan Again', onPress: () => setScanned(false) },
            { text: 'Enter Manually', onPress: () => router.back() },
          ]
        );
      }
    } catch {
      setUIState('scanning');
      setScanned(false);
      Alert.alert('Error', 'Scan failed. Check your connection and try again.');
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Camera permission is required to scan barcodes.</Text>
        <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.settingsBtn}>
          <Text style={styles.settingsBtnText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.colors.text.muted, fontSize: 14 }}>Enter Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        enableTorch={torch}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Barcode</Text>
            <TouchableOpacity onPress={() => setTorch(t => !t)} style={styles.torchBtn}>
              <Text style={styles.torchText}>🔦</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.middle}>
            <View style={styles.scanBox}>
              <ScanningLine />
            </View>
            <Text style={styles.hint}>
              {uiState === 'loading' ? 'Looking up product...' : 'Align barcode within the frame'}
            </Text>
            {uiState === 'loading' && <ActivityIndicator color="#6C3CE1" style={{ marginTop: 16 }} />}
          </View>

          <View style={styles.bottom}>
            {scanned && uiState !== 'loading' && (
              <TouchableOpacity onPress={() => { setScanned(false); setUIState('scanning'); }} style={styles.rescanBtn}>
                <Text style={styles.rescanText}>↩ Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

function ScanningLine() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 220, duration: 1600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  return (
    <Animated.View
      style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        backgroundColor: '#FF3B30',
        transform: [{ translateY: anim }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
  backBtn: { padding: 8 }, backText: { color: 'white', fontSize: 20 },
  torchBtn: { padding: 8 }, torchText: { fontSize: 20 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanBox: { width: 260, height: 260, position: 'relative', overflow: 'hidden' },
  hint: { color: 'white', marginTop: 20, fontSize: 14, opacity: 0.9, textAlign: 'center' },
  bottom: {
    paddingBottom: 48, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: 20,
  },
  rescanBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
  },
  rescanText: { color: 'white', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  settingsBtn: { backgroundColor: '#6C3CE1', padding: 14, borderRadius: 12 },
  settingsBtnText: { color: 'white', fontSize: 15 },
});
