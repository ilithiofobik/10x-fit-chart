/**
 * RecentWorkoutsList - List of recent workouts
 * Shows up to 5 recent workouts with summary cards
 * Includes loading state with skeleton cards and empty state
 */

import { RecentWorkoutsHeader } from "./RecentWorkoutsHeader";
import { WorkoutSummaryCard } from "./WorkoutSummaryCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell } from "lucide-react";
import type { RecentWorkoutsListProps } from "@/types";

function WorkoutSummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  const handleAddWorkout = () => {
    window.location.href = "/app/log";
  };

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
          <Dumbbell className="text-muted-foreground h-8 w-8" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold">Brak treningów</h3>
          <p className="text-muted-foreground mt-1 text-sm">Zacznij logować swoje treningi, aby zobaczyć postępy!</p>
        </div>
        <Button onClick={handleAddWorkout} className="gap-2">
          <Plus className="h-4 w-4" />
          Zaloguj trening
        </Button>
      </CardContent>
    </Card>
  );
}

export function RecentWorkoutsList({ workouts, isLoading }: RecentWorkoutsListProps) {
  const handleWorkoutClick = (workoutId: string) => {
    window.location.href = `/app/history/${workoutId}`;
  };

  // Limit to 5 most recent workouts
  const recentWorkouts = workouts.slice(0, 5);

  return (
    <div className="space-y-4">
      <RecentWorkoutsHeader />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <WorkoutSummaryCardSkeleton key={index} />
          ))}
        </div>
      ) : recentWorkouts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {recentWorkouts.map((workout) => (
            <WorkoutSummaryCard key={workout.id} workout={workout} onClick={handleWorkoutClick} />
          ))}
        </div>
      )}
    </div>
  );
}
