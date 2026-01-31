/**
 * History List Component
 *
 * Displays the list of workout summary cards with infinite scroll support.
 */

import { WorkoutSummaryCard } from "./WorkoutSummaryCard";
import { LoadMoreButton } from "./LoadMoreButton";
import { Card, CardContent } from "../ui/card";
import type { WorkoutListItemDTO, PaginationDTO } from "../../types";

interface HistoryListProps {
  workouts: WorkoutListItemDTO[];
  pagination: PaginationDTO;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export const HistoryList = ({ workouts, pagination, isLoading, isLoadingMore, onLoadMore }: HistoryListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workouts.map((workout) => (
          <WorkoutSummaryCard key={workout.id} workout={workout} />
        ))}
      </div>

      {pagination.has_more && (
        <LoadMoreButton hasMore={pagination.has_more} isLoading={isLoadingMore} onClick={onLoadMore} />
      )}

      {!pagination.has_more && workouts.length > 0 && (
        <p className="text-center text-muted-foreground py-4">To wszystkie treningi</p>
      )}
    </div>
  );
};
