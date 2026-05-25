import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, Platform, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import { useSplitBuilderStore } from '../../store/splitBuilderStore';
import { WorkoutService } from '../../lib/workoutService';
import { useUserStore } from '../../store/userStore';
import { PROFESSIONAL_EXERCISES } from '../../constants/exercises';

const { width, height } = Dimensions.get('window');

const MUSCLE_GROUPS = [
  'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Cardio'
];

export default function ExerciseSelectorModal() {
  const router = useRouter();
  const { user } = useUserStore();
  const { dayId, sectionId } = useLocalSearchParams<{ dayId: string; sectionId: string }>();
  const { addExercise } = useSplitBuilderStore();

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All');
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Custom Exercise Form State
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState('Chest');
  const [newEquipment, setNewEquipment] = useState('Dumbbell');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user?.id) fetchCustoms();
  }, [user?.id]);

  const fetchCustoms = async () => {
    try {
      const data = await WorkoutService.fetchCustomExercises(user!.id);
      setCustomExercises(data);
    } catch (e) {
      console.warn('Error fetching custom exercises:', e);
    }
  };

  const allExercises = useMemo(() => {
    return [
      ...PROFESSIONAL_EXERCISES,
      ...customExercises.map(c => ({ ...c, isCustom: true }))
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [customExercises]);

  const filteredExercises = useMemo(() => {
    const query = search.toLowerCase().trim();
    return allExercises.filter(ex => {
      const matchesSearch = !query || 
        ex.name.toLowerCase().includes(query) || 
        (ex.synonyms && ex.synonyms.some((s: string) => s.toLowerCase().includes(query)));
      
      const matchesMuscle = selectedMuscle === 'All' || 
        ex.target_muscle_group === selectedMuscle || 
        ex.muscle === selectedMuscle;

      return matchesSearch && matchesMuscle;
    });
  }, [search, selectedMuscle, allExercises]);

  const handleSelect = (ex: any) => {
    if (dayId && sectionId) {
      addExercise(dayId, sectionId, ex);
      router.back();
    }
  };

  const handleCreateCustom = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter an exercise name.');
      return;
    }
    if (!user?.id) return;

    setIsCreating(true);
    try {
      const newEx = await WorkoutService.createCustomExercise(user.id, {
        name: newName.trim(),
        muscle: newMuscle,
        equipment: newEquipment,
      });
      
      await fetchCustoms();
      setShowCreateModal(false);
      setNewName('');
      
      // Auto select the newly created exercise
      handleSelect({
        ...newEx,
        isCustom: true
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create exercise');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header - Based on Search Workout from Image */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Search Workout</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={theme.colors.text.muted}
            value={search}
            onChangeText={setSearch}
          />
          <Feather name="search" size={18} color={theme.colors.text.muted} />
        </View>

        {/* Filter Chips - Based on Bottom Left of Image */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
           <TouchableOpacity style={styles.filterIconPill}>
              <Feather name="sliders" size={14} color="white" />
              <Text style={styles.filterIconText}>8 Filters</Text>
           </TouchableOpacity>

          {MUSCLE_GROUPS.map(m => (
            <TouchableOpacity 
              key={m} 
              onPress={() => setSelectedMuscle(m)}
              style={[styles.chip, selectedMuscle === m && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedMuscle === m && styles.chipTextActive]}>{m}</Text>
              {selectedMuscle === m && m !== 'All' && <Feather name="x" size={12} color="black" style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
         <Text style={styles.resultsCount}>{filteredExercises.length} Results Found.</Text>
         <TouchableOpacity style={styles.sortBtn}>
            <MaterialCommunityIcons name="sort-variant" size={14} color={theme.colors.text.muted} />
            <Text style={styles.sortText}>Popularity</Text>
            <Feather name="chevron-down" size={14} color={theme.colors.text.muted} />
         </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.listContent}>
          {filteredExercises.map((ex, idx) => (
            <Animated.View 
              key={ex.id || idx} 
              entering={FadeInDown.delay(idx * 30)}
              layout={Layout.springify()}
            >
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(ex)}>
                <View style={styles.itemGraphic}>
                   <MaterialCommunityIcons name="dumbbell" size={24} color={theme.colors.accent.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{ex.name}</Text>
                  <Text style={styles.itemSub}>{ex.target_muscle_group || ex.muscle} • Advanced</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => handleSelect(ex)}>
                   <Feather name="chevron-right" size={20} color={theme.colors.text.muted} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Create Custom FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Create Custom Exercise Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Exercise</Text>
              <TouchableOpacity 
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Exercise Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Incline DB Flyes"
                  placeholderTextColor={theme.colors.text.muted}
                  value={newName}
                  onChangeText={setNewName}
                />
              </View>

              {/* Muscle Group Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Muscle Group</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.pickerScroll}
                >
                  {MUSCLE_GROUPS.filter(m => m !== 'All').map(m => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setNewMuscle(m)}
                      style={[
                        styles.pickerChip,
                        newMuscle === m && styles.pickerChipActive
                      ]}
                    >
                      <Text 
                        style={[
                          styles.pickerChipText,
                          newMuscle === m && styles.pickerChipTextActive
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Equipment Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Equipment</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.pickerScroll}
                >
                  {['Dumbbell', 'Barbell', 'Machine', 'Cables', 'Bodyweight', 'Kettlebell', 'Band', 'None'].map(eq => (
                    <TouchableOpacity
                      key={eq}
                      onPress={() => setNewEquipment(eq)}
                      style={[
                        styles.pickerChip,
                        newEquipment === eq && styles.pickerChipActive
                      ]}
                    >
                      <Text 
                        style={[
                          styles.pickerChipText,
                          newEquipment === eq && styles.pickerChipTextActive
                        ]}
                      >
                        {eq}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleCreateCustom}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Exercise</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: 'white',
    ...theme.shadow.soft,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: theme.font.family.bold, color: theme.colors.text.primary },
  
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 52,
    gap: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: theme.font.family.medium, color: theme.colors.text.primary },
  
  filterScroll: { marginTop: 20, paddingLeft: 24 },
  filterContent: { paddingRight: 40, gap: 10, paddingBottom: 4 },
  filterIconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  filterIconText: { fontSize: 12, fontFamily: theme.font.family.bold, color: 'white' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  chipActive: { backgroundColor: theme.colors.accent.primary + '20' },
  chipText: { fontSize: 13, fontFamily: theme.font.family.semibold, color: theme.colors.text.muted },
  chipTextActive: { color: 'black' },

  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  resultsCount: { fontSize: 14, fontFamily: theme.font.family.bold, color: theme.colors.text.primary },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sortText: { fontSize: 12, fontFamily: theme.font.family.semibold, color: theme.colors.text.muted },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 24, gap: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemGraphic: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 16, fontFamily: theme.font.family.bold, color: theme.colors.text.primary },
  itemSub: { fontSize: 12, fontFamily: theme.font.family.medium, color: theme.colors.text.muted, marginTop: 2 },
  addBtn: { padding: 8 },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.premium,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 24,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.primary,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.primary,
  },
  pickerScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  pickerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerChipActive: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  pickerChipText: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  pickerChipTextActive: {
    color: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.primary,
  },
  submitBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
});
