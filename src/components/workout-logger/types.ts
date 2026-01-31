/**
 * Workout Logger - Type Definitions
 *
 * This file contains all types specific to the Workout Logger feature.
 * These types extend the base DTOs from src/types.ts with UI-specific structures.
 */

import type { ExerciseDTO, ExerciseType, WorkoutDetailsDTO } from "../../types";

/**
 * Stan pojedynczej serii w formularzu
 */
export interface SetData {
  // Strength fields
  weight: number | null;
  reps: number | null;
  // Cardio fields
  distance: number | null;
  time: number | null; // w sekundach
}

/**
 * Ćwiczenie w kontekście treningu (z przypisanymi seriami)
 */
export interface WorkoutExercise {
  id: string; // temporary ID dla UI (nie exercise_id z bazy)
  exercise_id: string; // ID z tabeli exercises
  exercise_name: string;
  exercise_type: ExerciseType;
  sets: SetData[];
}

/**
 * Główny stan formularza loggera
 */
export interface WorkoutLoggerState {
  date: string; // YYYY-MM-DD
  notes: string | null;
  exercises: WorkoutExercise[];
  availableExercises: ExerciseDTO[];
  isLoadingExercises: boolean;
  isSaving: boolean;
}

/**
 * Akcje dostępne w kontekście
 */
export interface WorkoutLoggerActions {
  setDate: (date: string) => void;
  setNotes: (notes: string | null) => void;
  addExercise: (exercise: ExerciseDTO) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateSet: (exerciseId: string, setIndex: number, data: Partial<SetData>) => void;
  loadTemplate: (template: WorkoutDetailsDTO) => void;
  resetWorkout: () => void;
  saveWorkout: () => Promise<void>;
}

/**
 * Props komponentów
 */
export interface WorkoutHeaderProps {
  date: string;
  notes: string | null;
  onDateChange: (date: string) => void;
  onNotesChange: (notes: string) => void;
}

export interface QuickActionsProps {
  onCopyLastWorkout: () => Promise<void>;
  hasExercises: boolean;
  isLoading: boolean;
}

export interface ExerciseListProps {
  exercises: WorkoutExercise[];
  onRemoveExercise: (exerciseId: string) => void;
  onUpdateSet: (exerciseId: string, setIndex: number, data: Partial<SetData>) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setIndex: number) => void;
}

export interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onRemove: () => void;
  onUpdateSet: (setIndex: number, data: Partial<SetData>) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
}

export interface ExerciseHeaderProps {
  exerciseName: string;
  exerciseType: ExerciseType;
  onRemove: () => void;
}

export interface SetTableProps {
  exerciseType: ExerciseType;
  sets: SetData[];
  onUpdateSet: (setIndex: number, data: Partial<SetData>) => void;
  onRemoveSet: (setIndex: number) => void;
  onAddSet: () => void;
}

export interface SetRowProps {
  exerciseType: ExerciseType;
  setIndex: number;
  setData: SetData;
  isLastSet: boolean;
  onUpdate: (data: Partial<SetData>) => void;
  onRemove: () => void;
  onEnterPressed: () => void;
}

export interface ExerciseComboboxProps {
  exercises: ExerciseDTO[];
  onAddExercise: (exercise: ExerciseDTO) => void;
  onCreateExercise: (name: string, type: ExerciseType) => Promise<ExerciseDTO>;
}

export interface WorkoutActionsProps {
  onSave: () => Promise<void>;
  onCancel: () => void;
  isValid: boolean;
  isSaving: boolean;
}

/**
 * Klucz localStorage
 */
export const WORKOUT_DRAFT_KEY = "workout_draft";

/**
 * Action types dla reducer
 */
export type WorkoutLoggerActionType =
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_NOTES"; payload: string | null }
  | { type: "ADD_EXERCISE"; payload: ExerciseDTO }
  | { type: "REMOVE_EXERCISE"; payload: string }
  | { type: "ADD_SET"; payload: string }
  | { type: "REMOVE_SET"; payload: { exerciseId: string; setIndex: number } }
  | { type: "UPDATE_SET"; payload: { exerciseId: string; setIndex: number; data: Partial<SetData> } }
  | { type: "LOAD_TEMPLATE"; payload: WorkoutDetailsDTO }
  | { type: "LOAD_DRAFT"; payload: Partial<WorkoutLoggerState> }
  | { type: "SET_AVAILABLE_EXERCISES"; payload: ExerciseDTO[] }
  | { type: "SET_LOADING_EXERCISES"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "RESET" };
