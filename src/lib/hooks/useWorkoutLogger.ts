/**
 * useWorkoutLogger Hook
 *
 * Custom hook that manages workout logger state, API calls, and localStorage persistence.
 */

import { useReducer, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { workoutLoggerReducer, getInitialState } from "./workoutLoggerReducer";
import type { WorkoutLoggerState, WorkoutLoggerActions } from "../../components/workout-logger/types";
import type { ExerciseDTO, CreateWorkoutCommand, WorkoutDetailsDTO } from "../../types";

const DRAFT_KEY = "workout_draft";

/**
 * Transform state to API payload
 */
const transformStateToPayload = (state: WorkoutLoggerState): CreateWorkoutCommand => {
  const sets: CreateWorkoutCommand["sets"] = [];
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
const validateWorkout = (state: WorkoutLoggerState): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if there's at least one exercise
  if (state.exercises.length === 0) {
    errors.push("Dodaj przynajmniej jedno ćwiczenie");
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
 * Custom hook for workout logger
 */
export const useWorkoutLogger = () => {
  const [state, dispatch] = useReducer(workoutLoggerReducer, getInitialState());

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        dispatch({ type: "LOAD_DRAFT", payload: parsed });
        toast.success("Załadowano zapisany draft");
      }
    } catch (error) {
      console.error("Failed to load draft from localStorage:", error);
      localStorage.removeItem(DRAFT_KEY);
      toast.error("Nie udało się przywrócić draftu. Rozpocznij od nowa.");
    }
  }, []);

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

  // Debounced save to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const draftData = {
          date: state.date,
          notes: state.notes,
          exercises: state.exercises,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      } catch (error) {
        console.error("Failed to save draft to localStorage:", error);
        toast.error("Nie można zapisać draftu lokalnie");
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [state.date, state.notes, state.exercises]);

  // Actions
  const actions: WorkoutLoggerActions = {
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

    loadTemplate: useCallback((template: WorkoutDetailsDTO) => {
      dispatch({ type: "LOAD_TEMPLATE", payload: template });
      toast.success("Załadowano szablon z ostatniego treningu");
    }, []),

    resetWorkout: useCallback(() => {
      dispatch({ type: "RESET" });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (error) {
        console.error("Failed to clear draft from localStorage:", error);
      }
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
        const payload = transformStateToPayload(state);
        const response = await fetch("/api/workouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to save workout");
        }

        // Success
        toast.success("Trening zapisany!");
        localStorage.removeItem(DRAFT_KEY);

        // Redirect to dashboard
        window.location.href = "/app/dashboard";
      } catch (error) {
        console.error("Error saving workout:", error);
        toast.error(error instanceof Error ? error.message : "Nie udało się zapisać treningu. Spróbuj ponownie.");
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    }, [state]),
  };

  return {
    state,
    actions,
  };
};
