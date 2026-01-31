/**
 * WorkoutSummaryCard - Compact card for a single workout
 * Shows date, exercise count, and set count
 * Clickable - navigates to workout details
 */

import { Calendar, Dumbbell, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatWorkoutDate } from "@/lib/utils/formatters";
import type { WorkoutSummaryCardProps } from "@/types";

export function WorkoutSummaryCard({ workout, onClick }: WorkoutSummaryCardProps) {
  const handleClick = () => {
    onClick(workout.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(workout.id);
    }
  };

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Przejdź do treningu z ${formatWorkoutDate(workout.date)}`}
    >
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-4 w-4" />
          <span className="font-medium">{formatWorkoutDate(workout.date)}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <Dumbbell className="h-4 w-4" />
            <span>{workout.exercise_count}</span>
          </div>

          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <ListChecks className="h-4 w-4" />
            <span>{workout.set_count}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
