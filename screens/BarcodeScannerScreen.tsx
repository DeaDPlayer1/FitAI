import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, Linking, Animated, TextInput, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';
import { lookupBarcode, getScanHistory } from '@/lib/barcodeService';

const ALL_BARCODE_TYPES: string[] = [
  'ean13', 'ean8', 'upc_a', 'upc_e',
  'code128', 'code39', 'code93', 'codabar',
  'itf14', 'interleaved2of5',
  'datamatrix', 'pdf417', 'aztec', 'qr',
];

type UIState = 'permission' | 'scanning' | 'loading' | 'error' | 'text_search' | 'history';

function normalizeBarcode(raw: string): string {
  // iOS reports UPC-A as EAN-13 with leading zero
  if (raw.length === 13 && raw.startsWith('0')) {
    const stripped = raw.replace(/^0+/, '');
    if (stripped.length === 12) return stripped;
  }
  return raw;
}

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [uiState, setUIState] = useState<UIState>('scanning');
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [textQuery, setTextQuery] = useState('');
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [frameFlash, setFrameFlash] = useState<'green' | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 1200);
  }, []);

  // Manual entry fallback after 10s of no scan
  useEffect(() => {
    if (uiState !== 'scanning' || scanned) return;
    const timer = setTimeout(() => setManualEntry(true), 10000);
    return () => clearTimeout(timer);
  }, [uiState, scanned]);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted]);

  useEffect(() => {
    if (uiState === 'history') loadHistory();
  }, [uiState]);

  const loadHistory = async () => {
    const h = await getScanHistory(30);
    setScanHistory(h);
  };

  const navigateToResult = (product: any) => {
    (router as any).replace({
      pathname: '/modals/barcode-result',
      params: {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand || '',
        serving_size: product.serving_size || '100g',
        quantity: product.quantity || '',
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
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || uiState === 'loading') return;
    setScanned(true);
    setUIState('loading');
    setManualEntry(false);

    try {
      const rawBarcode = result.data;
      const barcode = normalizeBarcode(rawBarcode);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFrameFlash('green');
      showToast(`Found barcode: ${barcode}`);
      setTimeout(() => setFrameFlash(null), 300);

      const product = await lookupBarcode(barcode);

      if (product) {
        navigateToResult(product);
      } else {
        setUIState('scanning');
        setScanned(false);
        Alert.alert(
          'Product Not Found',
          'This barcode was not found. What would you like to do?',
          [
            { text: 'Scan Again', onPress: () => setScanned(false) },
            { text: 'Search by Name', onPress: () => setUIState('text_search') },
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

  const handleManualSearch = async () => {
    const code = manualBarcode.trim();
    if (!code) return;
    setUIState('loading');
    Keyboard.dismiss();
    try {
      const product = await lookupBarcode(code);
      if (product) {
        navigateToResult(product);
      } else {
        Alert.alert('Not Found', `Barcode "${code}" was not found in any database.`);
        setUIState('scanning');
        setScanned(false);
      }
    } catch {
      Alert.alert('Error', 'Search failed. Check your connection.');
      setUIState('scanning');
      setScanned(false);
    }
  };

  const handleTextSearch = () => {
    if (!textQuery.trim()) return;
    Keyboard.dismiss();
    router.replace({
      pathname: '/modals/log-food',
      params: { text: textQuery.trim() },
    });
  };

  const handleHistorySelect = (item: any) => {
    navigateToResult({
      barcode: item.barcode,
      name: item.food_name,
      brand: item.brand,
      serving_size: item.serving_size,
      quantity: '',
      image_url: item.image_url,
      calories_100g: item.calories_100g,
      protein_100g: item.protein_100g,
      carbs_100g: item.carbs_100g,
      fat_100g: item.fat_100g,
      fiber_100g: item.fiber_100g,
      sugar_100g: item.sugar_100g,
      sodium_100g: item.sodium_100g,
    });
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

  if (uiState === 'text_search') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 }}>
          Search by Name
        </Text>
        <Text style={{ fontSize: 13, color: theme.colors.text.muted, marginBottom: 24, textAlign: 'center' }}>
          Type the food name and we'll look it up via text search.
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Amul Butter, Parle-G..."
          placeholderTextColor={theme.colors.text.muted}
          value={textQuery}
          onChangeText={setTextQuery}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={handleTextSearch}
        />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <TouchableOpacity
            onPress={() => { setUIState('scanning'); setScanned(false); }}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>Back to Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleTextSearch} style={styles.primaryBtn}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDeep]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.primaryBtnGrad}
            >
              <Text style={styles.primaryBtnText}>Search</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (uiState === 'history') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background, paddingTop: 60 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 20, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => { setUIState('scanning'); setScanned(false); }} style={{ padding: 8 }}>
            <Text style={{ fontSize: 20, color: theme.colors.text.primary }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, flex: 1, textAlign: 'center' }}>
            Scan History
          </Text>
          <View style={{ width: 36 }} />
        </View>
        {scanHistory.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
            <Text style={{ fontSize: 15, color: theme.colors.text.muted }}>No scans yet</Text>
          </View>
        ) : (
          <View style={{ flex: 1, width: '100%', paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 12, color: theme.colors.text.muted, marginBottom: 8, paddingHorizontal: 4 }}>
              Tap a product to re-log it
            </Text>
            <View style={{ flex: 1 }}>
              <View>
                {scanHistory.map((item, i) => (
                  <TouchableOpacity
                    key={item.id || i}
                    onPress={() => handleHistorySelect(item)}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      padding: 14, marginBottom: 8,
                      backgroundColor: theme.colors.surface,
                      borderRadius: 14, ...theme.shadow.card,
                    }}
                  >
                    <View style={styles.historyIcon}>
                      <Text style={{ fontSize: 20 }}>📦</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text.primary }} numberOfLines={1}>
                        {item.food_name}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.colors.text.muted, marginTop: 2 }}>
                        {item.brand ? `${item.brand} · ` : ''}{item.barcode}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.primary }}>
                        {item.calories_100g} kcal
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.colors.text.muted, marginTop: 1 }}>
                        per 100g
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ALL_BARCODE_TYPES as any,
        }}
        enableTorch={torch}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Barcode</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setUIState('history')} style={styles.torchBtn}>
                <Text style={styles.torchText}>📋</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTorch(t => !t)} style={styles.torchBtn}>
                <Text style={styles.torchText}>🔦</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.middle}>
            <View style={[styles.scanBox, frameFlash === 'green' && { borderColor: '#22C55E' }]}>
              <ScanningLine />
            </View>
            <Text style={styles.hint}>
              {uiState === 'loading' ? 'Looking up product...' : 'Align barcode within the frame'}
            </Text>
            {uiState === 'loading' && <ActivityIndicator color="#6C3CE1" style={{ marginTop: 16 }} />}
          </View>

          {manualEntry && uiState === 'scanning' && !scanned && (
            <View style={styles.manualEntryContainer}>
              <Text style={{ fontSize: 13, color: '#FFFFFFCC', marginBottom: 6 }}>Can't scan? Enter barcode:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="e.g. 8901234567890"
                  placeholderTextColor="#FFFFFF66"
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  keyboardType="number-pad"
                  returnKeyType="search"
                  onSubmitEditing={handleManualSearch}
                />
                <TouchableOpacity onPress={handleManualSearch} style={styles.manualSearchBtn}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.bottom}>
            <TouchableOpacity onPress={() => setUIState('text_search')} style={styles.textSearchBtn}>
              <Text style={styles.textSearchBtnText}>🔍 Search by Name</Text>
            </TouchableOpacity>
            {scanned && uiState !== 'loading' && (
              <TouchableOpacity onPress={() => { setScanned(false); setUIState('scanning'); }} style={styles.rescanBtn}>
                <Text style={styles.rescanText}>↩ Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>

      {toastMsg && (
        <View style={styles.toast}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{toastMsg}</Text>
        </View>
      )}
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
  scanBox: { width: 260, height: 260, position: 'relative', overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 16 },
  hint: { color: 'white', marginTop: 20, fontSize: 14, opacity: 0.9, textAlign: 'center' },
  bottom: {
    paddingBottom: 48, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: 20, gap: 12,
  },
  rescanBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
  },
  rescanText: { color: 'white', fontSize: 15 },
  textSearchBtn: {
    backgroundColor: 'rgba(106,73,250,0.8)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24,
  },
  textSearchBtnText: { color: 'white', fontSize: 15, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  settingsBtn: { backgroundColor: '#6C3CE1', padding: 14, borderRadius: 12 },
  settingsBtnText: { color: 'white', fontSize: 15 },
  textInput: {
    width: '100%', padding: 16, fontSize: 16, borderRadius: 14,
    backgroundColor: theme.colors.surface, color: theme.colors.text.primary,
    borderWidth: 1, borderColor: theme.colors.border.soft,
  },
  secondaryBtn: {
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14,
    backgroundColor: theme.colors.bg.secondary, borderWidth: 1, borderColor: theme.colors.border.soft,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary },
  primaryBtn: { borderRadius: 14, overflow: 'hidden', flex: 1 },
  primaryBtnGrad: { paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  historyIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: theme.colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  manualEntryContainer: {
    position: 'absolute', bottom: 170, left: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 14,
    padding: 14,
  },
  manualInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    color: '#FFFFFF', fontSize: 16, fontWeight: '500',
  },
  manualSearchBtn: {
    backgroundColor: '#6C3CE1', borderRadius: 10,
    paddingHorizontal: 18, justifyContent: 'center',
  },
  toast: {
    position: 'absolute', bottom: 120, left: 40, right: 40,
    backgroundColor: '#1A1A2ECC', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center',
  },
});
