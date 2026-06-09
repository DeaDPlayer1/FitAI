import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FoodConfirmScreen from '@/screens/FoodConfirmScreen';
import type { FoodAnalysisItem } from '@/lib/nutritionAI';

export default function ConfirmFoodModal() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const itemsRaw = params.items as string || '[]';
  let items: FoodAnalysisItem[] = [];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    items = [];
  }

  return (
    <FoodConfirmScreen
      params={{
        imageUri: params.imageUri as string | undefined,
        aiDescription: params.aiDescription as string | undefined,
        voiceTranscript: params.voiceTranscript as string | undefined,
        items,
        inputType: (params.inputType as 'camera' | 'gallery' | 'voice' | 'text' | 'barcode') || 'camera',
      }}
      onClose={() => router.back()}
    />
  );
}
