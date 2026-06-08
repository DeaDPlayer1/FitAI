import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useUserStore } from '@/store/userStore';
import { useTabBarStore } from '@/store/tabBarStore';
import { supabase } from '@/lib/supabase';
import { COLORS, FONT_SIZE, SPACING } from '@/constants/theme';

export default function LogWeightModal() {
  const router = useRouter();
  const { user } = useUserStore();
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLog = async () => {
    if (!weight || !user) return;
    setLoading(true);
    try {
      // FIX[1]: Always use session user id for inserts (prevents writing under wrong/stale user).
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) console.error('[log-weight] getSession error:', sessionError);
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('Not authenticated. Please log in again.');

      const kgVal = parseFloat(weight);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      const { data: existing } = await supabase
        .from('weight_logs')
        .select('id')
        .eq('user_id', userId)
        .gte('logged_at', todayStart.toISOString())
        .lt('logged_at', todayEnd.toISOString())
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from('weight_logs')
          .update({ weight_kg: kgVal, logged_at: now.toISOString() })
          .eq('id', existing.id);
        if (updateError) throw updateError;
        Alert.alert('✅ Updated!', `Weight: ${weight} kg`);
      } else {
        const { error: insertError } = await supabase
          .from('weight_logs')
          .insert({ user_id: userId, weight_kg: kgVal, logged_at: now.toISOString() })
          .select('id, user_id, weight_kg, logged_at')
          .single();
        if (insertError) throw insertError;
        Alert.alert('✅ Logged!', `Weight: ${weight} kg`);
      }

      useTabBarStore.getState().setVisible(true);
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Log weight</Text>
        <View style={{ width: 28 }} />
      </View>

      <Card>
        <View style={styles.iconRow}>
          <Ionicons name="scale" size={48} color={COLORS.teal} />
        </View>
        <Input
          label="Today's weight (kg)"
          icon="scale-outline"
          placeholder="e.g. 67.5"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />
        <Button title="Log Weight" onPress={handleLog} loading={loading} />
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary, paddingHorizontal: SPACING.screenPadding },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  title: { color: COLORS.textPrimary, fontSize: FONT_SIZE.xl - 2, fontWeight: 'bold' },
  iconRow: { alignItems: 'center', marginBottom: SPACING.xxl },
});
