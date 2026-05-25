import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { updateUserProfile } from '@/lib/auth';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import Card from '@/components/ui/Card';

const InputField = ({ label, value, onChangeText, keyboardType = 'default', placeholder }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.text.muted}
    />
  </View>
);

export default function EditSettingsModal() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.health_profile?.age?.toString() || '');
  const [weight, setWeight] = useState(user?.health_profile?.weight?.toString() || '');
  const [height, setHeight] = useState(user?.health_profile?.height?.toString() || '');
  
  const [calories, setCalories] = useState(user?.goals?.calories?.toString() ?? '');
  const [protein, setProtein] = useState(user?.goals?.protein?.toString() ?? '');
  const [carbs, setCarbs] = useState(user?.goals?.carbs?.toString() ?? '');
  const [fat, setFat] = useState(user?.goals?.fat?.toString() ?? '');
  const [water, setWater] = useState(user?.goals?.water?.toString() ?? '');
  const [steps, setSteps] = useState(user?.goals?.steps?.toString() ?? '');

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const parsedCalories = parseInt(calories);
      const parsedProtein = parseInt(protein);
      const parsedCarbs = parseInt(carbs);
      const parsedFat = parseInt(fat);
      const parsedWater = parseInt(water);
      const parsedSteps = parseInt(steps);

      const updates = {
        name,
        health_profile: {
          ...user.health_profile,
          age: !isNaN(parseInt(age)) ? parseInt(age) : user.health_profile.age,
          weight: !isNaN(parseFloat(weight)) ? parseFloat(weight) : user.health_profile.weight,
          height: !isNaN(parseFloat(height)) ? parseFloat(height) : user.health_profile.height,
        },
        goals: {
          calories: !isNaN(parsedCalories) ? parsedCalories : user.goals.calories,
          protein: !isNaN(parsedProtein) ? parsedProtein : user.goals.protein,
          carbs: !isNaN(parsedCarbs) ? parsedCarbs : user.goals.carbs,
          fat: !isNaN(parsedFat) ? parsedFat : user.goals.fat,
          water: !isNaN(parsedWater) ? parsedWater : user.goals.water,
          steps: !isNaN(parsedSteps) ? parsedSteps : user.goals.steps,
        }
      };

      await updateUserProfile(user.id, updates as any);
      
      // Update local store
      setUser({
        ...user,
        ...updates
      } as any);
      useNutritionStore.getState().setCalorieGoal(parsedCalories);

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Card style={styles.card}>
          <InputField label="Full Name" value={name} onChangeText={setName} placeholder="Your Name" />
          <InputField label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="25" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <InputField label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="70" />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <InputField label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="175" />
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Daily Goals</Text>
        <Card style={styles.card}>
          <InputField label="Calories (kcal)" value={calories} onChangeText={setCalories} keyboardType="number-pad" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <InputField label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="number-pad" />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <InputField label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="number-pad" />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <InputField label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="number-pad" />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <InputField label="Water (glasses)" value={water} onChangeText={setWater} keyboardType="number-pad" />
            </View>
          </View>
          <InputField label="Steps Target" value={steps} onChangeText={setSteps} keyboardType="number-pad" />
        </Card>

        <PrimaryButton 
          label="Save Changes" 
          onPress={handleSave} 
          loading={loading}
          style={styles.saveBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text.muted,
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: { marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  row: { flexDirection: 'row' },
  saveBtn: { marginTop: 8 },
});
