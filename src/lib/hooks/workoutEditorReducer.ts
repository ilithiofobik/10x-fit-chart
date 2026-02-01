/**
 * Workout Editor Reducer
 *
 * Handles all state mutations for the workout editor feature.
 * Extends workoutLoggerReducer with editor-specific actions.
 */

import type { WorkoutLoggerState, WorkoutLoggerActionType } from "../../components/workout-logger/types";
import { workoutLoggerReducer, getInitialState as getLoggerInitialState } from "./workoutLoggerReducer";
import type { WorkoutDetailsDTO } from "../../types";

/**
 * Extended state for workout editor
 */
export interface WorkoutEditorState extends WorkoutLoggerState {
  workoutId: string | null;
  originalDate: string | null;
  createdAt: string | null;
  isLoading: boolean;
  isDeleting: boolean;
}

/**
 * Additional action types for editor
 */
export type WorkoutEditorActionType =
  | WorkoutLoggerActionType
  | { type: "LOAD_WORKOUT_START" }
  | { type: "LOAD_WORKOUT_SUCCESS"; payload: WorkoutDetailsDTO }
  | { type: "LOAD_WORKOUT_ERROR"; payload: string }
  | { type: "SET_DELETING"; payload: boolean };

/**
 * Initial state for workout editor
 */
export const getInitialState = (): WorkoutEditorState => ({
  ...getLoggerInitialState(),
  workoutId: null,
  originalDate: null,
  createdAt: null,
  isLoading: false,
  isDeleting: false,
});

/**
 * Helper to convert WorkoutDetailsDTO to WorkoutExercise array
 */
const convertWorkoutToExercises = (workout: WorkoutDetailsDTO) => {
  interface WorkoutExerciseMap {
    id: string;
    exercise_id: string;
    exercise_name: string;
    exercise_type: "strength" | "cardio";
    sets: {
      weight: number | null;
      reps: number | null;
      distance: number | null;
      time: number | null;
    }[];
  }

  const exercisesMap = new Map<string, WorkoutExerciseMap>();

  workout.sets.forEach((set) => {
    if (!exercisesMap.has(set.exercise_id)) {
      exercisesMap.set(set.exercise_id, {
        id: `temp_${set.exercise_id}_${Date.now()}`,
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

  return Array.from(exercisesMap.values());
};

/**
 * Workout Editor Reducer
 */
export const workoutEditorReducer = (
  state: WorkoutEditorState,
  action: WorkoutEditorActionType
): WorkoutEditorState => {
  switch (action.type) {
    case "LOAD_WORKOUT_START":
      return {
        ...state,
        isLoading: true,
      };

    case "LOAD_WORKOUT_SUCCESS": {
      const workout = action.payload;
      return {
        ...state,
        workoutId: workout.id,
        date: workout.date,
        notes: workout.notes,
        originalDate: workout.date,
        createdAt: workout.created_at,
        exercises: convertWorkoutToExercises(workout),
        isLoading: false,
      };
    }

    case "LOAD_WORKOUT_ERROR":
      return {
        ...state,
        isLoading: false,
      };

    case "SET_DELETING":
      return {
        ...state,
        isDeleting: action.payload,
      };

    default:
      // Delegate to workoutLoggerReducer for standard actions
      return {
        ...workoutLoggerReducer(state, action as WorkoutLoggerActionType),
        // Preserve editor-specific fields
        workoutId: state.workoutId,
        originalDate: state.originalDate,
        createdAt: state.createdAt,
        isLoading: state.isLoading,
        isDeleting: state.isDeleting,
      };
  }
};
