/**
 * Workout Editor Provider
 *
 * Main provider component that wraps the workout editor feature and provides
 * state management via Context API. Re-uses workout-logger components for
 * exercise and set management.
 */

import { useContext } from "react";
import { WorkoutEditorContext } from "../../lib/contexts/WorkoutEditorContext";
import { useWorkoutEditor } from "../../lib/hooks/useWorkoutEditor";
import { EditWorkoutHeader } from "./EditWorkoutHeader";
import { WorkoutEditorActions } from "./WorkoutEditorActions";
import { ExerciseCombobox } from "../workout-logger/ExerciseCombobox";
import { ExerciseList } from "../workout-logger/ExerciseList";
import type { ExerciseDTO, ExerciseType } from "../../types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * Hook to use workout editor context
 */
export const useWorkoutEditorContext = () => {
  const context = useContext(WorkoutEditorContext);
  if (!context) {
    throw new Error("useWorkoutEditorContext must be used within WorkoutEditorProvider");
  }
  return context;
};

interface WorkoutEditorProviderProps {
  workoutId: string;
}

/**
 * Workout Editor Provider Component
 */
export const WorkoutEditorProvider = ({ workoutId }: WorkoutEditorProviderProps) => {
  const { state, actions } = useWorkoutEditor(workoutId);

  // Create exercise handler
  const handleCreateExercise = async (name: string, type: ExerciseType): Promise<ExerciseDTO> => {
    const response = await fetch("/api/exercises", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, type }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 409) {
        throw new Error("Ćwiczenie o tej nazwie już istnieje. Wybierz je z listy.");
      }
      throw new Error(errorData.message || "Failed to create exercise");
    }

    const newExercise = await response.json();

    // Automatically add the newly created exercise to the workout
    actions.addExercise(newExercise);

    return newExercise;
  };

  // Validation
  const isValid =
    state.exercises.length > 0 &&
    state.exercises.every(
      (ex) =>
        ex.sets.length > 0 &&
        ex.sets.every((set) => {
          if (ex.exercise_type === "strength") {
            return set.weight !== null && set.reps !== null;
          } else {
            return set.distance !== null && set.time !== null;
          }
        })
    ) &&
    (state.notes === null || state.notes.length <= 1000) &&
    state.date <= new Date().toISOString().split("T")[0];

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Ładowanie treningu...</p>
        </div>
      </div>
    );
  }

  // Show error if workout not loaded
  if (!state.workoutId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive text-lg mb-4">Nie udało się załadować treningu</p>
          <button
            onClick={() => (window.location.href = "/app/history")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Wróć do historii
          </button>
        </div>
      </div>
    );
  }

  return (
    <WorkoutEditorContext.Provider value={{ state, actions }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <EditWorkoutHeader
            date={state.date}
            notes={state.notes}
            createdAt={state.createdAt}
            onDateChange={actions.setDate}
            onNotesChange={actions.setNotes}
          />

          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Ćwiczenia</h3>
            
            <ExerciseCombobox
              exercises={state.availableExercises}
              onAddExercise={actions.addExercise}
              onCreateExercise={handleCreateExercise}
            />

            {state.exercises.length > 0 && (
              <div className="mt-6">
                <ExerciseList
                  exercises={state.exercises}
                  onRemoveExercise={actions.removeExercise}
                  onUpdateSet={actions.updateSet}
                  onAddSet={actions.addSet}
                  onRemoveSet={actions.removeSet}
                />
              </div>
            )}

            {state.exercises.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Dodaj ćwiczenia używając pola powyżej
              </p>
            )}
          </div>

          <WorkoutEditorActions
            isValid={isValid}
            isSaving={state.isSaving}
            isDeleting={state.isDeleting}
            onSave={actions.saveWorkout}
            onDelete={actions.deleteWorkout}
            onCancel={actions.cancelEdit}
          />
        </div>
      </div>
    </WorkoutEditorContext.Provider>
  );
};
