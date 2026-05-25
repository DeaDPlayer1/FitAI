import { create } from 'zustand';
import { WorkoutService } from '../lib/workoutService';

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
  timerIntervalId: NodeJS.Timeout | null;
  elapsedSeconds: number;
  elapsedIntervalId: NodeJS.Timeout | null;

  startWorkout: (sessionId: string, userId: string, name: string, exercises: ExerciseRecord[]) => void;
  endWorkout: () => void;
  updateSet: (exerciseId: string, setId: string, field: keyof SetRecord, value: string | boolean) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => Promise<void>;
  addSet: (exerciseId: string) => Promise<void>;
  deleteSet: (exerciseId: string, setId: string) => void;
  setActiveSet: (setId: string | null) => void;

  startRestTimer: (seconds: number) => void;
  addRestTime: (seconds: number) => void;
  clearRestTimer: () => void;

  startElapsedTimer: () => void;
  stopElapsedTimer: () => void;
  getElapsedFormatted: () => string;
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

  startWorkout: (sessionId, userId, name, exercises) => {
    set({ sessionId, userId, workoutName: name, exercises, activeRestTimer: null, elapsedSeconds: 0 });
    get().startElapsedTimer();
  },

  endWorkout: () => {
    const { timerIntervalId, elapsedIntervalId } = get();
    if (timerIntervalId) clearInterval(timerIntervalId);
    if (elapsedIntervalId) clearInterval(elapsedIntervalId);
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
    set((state) => ({
      exercises: state.exercises.map(ex =>
        ex.id === exId
          ? {
              ...ex,
              sets: ex.sets.map(s =>
                s.id === setId ? { ...s, [field]: value } : s
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

    const updatedExercises = state.exercises.map(ex => {
      if (ex.id === exId) {
        restTime = ex.restTimeSeconds;
        let foundCurrent = false;
        const updatedSets = ex.sets.map(s => {
          if (s.id === setId) {
            isNowComplete = !s.isCompleted;
            setRecordToSave = { ...s, isCompleted: isNowComplete };
            foundCurrent = true;
            return setRecordToSave;
          }
          // Find next incomplete set after current
          if (foundCurrent && !s.isCompleted && !nextIncompleteSetId) {
            nextIncompleteSetId = s.id;
          }
          return s;
        });
        return { ...ex, sets: updatedSets };
      }
      return ex;
    });

    set({ exercises: updatedExercises });

    // Auto-highlight next set
    if (isNowComplete) {
      if (nextIncompleteSetId) {
        set({ activeSetId: nextIncompleteSetId });
      } else {
        // Find next incomplete set in next exercises
        let found = false;
        for (const ex of updatedExercises) {
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
      if (restTime > 0) {
        get().startRestTimer(restTime);
      }
    }

    // Save to DB
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
        console.error('Failed to save set to DB', err);
      }
    }
  },

  addSet: async (exId) => {
    const { exercises, sessionId, userId } = get();
    const ex = exercises.find(e => e.id === exId);
    if (!ex || !sessionId || !userId) return;

    const nextSetNumber = ex.sets.length + 1;

    try {
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

  startRestTimer: (seconds) => {
    const { timerIntervalId } = get();
    if (timerIntervalId) clearInterval(timerIntervalId);

    set({ activeRestTimer: seconds });

    const newIntervalId = setInterval(() => {
      set((state) => {
        if (state.activeRestTimer && state.activeRestTimer > 0) {
          return { activeRestTimer: state.activeRestTimer - 1 };
        } else {
          clearInterval(newIntervalId);
          return { activeRestTimer: null, timerIntervalId: null };
        }
      });
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
