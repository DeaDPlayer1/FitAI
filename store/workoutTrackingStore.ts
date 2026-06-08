import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutService } from '../lib/workoutService';

const ACTIVE_SESSION_KEY = '@active_session_id';

export interface SetRecord {
  id: string;
  setNumber: number;
  weight: string;
  reps: string;
  rir: string;
  isCompleted: boolean;
  previousWeight?: string;
  previousReps?: string;
  previousRir?: string;
}

export interface ExerciseRecord {
  id: string; // session_exercise_id
  exerciseId: string;
  name: string;
  notes: string;
  sectionName?: string;
  sets: SetRecord[];
  restTimeSeconds: number;
}

interface WorkoutTrackingState {
  sessionId: string | null;
  userId: string | null;
  workoutName: string;
  exercises: ExerciseRecord[];
  activeSetId: string | null; // tracks the currently highlighted set
  activeRestTimer: number | null;
  timerIntervalId: number | null;
  elapsedSeconds: number;
  elapsedIntervalId: number | null;

  startWorkout: (sessionId: string, userId: string, name: string, exercises: ExerciseRecord[]) => void;
  endWorkout: () => void;
  updateSet: (exerciseId: string, setId: string, field: keyof SetRecord, value: string | boolean) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => Promise<void>;
  addSet: (exerciseId: string) => Promise<void>;
  deleteSet: (exerciseId: string, setId: string) => void;
  setActiveSet: (setId: string | null) => void;
  swapExercise: (oldExerciseId: string, newExercise: ExerciseRecord) => void;
  removeExercise: (exerciseId: string) => void;
  resumeSession: (sessionId: string, userId: string, workoutName: string, exercises: ExerciseRecord[]) => Promise<void>;

  startRestTimer: (seconds: number) => void;
  addRestTime: (seconds: number) => void;
  clearRestTimer: () => void;

  startElapsedTimer: () => void;
  stopElapsedTimer: () => void;
  getElapsedFormatted: () => string;

  _addSetMutex: boolean;
}

export const useWorkoutTrackingStore = create<WorkoutTrackingState>((set, get) => ({
  sessionId: null,
  userId: null,
  workoutName: '',
  exercises: [],
  activeSetId: null,
  activeRestTimer: null,
  timerIntervalId: null,
  elapsedSeconds: 0,
  elapsedIntervalId: null,
  _addSetMutex: false,

  startWorkout: (sessionId, userId, name, exercises) => {
    set({ sessionId, userId, workoutName: name, exercises, activeRestTimer: null, elapsedSeconds: 0 });
    AsyncStorage.setItem(ACTIVE_SESSION_KEY, sessionId).catch(() => {});
    get().startElapsedTimer();
  },

  endWorkout: () => {
    const { timerIntervalId, elapsedIntervalId } = get();
    if (timerIntervalId) clearInterval(timerIntervalId);
    if (elapsedIntervalId) clearInterval(elapsedIntervalId);
    AsyncStorage.removeItem(ACTIVE_SESSION_KEY).catch(() => {});
    set({
      sessionId: null,
      userId: null,
      workoutName: '',
      exercises: [],
      activeSetId: null,
      activeRestTimer: null,
      timerIntervalId: null,
      elapsedSeconds: 0,
      elapsedIntervalId: null,
    });
  },

  updateSet: (exId, setId, field, value) => {
    let sanitized = value;
    if (field === 'weight' || field === 'reps' || field === 'rir') {
      if (typeof value === 'string') {
        sanitized = value.replace(/[^0-9.]/g, '');
        if (sanitized === '') sanitized = '';
      }
    }
    set((state) => ({
      exercises: state.exercises.map(ex =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map(s =>
                s.id === setId ? { ...s, [field]: sanitized } : s
              )
            }
          : ex
      )
    }));
  },

  updateExerciseNotes: (exId, notes) => {
    set((state) => ({
      exercises: state.exercises.map(ex =>
        ex.id === exId ? { ...ex, notes } : ex
      )
    }));
  },

  setActiveSet: (setId) => set({ activeSetId: setId }),

  toggleSetComplete: async (exId, setId) => {
    const state = get();
    let restTime = 0;
    let isNowComplete = false;
    let setRecordToSave: SetRecord | null = null;
    let nextIncompleteSetId: string | null = null;

    // Find the target set record first
    for (const ex of state.exercises) {
      if (ex.id === exId) {
        restTime = ex.restTimeSeconds;
        for (const s of ex.sets) {
          if (s.id === setId) {
            isNowComplete = !s.isCompleted;
            setRecordToSave = { ...s, isCompleted: isNowComplete };
            break;
          }
        }
        break;
      }
    }

    // Save to DB first — only update state on success
    if (isNowComplete && setRecordToSave) {
      try {
        const sr = setRecordToSave as SetRecord;
        await WorkoutService.completeSet(sr.id, {
          weight: parseFloat(sr.weight) || 0,
          reps: parseInt(sr.reps) || 0,
          rir: parseInt(sr.rir) || 0,
          rest_taken: restTime,
        });
      } catch (err) {
        console.error('Failed to save set to DB — reverting UI', err);
        return;
      }
    }

    // Now update UI state
    set((st) => {
      const updatedExercises = st.exercises.map(ex => {
        if (ex.id === exId) {
          let foundCurrent = false;
          const updatedSets = ex.sets.map(s => {
            if (s.id === setId) {
              foundCurrent = true;
              if (!isNowComplete) return { ...s, isCompleted: false };
              return { ...s, isCompleted: true };
            }
            if (foundCurrent && !s.isCompleted && !nextIncompleteSetId) {
              nextIncompleteSetId = s.id;
            }
            return s;
          });
          return { ...ex, sets: updatedSets };
        }
        return ex;
      });
      return { exercises: updatedExercises };
    });

    // Auto-highlight next set
    if (isNowComplete) {
      if (nextIncompleteSetId) {
        set({ activeSetId: nextIncompleteSetId });
      } else {
        const st = get();
        let found = false;
        for (const ex of st.exercises) {
          if (found) {
            const nextSet = ex.sets.find(s => !s.isCompleted);
            if (nextSet) {
              set({ activeSetId: nextSet.id });
              break;
            }
          }
          if (ex.id === exId) found = true;
        }
      }
    }
  },

  addSet: async (exId) => {
    // Prevent race condition from rapid taps
    if (get()._addSetMutex) return;
    set({ _addSetMutex: true });

    try {
      const { exercises, sessionId, userId } = get();
      const ex = exercises.find(e => e.id === exId);
      if (!ex || !sessionId || !userId) return;

      const nextSetNumber = ex.sets.length + 1;

      const newSetData = await WorkoutService.addSet(exId, sessionId, userId, ex.exerciseId, nextSetNumber);
      const newSet: SetRecord = {
        id: newSetData.id,
        setNumber: nextSetNumber,
        weight: '',
        reps: '',
        rir: '',
        isCompleted: false,
      };

      set((state) => ({
        exercises: state.exercises.map(e =>
          e.id === exId
            ? { ...e, sets: [...e.sets, newSet] }
            : e
        )
      }));
    } catch (err) {
      console.error('Failed to add set', err);
    } finally {
      set({ _addSetMutex: false });
    }
  },

  deleteSet: (exId, setId) => {
    set((state) => ({
      exercises: state.exercises.map(ex =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets
                .filter(s => s.id !== setId)
                .map((s, i) => ({ ...s, setNumber: i + 1 }))
            }
          : ex
      )
    }));
  },

  swapExercise: (oldExerciseId, newExercise) => {
    set((state) => ({
      exercises: state.exercises.map(ex =>
        ex.id === oldExerciseId ? { ...newExercise, id: oldExerciseId } : ex
      )
    }));
  },

  removeExercise: (exerciseId) => {
    set((state) => ({
      exercises: state.exercises.filter(ex => ex.id !== exerciseId)
    }));
  },

  resumeSession: async (sessionId, userId, workoutName, exercises) => {
    set({ sessionId, userId, workoutName, exercises, activeRestTimer: null, elapsedSeconds: 0 });
    get().startElapsedTimer();
  },

  startRestTimer: (seconds) => {
    const { timerIntervalId } = get();
    if (timerIntervalId) clearInterval(timerIntervalId);

    set({ activeRestTimer: seconds });

    const newIntervalId = setInterval(() => {
      const current = get().activeRestTimer;
      if (current && current > 0) {
        set({ activeRestTimer: current - 1 });
      } else {
        clearInterval(newIntervalId);
        set({ activeRestTimer: null, timerIntervalId: null });
      }
    }, 1000);

    set({ timerIntervalId: newIntervalId });
  },

  addRestTime: (seconds) => {
    set((state) => ({
      activeRestTimer: (state.activeRestTimer || 0) + seconds
    }));
  },

  clearRestTimer: () => {
    const { timerIntervalId } = get();
    if (timerIntervalId) clearInterval(timerIntervalId);
    set({ activeRestTimer: null, timerIntervalId: null });
  },

  startElapsedTimer: () => {
    const { elapsedIntervalId } = get();
    if (elapsedIntervalId) clearInterval(elapsedIntervalId);
    const id = setInterval(() => {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }, 1000);
    set({ elapsedIntervalId: id });
  },

  stopElapsedTimer: () => {
    const { elapsedIntervalId } = get();
    if (elapsedIntervalId) clearInterval(elapsedIntervalId);
    set({ elapsedIntervalId: null });
  },

  getElapsedFormatted: () => {
    const { elapsedSeconds } = get();
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}));
