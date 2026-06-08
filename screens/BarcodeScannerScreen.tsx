import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, Linking, Animated, TextInput, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { lookupBarcode, getScanHistory } from '@/lib/barcodeService';

type UIState = 'permission' | 'scanning' | 'loading' | 'error' | 'text_search' | 'history';

export default function BarcodeScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [uiState, setUIState] = useState<UIState>('scanning');
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [textQuery, setTextQuery] = useState('');
  const [scanHistory, setScanHistory] = useState<any[]>([]);

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

    try {
      const barcode = result.data;
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
            <View style={styles.scanBox}>
              <ScanningLine />
            </View>
            <Text style={styles.hint}>
              {uiState === 'loading' ? 'Looking up product...' : 'Align barcode within the frame'}
            </Text>
            {uiState === 'loading' && <ActivityIndicator color="#6C3CE1" style={{ marginTop: 16 }} />}
          </View>

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
});
