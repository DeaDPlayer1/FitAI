import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useTheme } from '@/components/ThemeProvider';
import { updateUserProfile } from '@/lib/auth';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import Card from '@/components/ui/Card';

const CONDITIONS_LIST = [
  { id: 'obesity', label: 'Obesity / Overweight' },
  { id: 'diabetes', label: 'Diabetes (Type 2)' },
  { id: 'hypertension', label: 'Hypertension' },
  { id: 'ckd', label: 'Chronic Kidney Disease' },
  { id: 'lupus', label: 'Lupus' },
  { id: 'pcos', label: 'PCOS' },
  { id: 'thyroid', label: 'Thyroid Disorders' },
  { id: 'arthritis', label: 'Arthritis / Joint Issues' },
  { id: 'asthma', label: 'Asthma / Respiratory' },
  { id: 'anemia', label: 'Anemia' },
  { id: 'gerd', label: 'GERD / Digestive' },
  { id: 'other', label: 'Other' },
];

export default function EditSettingsModal() {
  const theme = useTheme();
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [loading, setLoading] = useState(false);

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

  const [conditions, setConditions] = useState<string[]>(user?.health_profile?.conditions || []);
  const [darkMode, setDarkMode] = useState(user?.dark_mode || false);
  const saveWaveAnim = useRef(new RNAnimated.Value(0)).current;
  const [showSaved, setShowSaved] = useState(false);

  const toggleCondition = (id: string) => {
    setConditions((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

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

      const updates: any = {
        name,
        dark_mode: darkMode,
        health_profile: {
          ...user.health_profile,
          age: !isNaN(parseInt(age)) ? parseInt(age) : user.health_profile.age,
          weight: !isNaN(parseFloat(weight)) ? parseFloat(weight) : user.health_profile.weight,
          height: !isNaN(parseFloat(height)) ? parseFloat(height) : user.health_profile.height,
          conditions,
        },
        goals: {
          calories: !isNaN(parsedCalories) ? parsedCalories : user.goals.calories,
          protein: !isNaN(parsedProtein) ? parsedProtein : user.goals.protein,
          carbs: !isNaN(parsedCarbs) ? parsedCarbs : user.goals.carbs,
          fat: !isNaN(parsedFat) ? parsedFat : user.goals.fat,
          water: !isNaN(parsedWater) ? parsedWater : user.goals.water,
          steps: !isNaN(parsedSteps) ? parsedSteps : user.goals.steps,
        },
      };

      await updateUserProfile(user.id, updates);

      setUser({
        ...user,
        ...updates,
      } as any);

      if (!isNaN(parsedCalories)) {
        useNutritionStore.getState().setCalorieGoal(parsedCalories);
      }

      setShowSaved(true);
      RNAnimated.sequence([
        RNAnimated.timing(saveWaveAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.delay(800),
        RNAnimated.timing(saveWaveAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSaved(false);
        router.replace('/(tabs)' as any);
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const s = useMemo(() => makeStyles(theme), [theme]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Ionicons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.sectionTitle}>Personal Info</Text>
        <Card style={s.card}>
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Full Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={theme.colors.text.muted}
            />
          </View>
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Age</Text>
            <TextInput
              style={s.input}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor={theme.colors.text.muted}
            />
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Weight ({user?.health_profile?.weightUnit || 'kg'})</Text>
              <TextInput
                style={s.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="70"
                placeholderTextColor={theme.colors.text.muted}
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Height ({user?.health_profile?.heightUnit || 'cm'})</Text>
              <TextInput
                style={s.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                placeholder="175"
                placeholderTextColor={theme.colors.text.muted}
              />
            </View>
          </View>
        </Card>

        <Text style={s.sectionTitle}>Health Conditions</Text>
        <Card style={s.card}>
          <Text style={s.hint}>Select any conditions for AI-aware coaching adjustments.</Text>
          <View style={s.conditionsGrid}>
            {CONDITIONS_LIST.map((c) => {
              const selected = conditions.includes(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[s.conditionChip, selected && s.conditionChipSelected]}
                  onPress={() => toggleCondition(c.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.conditionChipText, selected && s.conditionChipTextSelected]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {conditions.length > 0 && (
            <Text style={s.conditionsCount}>{conditions.length} condition(s) selected</Text>
          )}
        </Card>

        <Text style={s.sectionTitle}>Daily Goals</Text>
        <Card style={s.card}>
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Calories (kcal)</Text>
            <TextInput
              style={s.input}
              value={calories}
              onChangeText={setCalories}
              keyboardType="number-pad"
              placeholder="1800"
              placeholderTextColor={theme.colors.text.muted}
            />
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Protein (g)</Text>
              <TextInput
                style={s.input}
                value={protein}
                onChangeText={setProtein}
                keyboardType="number-pad"
                placeholder="150"
                placeholderTextColor={theme.colors.text.muted}
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Carbs (g)</Text>
              <TextInput
                style={s.input}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="number-pad"
                placeholder="200"
                placeholderTextColor={theme.colors.text.muted}
              />
            </View>
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Fat (g)</Text>
              <TextInput
                style={s.input}
                value={fat}
                onChangeText={setFat}
                keyboardType="number-pad"
                placeholder="60"
                placeholderTextColor={theme.colors.text.muted}
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.inputLabel}>Water (glasses)</Text>
              <TextInput
                style={s.input}
                value={water}
                onChangeText={setWater}
                keyboardType="number-pad"
                placeholder="8"
                placeholderTextColor={theme.colors.text.muted}
              />
            </View>
          </View>
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Daily Steps</Text>
            <TextInput
              style={s.input}
              value={steps}
              onChangeText={setSteps}
              keyboardType="number-pad"
              placeholder="10000"
              placeholderTextColor={theme.colors.text.muted}
            />
          </View>
        </Card>

        <Text style={s.sectionTitle}>Appearance</Text>
        <Card style={s.card}>
          <View style={s.switchRow}>
            <View style={s.switchLabel}>
              <Ionicons name="moon" size={20} color={theme.colors.primary} />
              <Text style={s.switchText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: theme.colors.border.medium, true: theme.colors.primarySoft }}
              thumbColor={darkMode ? theme.colors.primary : theme.colors.text.muted}
            />
          </View>
          <Text style={s.switchHint}>Changes will apply on next app restart.</Text>
        </Card>

        {showSaved && (
          <RNAnimated.View
            style={[s.confirmationWave, {
              opacity: saveWaveAnim,
              transform: [{
                scale: saveWaveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
              }],
            }]}
          >
            <View style={s.checkCircle}>
              <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
            </View>
            <Text style={s.savedText}>Saved!</Text>
          </RNAnimated.View>
        )}
        <PrimaryButton
          label="Save Changes"
          onPress={handleSave}
          loading={loading}
          style={s.saveBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: t.colors.bg.primary },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      height: 60,
      backgroundColor: t.colors.bg.secondary,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.border.subtle,
    },
    closeBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { fontSize: 18, fontWeight: '700', color: t.colors.text.primary },
    scrollContent: { padding: 20, paddingBottom: 40 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: t.colors.text.muted,
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
      color: t.colors.text.secondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: t.colors.bg.tertiary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: t.colors.text.primary,
      borderWidth: 1,
      borderColor: t.colors.border.subtle,
    },
    row: { flexDirection: 'row' },
    saveBtn: { marginTop: 8 },
    hint: {
      fontSize: 13,
      color: t.colors.text.muted,
      marginBottom: 16,
      lineHeight: 18,
    },
    conditionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    conditionChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.bg.tertiary,
      borderWidth: 1,
      borderColor: t.colors.border.subtle,
    },
    conditionChipSelected: {
      backgroundColor: t.colors.primarySoft,
      borderColor: t.colors.primary,
    },
    conditionChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: t.colors.text.secondary,
    },
    conditionChipTextSelected: {
      color: t.colors.primary,
      fontWeight: '700',
    },
    conditionsCount: {
      marginTop: 12,
      fontSize: 12,
      color: t.colors.text.muted,
      fontWeight: '500',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    switchText: {
      fontSize: 15,
      fontWeight: '600',
      color: t.colors.text.primary,
    },
    switchHint: {
      marginTop: 8,
      fontSize: 12,
      color: t.colors.text.muted,
    },
    confirmationWave: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    checkCircle: {
      marginBottom: 8,
    },
    savedText: {
      fontSize: 18,
      fontWeight: '700',
      color: t.colors.success,
    },
  });
}
