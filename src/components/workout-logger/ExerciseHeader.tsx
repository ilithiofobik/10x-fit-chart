/**
 * Exercise Header Component
 * 
 * Header section of exercise card with name, type badge, and remove button
 */

import { Button } from "../ui/button";
import { X } from "lucide-react";
import type { ExerciseHeaderProps } from "./types";

export const ExerciseHeader = ({
  exerciseName,
  exerciseType,
  onRemove,
}: ExerciseHeaderProps) => {
  const typeBadgeClass =
    exerciseType === "strength"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";

  const typeLabel = exerciseType === "strength" ? "Siłowe" : "Cardio";

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <h3 className="text-lg font-semibold truncate">{exerciseName}</h3>
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${typeBadgeClass}`}
        >
          {typeLabel}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive"
        aria-label="Usuń ćwiczenie"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
