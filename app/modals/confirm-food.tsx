import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FoodConfirmScreen from '@/screens/FoodConfirmScreen';
import type { NutritionResult } from '@/lib/nutritionAI';

export default function ConfirmFoodModal() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const nutrition: NutritionResult = {
    name: (params.foodName as string) || '',
    calories: parseFloat(params.calories as string) || 0,
    protein: parseFloat(params.protein as string) || 0,
    carbs: parseFloat(params.carbs as string) || 0,
    fat: parseFloat(params.fat as string) || 0,
    fiber: parseFloat(params.fiber as string) || 0,
    serving: (params.serving as string) || '1 serving',
    servingGrams: parseFloat(params.servingGrams as string) || undefined,
  };

  return (
    <FoodConfirmScreen
      params={{
        imageUri: params.imageUri as string | undefined,
        aiDescription: params.aiDescription as string | undefined,
        voiceTranscript: params.voiceTranscript as string | undefined,
        nutrition,
        inputType: (params.inputType as 'camera' | 'gallery' | 'voice') || 'camera',
      }}
      onClose={() => router.back()}
    />
  );
}
