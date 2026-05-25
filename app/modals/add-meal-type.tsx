import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';

import { theme } from '@/constants/theme';
import { useNutritionStore } from '@/store/nutritionStore';
import * as Haptics from 'expo-haptics';

const AVAILABLE_ICONS = [
  'coffee', 'sun', 'moon', 'zap', 'activity', 'heart', 'star', 'award', 'target', 'briefcase', 'clock', 'droplet'
];

const PASTEL_COLORS = [
  { pastel: '#F5F3FF', iconColor: '#8B5CF6' }, // Purple
  { pastel: '#F0F9FF', iconColor: '#0EA5E9' }, // Blue
  { pastel: '#FDF2F8', iconColor: '#DB2777' }, // Pink
  { pastel: '#FEF3C7', iconColor: '#D97706' }, // Yellow/Orange
  { pastel: '#ECFDF5', iconColor: '#10B981' }, // Green
  { pastel: '#FEF2F2', iconColor: '#EF4444' }, // Red
];

export default function AddMealTypeModal() {
  const router = useRouter();
  const { addMealType } = useNutritionStore();

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addMealType({
      id: name.trim().toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      icon: selectedIcon,
      pastel: selectedColor.pastel,
      iconColor: selectedColor.iconColor,
    });

    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => router.back()} activeOpacity={1} />
          
          <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>New Meal Category</Text>
              <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Pre-Workout, Midnight Snack"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Icon</Text>
                <View style={styles.iconGrid}>
                  {AVAILABLE_ICONS.map((iconName) => {
                    const isSelected = selectedIcon === iconName;
                    return (
                      <TouchableOpacity
                        key={iconName}
                        style={[styles.iconChoice, isSelected && styles.iconChoiceSelected, isSelected && { borderColor: selectedColor.iconColor }]}
                        onPress={() => setSelectedIcon(iconName)}
                      >
                        <Feather name={iconName as any} size={20} color={isSelected ? selectedColor.iconColor : '#9CA3AF'} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Color</Text>
                <View style={styles.colorGrid}>
                  {PASTEL_COLORS.map((color, index) => {
                    const isSelected = selectedColor.pastel === color.pastel;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.colorChoice, { backgroundColor: color.iconColor }, isSelected && styles.colorChoiceSelected]}
                        onPress={() => setSelectedColor(color)}
                      >
                        {isSelected && <Feather name="check" size={16} color="white" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!name.trim()}
              >
                <Text style={styles.saveBtnText}>Create Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconChoice: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChoiceSelected: {
    backgroundColor: 'white',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorChoice: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorChoiceSelected: {
    borderColor: '#111827',
  },
  saveBtn: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
