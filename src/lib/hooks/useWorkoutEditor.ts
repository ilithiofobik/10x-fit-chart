/**
 * useWorkoutEditor Hook
 *
 * Custom hook that manages workout editor state, API calls for loading,
 * updating, and deleting workouts.
 */

import { useReducer, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { workoutEditorReducer, getInitialState } from "./workoutEditorReducer";
import type { WorkoutEditorState } from "./workoutEditorReducer";
import type { UpdateWorkoutCommand, WorkoutDetailsDTO, ExerciseDTO } from "../../types";

/**
 * Transform state to API payload for update
 */
const transformStateToUpdatePayload = (state: WorkoutEditorState): UpdateWorkoutCommand => {
  const sets: UpdateWorkoutCommand["sets"] = [];
  let sortOrder = 1;

  state.exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      sets.push({
        exercise_id: exercise.exercise_id,
        sort_order: sortOrder++,
        weight: set.weight,
        reps: set.reps,
        distance: set.distance,
        time: set.time,
      });
    });
  });

  return {
    date: state.date,
    notes: state.notes,
    sets,
  };
};

/**
 * Validate workout before saving
 */
const validateWorkout = (state: WorkoutEditorState): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if there's at least one exercise
  if (state.exercises.length === 0) {
    errors.push("Dodaj przynajmniej jedno ćwiczenie");
  }

  // Check date is not in future
  const workoutDate = new Date(state.date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (workoutDate > today) {
    errors.push("Data treningu nie może być w przyszłości");
  }

  // Check notes length
  if (state.notes && state.notes.length > 1000) {
    errors.push("Notatki nie mogą przekraczać 1000 znaków");
  }

  // Check if each exercise has at least one set
  state.exercises.forEach((exercise) => {
    if (exercise.sets.length === 0) {
      errors.push(`Ćwiczenie "${exercise.exercise_name}" musi mieć przynajmniej jedną serię`);
    }

    // Check if all sets are complete
    exercise.sets.forEach((set, idx) => {
      if (exercise.exercise_type === "strength") {
        if (set.weight === null || set.reps === null) {
          errors.push(`Seria ${idx + 1} ćwiczenia "${exercise.exercise_name}" jest niekompletna`);
        }
      } else if (exercise.exercise_type === "cardio") {
        if (set.distance === null || set.time === null) {
          errors.push(`Seria ${idx + 1} ćwiczenia "${exercise.exercise_name}" jest niekompletna`);
        }
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Actions returned by useWorkoutEditor hook
 */
export interface WorkoutEditorActions {
  setDate: (date: string) => void;
  setNotes: (notes: string | null) => void;
  addExercise: (exercise: ExerciseDTO) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateSet: (
    exerciseId: string,
    setIndex: number,
    data: Partial<{ weight: number | null; reps: number | null; distance: number | null; time: number | null }>
  ) => void;
  saveWorkout: () => Promise<void>;
  deleteWorkout: () => Promise<void>;
  cancelEdit: () => void;
}

/**
 * Custom hook for workout editor
 */
export const useWorkoutEditor = (workoutId: string) => {
  const [state, dispatch] = useReducer(workoutEditorReducer, getInitialState());

  // Fetch available exercises on mount
  useEffect(() => {
    const fetchExercises = async () => {
      dispatch({ type: "SET_LOADING_EXERCISES", payload: true });
      try {
        const response = await fetch("/api/exercises?include_archived=false");

        if (!response.ok) {
          throw new Error("Failed to fetch exercises");
        }

        const data = await response.json();
        dispatch({ type: "SET_AVAILABLE_EXERCISES", payload: data.exercises });
      } catch (error) {
        console.error("Error fetching exercises:", error);
        toast.error("Nie udało się załadować listy ćwiczeń");
      } finally {
        dispatch({ type: "SET_LOADING_EXERCISES", payload: false });
      }
    };

    fetchExercises();
  }, []);

  // Fetch workout details on mount
  useEffect(() => {
    const fetchWorkout = async () => {
      dispatch({ type: "LOAD_WORKOUT_START" });

      try {
        const response = await fetch(`/api/workouts/${workoutId}`);

        if (response.status === 404) {
          toast.error("Trening nie został znaleziony");
          window.location.href = "/app/history";
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch workout");
        }

        const data: WorkoutDetailsDTO = await response.json();
        dispatch({ type: "LOAD_WORKOUT_SUCCESS", payload: data });
      } catch (error) {
        console.error("Error fetching workout:", error);
        dispatch({ type: "LOAD_WORKOUT_ERROR", payload: "Failed to load workout" });
        toast.error("Nie udało się załadować treningu");
      }
    };

    if (workoutId) {
      fetchWorkout();
    }
  }, [workoutId]);

  // Actions
  const actions: WorkoutEditorActions = {
    setDate: useCallback((date: string) => {
      dispatch({ type: "SET_DATE", payload: date });
    }, []),

    setNotes: useCallback((notes: string | null) => {
      dispatch({ type: "SET_NOTES", payload: notes });
    }, []),

    addExercise: useCallback((exercise: ExerciseDTO) => {
      dispatch({ type: "ADD_EXERCISE", payload: exercise });
    }, []),

    removeExercise: useCallback((exerciseId: string) => {
      dispatch({ type: "REMOVE_EXERCISE", payload: exerciseId });
    }, []),

    addSet: useCallback((exerciseId: string) => {
      dispatch({ type: "ADD_SET", payload: exerciseId });
    }, []),

    removeSet: useCallback((exerciseId: string, setIndex: number) => {
      dispatch({ type: "REMOVE_SET", payload: { exerciseId, setIndex } });
    }, []),

    updateSet: useCallback((exerciseId: string, setIndex: number, data) => {
      dispatch({ type: "UPDATE_SET", payload: { exerciseId, setIndex, data } });
    }, []),

    saveWorkout: useCallback(async () => {
      // Validate
      const validation = validateWorkout(state);
      if (!validation.isValid) {
        validation.errors.forEach((error) => toast.error(error));
        return;
      }

      dispatch({ type: "SET_SAVING", payload: true });

      try {
        const payload = transformStateToUpdatePayload(state);
        const response = await fetch(`/api/workouts/${workoutId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404) {
            toast.error("Trening został już usunięty");
            window.location.href = "/app/history";
            return;
          }
          throw new Error(errorData.error || "Failed to update workout");
        }

        // Success
        toast.success("Trening zaktualizowany!");
        window.location.href = "/app/history";
      } catch (error) {
        console.error("Error updating workout:", error);
        toast.error(error instanceof Error ? error.message : "Nie udało się zapisać zmian. Spróbuj ponownie.");
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    }, [state, workoutId]),

    deleteWorkout: useCallback(async () => {
      dispatch({ type: "SET_DELETING", payload: true });

      try {
        const response = await fetch(`/api/workouts/${workoutId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404) {
            toast.error("Trening został już usunięty");
            window.location.href = "/app/history";
            return;
          }
          throw new Error(errorData.error || "Failed to delete workout");
        }

        // Success
        toast.success("Trening usunięty");
        window.location.href = "/app/history";
      } catch (error) {
        console.error("Error deleting workout:", error);
        toast.error(error instanceof Error ? error.message : "Nie udało się usunąć treningu. Spróbuj ponownie.");
      } finally {
        dispatch({ type: "SET_DELETING", payload: false });
      }
    }, [workoutId]),

    cancelEdit: useCallback(() => {
      // Check if there are unsaved changes
      const hasChanges =
        state.date !== state.originalDate ||
        state.notes !== (state.originalDate ? null : state.notes) ||
        state.exercises.length > 0;

      if (hasChanges) {
        const confirmed = window.confirm("Masz niezapisane zmiany. Czy na pewno chcesz wyjść?");
        if (!confirmed) return;
      }

      window.location.href = "/app/history";
    }, [state]),
  };

  return {
    state,
    actions,
  };
};
