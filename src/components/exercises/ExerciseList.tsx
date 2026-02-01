import type { ExerciseListProps } from "@/types";
import ExerciseCard from "./ExerciseCard";

/**
 * Kontener wyświetlający listę ćwiczeń
 */
export default function ExerciseList({ exercises, isLoading, onEdit, onArchive }: ExerciseListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[120px] rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">Nie znaleziono ćwiczeń</p>
        <p className="text-sm text-muted-foreground mt-2">Spróbuj zmienić filtry lub dodaj nowe ćwiczenie</p>
      </div>
    );
  }

  // Success state - lista ćwiczeń
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} onEdit={onEdit} onArchive={onArchive} />
      ))}
    </div>
  );
}
