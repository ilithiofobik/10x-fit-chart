/**
 * Workout Logger Reducer
 *
 * Handles all state mutations for the workout logger feature.
 */

import type {
  WorkoutLoggerState,
  WorkoutLoggerActionType,
  WorkoutExercise,
  SetData,
} from "../../components/workout-logger/types";

/**
 * Initial state for workout logger
 */
export const getInitialState = (): WorkoutLoggerState => ({
  date: new Date().toISOString().split("T")[0], // Today's date
  notes: null,
  exercises: [],
  availableExercises: [],
  isLoadingExercises: false,
  isSaving: false,
});

/**
 * Generate temporary ID for UI
 */
const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Create empty set based on exercise type
 */
const createEmptySet = (exerciseType: "strength" | "cardio"): SetData => {
  if (exerciseType === "strength") {
    return {
      weight: null,
      reps: null,
      distance: null,
      time: null,
    };
  } else {
    return {
      weight: null,
      reps: null,
      distance: null,
      time: null,
    };
  }
};

/**
 * Workout Logger Reducer
 */
export const workoutLoggerReducer = (
  state: WorkoutLoggerState,
  action: WorkoutLoggerActionType
): WorkoutLoggerState => {
  switch (action.type) {
    case "SET_DATE":
      return {
        ...state,
        date: action.payload,
      };

    case "SET_NOTES":
      return {
        ...state,
        notes: action.payload,
      };

    case "ADD_EXERCISE": {
      const exercise = action.payload;
      const newExercise: WorkoutExercise = {
        id: generateTempId(),
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        exercise_type: exercise.type,
        sets: [createEmptySet(exercise.type)],
      };
      return {
        ...state,
        exercises: [...state.exercises, newExercise],
      };
    }

    case "REMOVE_EXERCISE":
      return {
        ...state,
        exercises: state.exercises.filter((ex) => ex.id !== action.payload),
      };

    case "ADD_SET": {
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id === action.payload) {
            return {
              ...ex,
              sets: [...ex.sets, createEmptySet(ex.exercise_type)],
            };
          }
          return ex;
        }),
      };
    }

    case "REMOVE_SET": {
      const { exerciseId, setIndex } = action.payload;
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: ex.sets.filter((_, idx) => idx !== setIndex),
            };
          }
          return ex;
        }),
      };
    }

    case "UPDATE_SET": {
      const { exerciseId, setIndex, data } = action.payload;
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: ex.sets.map((set, idx) => {
                if (idx === setIndex) {
                  return { ...set, ...data };
                }
                return set;
              }),
            };
          }
          return ex;
        }),
      };
    }

    case "LOAD_TEMPLATE": {
      const template = action.payload;
      // Group sets by exercise_id
      const exercisesMap = new Map<string, WorkoutExercise>();

      template.sets.forEach((set) => {
        if (!exercisesMap.has(set.exercise_id)) {
          exercisesMap.set(set.exercise_id, {
            id: generateTempId(),
            exercise_id: set.exercise_id,
            exercise_name: set.exercise_name,
            exercise_type: set.exercise_type,
            sets: [],
          });
        }

        const exercise = exercisesMap.get(set.exercise_id);
        if (exercise) {
          exercise.sets.push({
            weight: set.weight,
            reps: set.reps,
            distance: set.distance,
            time: set.time,
          });
        }
      });

      return {
        ...state,
        date: new Date().toISOString().split("T")[0], // Today, not template date
        notes: null, // Clear notes
        exercises: Array.from(exercisesMap.values()),
      };
    }

    case "LOAD_DRAFT":
      return {
        ...state,
        ...action.payload,
      };

    case "SET_AVAILABLE_EXERCISES":
      return {
        ...state,
        availableExercises: action.payload,
      };

    case "SET_LOADING_EXERCISES":
      return {
        ...state,
        isLoadingExercises: action.payload,
      };

    case "SET_SAVING":
      return {
        ...state,
        isSaving: action.payload,
      };

    case "RESET":
      return getInitialState();

    default:
      return state;
  }
};
