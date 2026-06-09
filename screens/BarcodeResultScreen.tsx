import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { parseServingGrams } from '@/lib/barcodeService';
import type { FoodAnalysisItem } from '@/lib/nutritionAI';

type Tab = 'grams' | 'serving';

const COL = {
  bg: '#F8F7FF',
  surface: '#FFFFFF',
  primary: '#6C3CE1',
  purpleDeep: '#4F28B8',
  text: '#1A1A2E',
  muted: '#9CA3AF',
  border: '#F0EDFF',
  inputBg: '#F5F3FF',
  inputBorder: '#DDD6FE',
  cal: '#F97316',
  prot: '#EC4899',
  carb: '#F59E0B',
  fat: '#3B82F6',
  fiber: '#10B981',
};

export default function BarcodeResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const name = (params.name as string) || 'Unknown Product';
  const brand = (params.brand as string) || '';
  const barcode = (params.barcode as string) || '';
  const servingSize = (params.serving_size as string) || '100g';
  const servingGrams = parseServingGrams(servingSize) || 100;
  const imageUrl = (params.image_url as string) || null;
  const cal100 = parseFloat(params.calories_100g as string) || 0;
  const prot100 = parseFloat(params.protein_100g as string) || 0;
  const carb100 = parseFloat(params.carbs_100g as string) || 0;
  const fat100 = parseFloat(params.fat_100g as string) || 0;
  const fiber100 = parseFloat(params.fiber_100g as string) || 0;
  const sugar100 = parseFloat(params.sugar_100g as string) || 0;
  const sodium100 = parseFloat(params.sodium_100g as string) || 0;

  const hasServing = servingGrams > 0 && servingGrams !== 100;
  const [tab, setTab] = useState<Tab>(hasServing ? 'serving' : 'grams');
  const [quantityText, setQuantityText] = useState(hasServing ? '1' : '100');

  const quantity = useMemo(() => {
    const v = parseFloat(quantityText.replace(/[^0-9.]/g, ''));
    return isNaN(v) || v <= 0 ? 0 : v;
  }, [quantityText]);

  const grams = useMemo(() => {
    if (quantity <= 0) return 0;
    if (tab === 'grams') return quantity;
    return Math.round(quantity * servingGrams);
  }, [tab, quantity, servingGrams]);

  const displayCal = useMemo(() => Math.round(cal100 * grams / 100), [cal100, grams]);
  const displayProt = useMemo(() => Math.round(prot100 * grams / 100 * 10) / 10, [prot100, grams]);
  const displayCarb = useMemo(() => Math.round(carb100 * grams / 100 * 10) / 10, [carb100, grams]);
  const displayFat = useMemo(() => Math.round(fat100 * grams / 100 * 10) / 10, [fat100, grams]);
  const displayFiber = useMemo(() => Math.round(fiber100 * grams / 100 * 10) / 10, [fiber100, grams]);
  const displaySugar = useMemo(() => Math.round(sugar100 * grams / 100 * 10) / 10, [sugar100, grams]);
  const displaySodium = useMemo(() => Math.round(sodium100 * grams / 100 * 10) / 10, [sodium100, grams]);

  const handleLog = () => {
    const finalGrams = grams > 0 ? grams : 100;
    const item: FoodAnalysisItem = {
      name,
      grams: finalGrams,
      calories_per_100g: cal100,
      protein_per_100g: prot100,
      carbs_per_100g: carb100,
      fat_per_100g: fat100,
      fiber_per_100g: fiber100,
      source: 'open_food_facts',
    };
    (router as any).replace({
      pathname: '/modals/confirm-food',
      params: {
        items: JSON.stringify([item]),
        inputType: 'barcode',
      },
    });
  };

  const gramsChips = [50, 100, 150, 200];
  const servingChips = [0.5, 1, 2, 3];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COL.bg }}
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingTop: 60,
        paddingHorizontal: 16, paddingBottom: 12, backgroundColor: COL.surface,
        borderBottomWidth: 1, borderBottomColor: COL.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="arrow-left" size={24} color={COL.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: COL.text }} numberOfLines={1}>{name}</Text>
          {brand ? <Text style={{ fontSize: 13, fontWeight: '500', color: COL.muted }} numberOfLines={1}>{brand}</Text> : null}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {imageUrl ? (
          <View style={{ width: '100%', height: 220 }}>
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.45)']}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
            />
            <View style={{ position: 'absolute', bottom: 12, left: 16 }}>
              <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '700' }}>{name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{barcode}</Text>
            </View>
          </View>
        ) : (
          <View style={{
            width: '100%', height: 120, backgroundColor: COL.inputBg,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 40 }}>🥫</Text>
            <Text style={{ fontSize: 13, fontWeight: '500', color: COL.muted, marginTop: 4 }}>{name}</Text>
          </View>
        )}

        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <View style={{
            flexDirection: 'row', backgroundColor: COL.inputBg, borderRadius: 12,
            padding: 3, marginBottom: 20,
          }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: tab === 'grams' ? COL.surface : 'transparent', ...(tab === 'grams' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}) }}
              onPress={() => setTab('grams')}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: tab === 'grams' ? COL.primary : COL.muted }}>By Grams</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: tab === 'serving' ? COL.surface : 'transparent', ...(tab === 'serving' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } : {}) }}
              onPress={() => setTab('serving')}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: tab === 'serving' ? COL.primary : COL.muted }}>By Serving</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 15, fontWeight: '600', color: COL.text, marginBottom: 12 }}>How much did you eat?</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <TextInput
              style={{
                fontSize: 56, fontWeight: '800', color: COL.text,
                backgroundColor: COL.inputBg, borderRadius: 16,
                paddingHorizontal: 24, paddingVertical: 8, minWidth: 140,
                textAlign: 'center',
                borderWidth: 1.5, borderColor: quantity > 0 ? COL.primary : COL.inputBorder,
              }}
              value={quantityText}
              onChangeText={setQuantityText}
              keyboardType="decimal-pad"
              returnKeyType="done"
              selectTextOnFocus
            />
            <Text style={{ fontSize: 20, fontWeight: '600', color: COL.muted }}>
              {tab === 'grams' ? 'g' : 'servings'}
            </Text>
          </View>

          {tab === 'serving' && (
            <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '500', color: COL.primary, marginTop: 8 }}>
              1 serving = {servingGrams}g
            </Text>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(tab === 'grams' ? gramsChips : servingChips).map((v) => (
                <TouchableOpacity
                  key={String(v)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                    backgroundColor: quantity === v ? COL.primary : COL.inputBg,
                    borderWidth: 1, borderColor: quantity === v ? COL.primary : COL.inputBorder,
                    minWidth: 48, alignItems: 'center',
                  }}
                  onPress={() => setQuantityText(String(v))}
                >
                  <Text style={{
                    fontSize: 14, fontWeight: '700',
                    color: quantity === v ? '#FFFFFF' : COL.primary,
                  }}>
                    {tab === 'grams' ? `${v}g` : v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <LinearGradient
            colors={[COL.primary, COL.purpleDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1.2 }}
            style={{ borderRadius: 20, padding: 20, marginBottom: 12 }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.8, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>CALORIES</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
              <Text style={{ fontSize: 48, fontWeight: '800', color: '#FFFFFF' }}>{displayCal}</Text>
              <Text style={{ fontSize: 16, fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>kcal</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10 }}>
              {[
                { value: displayProt, label: 'Protein', dotColor: COL.prot },
                { value: displayCarb, label: 'Carbs', dotColor: COL.carb },
                { value: displayFat, label: 'Fat', dotColor: COL.fat },
                { value: displayFiber, label: 'Fiber', dotColor: COL.fiber },
              ].map((m) => (
                <View key={m.label} style={{
                  width: '46%', backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: 12,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: m.dotColor }} />
                    <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFFFFF' }}>{m.value}g</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{m.label}</Text>
                </View>
              ))}
            </View>

            {(displaySugar > 0 || displaySodium > 0) && (
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                {displaySugar > 0 && <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)' }}>Sugar {displaySugar}g</Text>}
                {displaySodium > 0 && <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)' }}>Sodium {displaySodium}mg</Text>}
              </View>
            )}
          </LinearGradient>

          <View style={{
            backgroundColor: COL.inputBg, borderRadius: 10, padding: 10,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Text style={{ fontSize: 11, color: COL.muted }}>ⓘ</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: COL.muted }}>
              Per 100g: {cal100} kcal · P {prot100}g · C {carb100}g · F {fat100}g
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        paddingTop: 12, backgroundColor: COL.bg,
        borderTopWidth: 1, borderTopColor: COL.border,
      }}>
        <TouchableOpacity
          style={{ borderRadius: 16, overflow: 'hidden', opacity: grams <= 0 ? 0.5 : 1 }}
          onPress={handleLog}
          disabled={grams <= 0}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={grams > 0 ? [COL.primary, COL.purpleDeep] : ['#CBD5E1', '#94A3B8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 24 }}
          >
            <Feather name="check" size={18} color="#FFFFFF" />
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>Log {displayCal} kcal</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
