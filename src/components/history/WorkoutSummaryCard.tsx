/**
 * Workout Summary Card Component
 *
 * Displays a summary of a single workout in the history list.
 */

import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, Dumbbell, ListChecks, Edit } from "lucide-react";
import type { WorkoutListItemDTO } from "../../types";

interface WorkoutSummaryCardProps {
  workout: WorkoutListItemDTO;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time for comparison
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return "Dzisiaj";
  } else if (date.getTime() === yesterday.getTime()) {
    return "Wczoraj";
  } else {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
};

const truncateNotes = (notes: string | null, maxLength: number = 100): string => {
  if (!notes) return "";
  if (notes.length <= maxLength) return notes;
  return notes.substring(0, maxLength) + "...";
};

export const WorkoutSummaryCard = ({ workout }: WorkoutSummaryCardProps) => {
  const dateLabel = formatDate(workout.date);
  const isRecent = dateLabel === "Dzisiaj" || dateLabel === "Wczoraj";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{dateLabel}</span>
          </div>
          {isRecent && (
            <Badge variant="secondary" className="text-xs">
              {dateLabel}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Dumbbell className="h-4 w-4" />
          <span>
            {workout.exercise_count} {workout.exercise_count === 1 ? "ćwiczenie" : "ćwiczenia"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ListChecks className="h-4 w-4" />
          <span>
            {workout.set_count} {workout.set_count === 1 ? "seria" : workout.set_count < 5 ? "serie" : "serii"}
          </span>
        </div>

        {workout.notes && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{truncateNotes(workout.notes)}</p>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild variant="outline" className="w-full gap-2">
          <a href={`/app/history/${workout.id}`}>
            <Edit className="h-4 w-4" />
            Edytuj
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};
