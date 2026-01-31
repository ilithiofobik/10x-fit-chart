/**
 * Workout Logger Provider
 * 
 * Main provider component that wraps the workout logger feature and provides
 * state management via Context API.
 */

import { useContext, useState } from "react";
import { WorkoutLoggerContext } from "../../lib/contexts/WorkoutLoggerContext";
import { useWorkoutLogger } from "../../lib/hooks/useWorkoutLogger";
import { WorkoutHeader } from "./WorkoutHeader";
import { QuickActions } from "./QuickActions";
import { ExerciseList } from "./ExerciseList";
import { ExerciseCombobox } from "./ExerciseCombobox";
import { WorkoutActions } from "./WorkoutActions";
import type { ExerciseDTO, ExerciseType } from "../../types";
import { toast } from "sonner";

/**
 * Hook to use workout logger context
 */
export const useWorkoutLoggerContext = () => {
  const context = useContext(WorkoutLoggerContext);
  if (!context) {
    throw new Error("useWorkoutLoggerContext must be used within WorkoutLoggerProvider");
  }
  return context;
};

/**
 * Workout Logger Provider Component
 */
export const WorkoutLoggerProvider = () => {
  const { state, actions } = useWorkoutLogger();
  const [isCopyingWorkout, setIsCopyingWorkout] = useState(false);

  // Copy last workout handler
  const handleCopyLastWorkout = async () => {
    setIsCopyingWorkout(true);
    try {
      const response = await fetch("/api/workouts/latest");

      if (response.status === 404) {
        toast.error("Nie masz jeszcze żadnych treningów");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch latest workout");
      }

      const data = await response.json();
      actions.loadTemplate(data);
    } catch (error) {
      console.error("Error copying last workout:", error);
      toast.error("Nie udało się załadować ostatniego treningu");
    } finally {
      setIsCopyingWorkout(false);
    }
  };

  // Create exercise handler
  const handleCreateExercise = async (
    name: string,
    type: ExerciseType
  ): Promise<ExerciseDTO> => {
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

  // Cancel handler
  const handleCancel = () => {
    if (state.exercises.length > 0) {
      const confirmed = window.confirm(
        "Masz niezapisane zmiany. Czy na pewno chcesz wyjść?"
      );
      if (!confirmed) return;
    }

    actions.resetWorkout();
    window.location.href = "/app/dashboard";
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
    );

  return (
    <WorkoutLoggerContext.Provider value={{ state, actions }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Nowy Trening</h1>
          <p className="text-muted-foreground">
            Wprowadź dane treningu używając klawiatury dla szybszego wprowadzania danych
          </p>
        </div>

        <div className="space-y-6">
          <WorkoutHeader
            date={state.date}
            notes={state.notes}
            onDateChange={actions.setDate}
            onNotesChange={actions.setNotes}
          />

          <QuickActions
            onCopyLastWorkout={handleCopyLastWorkout}
            hasExercises={state.exercises.length > 0}
            isLoading={isCopyingWorkout}
          />

          <ExerciseCombobox
            exercises={state.availableExercises}
            onAddExercise={actions.addExercise}
            onCreateExercise={handleCreateExercise}
          />

          {state.exercises.length > 0 && (
            <ExerciseList
              exercises={state.exercises}
              onRemoveExercise={actions.removeExercise}
              onUpdateSet={actions.updateSet}
              onAddSet={actions.addSet}
              onRemoveSet={actions.removeSet}
            />
          )}

          <WorkoutActions
            onSave={actions.saveWorkout}
            onCancel={handleCancel}
            isValid={isValid}
            isSaving={state.isSaving}
          />
        </div>
      </div>
    </WorkoutLoggerContext.Provider>
  );
};
