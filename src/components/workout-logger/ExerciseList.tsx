/**
 * Exercise List Component
 *
 * Displays list of exercises in the workout
 */

import { Dumbbell } from "lucide-react";
import { ExerciseCard } from "./ExerciseCard";
import type { ExerciseListProps } from "./types";

export const ExerciseList = ({
  exercises,
  onRemoveExercise,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
}: ExerciseListProps) => {
  if (exercises.length === 0) {
    return (
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Dumbbell className="h-12 w-12 opacity-50" />
          <div>
            <p className="font-medium">Brak ćwiczeń w treningu</p>
            <p className="text-sm mt-1">Dodaj pierwsze ćwiczenie, aby rozpocząć</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise, index) => (
        <div key={exercise.id} className="relative">
          {/* Exercise number badge */}
          <div className="absolute -left-3 -top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
            {index + 1}
          </div>

          <ExerciseCard
            exercise={exercise}
            onRemove={() => onRemoveExercise(exercise.id)}
            onUpdateSet={(setIndex, data) => onUpdateSet(exercise.id, setIndex, data)}
            onAddSet={() => onAddSet(exercise.id)}
            onRemoveSet={(setIndex) => onRemoveSet(exercise.id, setIndex)}
          />
        </div>
      ))}
    </div>
  );
};
