import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import { useToast } from '@/components/ui/ToastNotification';
import { useSplitBuilderStore, BuilderDay, BuilderSection, BuilderExercise } from '../../store/splitBuilderStore';
import { useUserStore } from '../../store/userStore';

const { width } = Dimensions.get('window');

const DAY_COLORS: Record<string, string> = {
  Monday: '#EDE9FE',
  Tuesday: '#DBEAFE',
  Wednesday: '#D1FAE5',
  Thursday: '#FEF3C7',
  Friday: '#FCE7F3',
  Saturday: '#E0E7FF',
  Sunday: '#F3F4F6',
};

const DAY_DOT_COLORS: Record<string, string> = {
  Monday: '#8B5CF6',
  Tuesday: '#3B82F6',
  Wednesday: '#10B981',
  Thursday: '#F59E0B',
  Friday: '#EC4899',
  Saturday: '#6366F1',
  Sunday: '#9CA3AF',
};

export default function WorkoutBuilderScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useUserStore();
  const {
    days, isLoading, hasLoadedFromDB,
    toggleRestDay, updateWorkoutName,
    addSection, removeSection, updateSectionName,
    removeExercise, updateExerciseTargets,
    loadSplit, saveSplit,
  } = useSplitBuilderStore();

  const [expandedDay, setExpandedDay] = useState<string | null>('1');

  // Load existing split on first mount
  useEffect(() => {
    if (user?.id && !hasLoadedFromDB) {
      loadSplit(user.id);
    }
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate: at least one active day has a name
    const hasAnything = days.some(d => !d.isRest && d.workoutName.trim());
    if (!hasAnything) {
      Alert.alert(
        'Nothing to Save',
        'Please name at least one workout day before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await saveSplit(user.id);
      showToast('Weekly split saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save your split. Please try again.', 'error');
    }
  };

  const renderExercise = (dayId: string, sectionId: string, ex: BuilderExercise) => (
    <Animated.View key={ex.id} layout={Layout.springify()} style={styles.exCard}>
      <View style={styles.exHeader}>
        <View style={styles.exDot} />
        <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
        <TouchableOpacity
          onPress={() => removeExercise(dayId, sectionId, ex.id)}
          style={styles.exDeleteBtn}
        >
          <Feather name="trash-2" size={14} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.controlsRow}>
        {/* Sets */}
        <View style={styles.control}>
          <Text style={styles.controlLabel}>SETS</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => updateExerciseTargets(dayId, sectionId, ex.id, { target_sets: Math.max(1, ex.target_sets - 1) })}
              style={styles.stepBtn}
            >
              <Feather name="minus" size={13} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.stepVal}>{ex.target_sets}</Text>
            <TouchableOpacity
              onPress={() => updateExerciseTargets(dayId, sectionId, ex.id, { target_sets: ex.target_sets + 1 })}
              style={styles.stepBtn}
            >
              <Feather name="plus" size={13} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Reps */}
        <View style={styles.control}>
          <Text style={styles.controlLabel}>REPS</Text>
          <View style={styles.repsRow}>
            <TextInput
              style={styles.miniInput}
              keyboardType="numeric"
              value={String(ex.target_reps_min)}
              onChangeText={(v) => updateExerciseTargets(dayId, sectionId, ex.id, { target_reps_min: parseInt(v) || 0 })}
            />
            <Text style={styles.repsDash}>–</Text>
            <TextInput
              style={styles.miniInput}
              keyboardType="numeric"
              value={String(ex.target_reps_max)}
              onChangeText={(v) => updateExerciseTargets(dayId, sectionId, ex.id, { target_reps_max: parseInt(v) || 0 })}
            />
          </View>
        </View>

        {/* Rest */}
        <View style={styles.control}>
          <Text style={styles.controlLabel}>REST (s)</Text>
          <TextInput
            style={[styles.miniInput, { width: 54 }]}
            keyboardType="numeric"
            value={String(ex.rest_time_seconds)}
            onChangeText={(v) => updateExerciseTargets(dayId, sectionId, ex.id, { rest_time_seconds: parseInt(v) || 0 })}
          />
        </View>
      </View>
    </Animated.View>
  );

  const renderSection = (dayId: string, section: BuilderSection) => (
    <Animated.View key={section.id} layout={Layout.springify()} style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <TextInput
          style={styles.sectionNameInput}
          value={section.name}
          placeholder="Section name (e.g. Main Lifts)"
          placeholderTextColor={theme.colors.text.muted}
          onChangeText={(v) => updateSectionName(dayId, section.id, v)}
        />
        <TouchableOpacity onPress={() => removeSection(dayId, section.id)} style={styles.sectionDeleteBtn}>
          <Feather name="x" size={16} color={theme.colors.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseList}>
        {section.exercises.map(ex => renderExercise(dayId, section.id, ex))}
      </View>

      <TouchableOpacity
        style={styles.addExBtn}
        onPress={() => router.push({
          pathname: '/modals/exercise-selector',
          params: { dayId, sectionId: section.id }
        })}
        activeOpacity={0.8}
      >
        <Feather name="plus-circle" size={16} color={theme.colors.accent.primary} />
        <Text style={styles.addExText}>Add Exercise</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent.primary} />
          <Text style={styles.loadingText}>Loading your split...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Weekly Split</Text>
          <Text style={styles.headerSub}>Design your training week</Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          style={[styles.saveBtn, isLoading && { opacity: 0.6 }]}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator size="small" color="white" />
            : <>
                <Feather name="save" size={14} color="white" />
                <Text style={styles.saveBtnText}>Save Split</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Animated.View entering={FadeInDown.delay(0)} style={styles.introCard}>
          <Feather name="info" size={16} color={theme.colors.accent.primary} />
          <Text style={styles.introText}>
            Tap a day to expand it. Toggle Rest Day for recovery days. Add sections and exercises to build your plan.
          </Text>
        </Animated.View>

        {/* Day Cards */}
        {days.map((day, dayIdx) => {
          const isExpanded = expandedDay === day.id;
          const dotColor = DAY_DOT_COLORS[day.dayName] || '#8B5CF6';
          const bgColor = DAY_COLORS[day.dayName] || '#F9FAFB';
          const exerciseCount = day.sections.reduce((s, sec) => s + sec.exercises.length, 0);

          return (
            <Animated.View
              key={day.id}
              layout={Layout.springify()}
              entering={FadeInDown.delay(dayIdx * 50)}
              style={[styles.dayCard, isExpanded && styles.dayCardExpanded]}
            >
              {/* Day Header Row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpandedDay(isExpanded ? null : day.id)}
                style={styles.dayHeaderRow}
              >
                <View style={[styles.dayDot, { backgroundColor: dotColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dayName}>{day.dayName}</Text>
                  <Text style={styles.dayPreview}>
                    {day.isRest
                      ? '😴 Rest & Recovery'
                      : day.workoutName
                        ? `${day.workoutName}${exerciseCount > 0 ? ` · ${exerciseCount} exercises` : ''}`
                        : 'No workout planned'
                    }
                  </Text>
                </View>
                <Feather
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.colors.text.muted}
                />
              </TouchableOpacity>

              {/* Expanded Content */}
              {isExpanded && (
                <Animated.View entering={FadeInDown.duration(200)} style={styles.dayContent}>
                  {/* Rest Day Toggle */}
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Rest Day</Text>
                    <TouchableOpacity
                      onPress={() => toggleRestDay(day.id)}
                      style={[styles.toggleTrack, day.isRest && styles.toggleTrackOn]}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.toggleThumb, day.isRest && styles.toggleThumbOn]} />
                    </TouchableOpacity>
                  </View>

                  {!day.isRest && (
                    <>
                      {/* Workout Name Input */}
                      <View style={styles.nameInputGroup}>
                        <Text style={styles.settingLabel}>Workout Name</Text>
                        <TextInput
                          style={styles.nameInput}
                          placeholder="e.g. Push Day, Upper Body..."
                          placeholderTextColor={theme.colors.text.muted}
                          value={day.workoutName}
                          onChangeText={(v) => updateWorkoutName(day.id, v)}
                        />
                      </View>

                      {/* Sections */}
                      <View style={styles.sectionsContainer}>
                        {day.sections.map(section => renderSection(day.id, section))}
                      </View>

                      {/* Add Section Button */}
                      <TouchableOpacity
                        style={styles.addSectionBtn}
                        onPress={() => addSection(day.id, '')}
                        activeOpacity={0.8}
                      >
                        <Feather name="plus" size={16} color={theme.colors.accent.primary} />
                        <Text style={styles.addSectionText}>Add Section</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </Animated.View>
              )}
            </Animated.View>
          );
        })}

        {/* Bottom Save Button */}
        <TouchableOpacity
          style={[styles.saveBtnBottom, isLoading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading
            ? <ActivityIndicator color="white" />
            : <>
                <Feather name="save" size={18} color="white" />
                <Text style={styles.saveBtnBottomText}>Save Weekly Split</Text>
              </>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg.primary },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'white',
    gap: 12,
    ...theme.shadow.soft,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    ...theme.shadow.premium,
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },

  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },

  dayCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadow.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayCardExpanded: {
    borderColor: theme.colors.accent.primary,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayName: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  dayPreview: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 2,
  },

  dayContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
    gap: 16,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 11,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  toggleTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    padding: 3,
  },
  toggleTrackOn: { backgroundColor: theme.colors.accent.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  nameInputGroup: { gap: 8 },
  nameInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  sectionsContainer: { gap: 12 },
  sectionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionNameInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: 4,
  },
  sectionDeleteBtn: { padding: 4 },

  exerciseList: { gap: 8 },
  exCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 12,
    ...theme.shadow.soft,
    gap: 10,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.accent.primary,
  },
  exName: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  exDeleteBtn: { padding: 4 },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  control: { gap: 6, alignItems: 'center' },
  controlLabel: {
    fontSize: 9,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.muted,
    letterSpacing: 0.5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    gap: 8,
  },
  stepBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
    minWidth: 18,
    textAlign: 'center',
  },
  repsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  repsDash: {
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  miniInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    width: 38,
  },

  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addExText: {
    fontSize: 13,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.accent.primary,
  },

  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
  },
  addSectionText: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent.primary,
  },

  saveBtnBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: 18,
    borderRadius: 20,
    marginTop: 24,
    ...theme.shadow.premium,
  },
  saveBtnBottomText: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
});
