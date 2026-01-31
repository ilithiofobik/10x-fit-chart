/**
 * Dashboard - Main dashboard view component
 * Manages data fetching, state, and renders all dashboard sections
 */

import { useDashboard } from "@/lib/hooks/useDashboard";
import { DashboardHeader } from "./DashboardHeader";
import { StatsGrid } from "./StatsGrid";
import { RecentWorkoutsList } from "./RecentWorkoutsList";
import { ProgressChartWidget } from "./ProgressChartWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { ChartDataPoint } from "@/types";

/**
 * Transform recent workouts data to chart data points
 * Maps workout dates to chart format with proper sorting
 */
function transformToChartData(workouts: { date: string; set_count: number; id: string }[]): ChartDataPoint[] {
  // Sort by date (oldest first for chart)
  const sortedWorkouts = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

  return sortedWorkouts.map((workout) => ({
    date: workout.date, // Use ISO date as unique key for Recharts
    dateValue: workout.date,
    value: workout.set_count,
    label: `${workout.set_count} serii`,
    workoutId: workout.id,
  }));
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive h-8 w-8" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold">Wystąpił błąd</h3>
          <p className="text-muted-foreground mt-1 text-sm">{message}</p>
        </div>
        <Button onClick={onRetry} variant="outline">
          Spróbuj ponownie
        </Button>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data, selectedMonths, isLoading, error, onMonthsChange, refetch } = useDashboard(3);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header with period selector */}
      <DashboardHeader selectedMonths={selectedMonths} onMonthsChange={onMonthsChange} />

      {/* Error state */}
      {error && !isLoading && <ErrorState message={error} onRetry={refetch} />}

      {/* Main content - show even during loading to prevent layout shift */}
      {!error && (
        <>
          {/* Stats Grid */}
          <StatsGrid stats={data?.summary || ({} as any)} isLoading={isLoading} />

          {/* Two column layout for Recent Workouts and Chart */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Recent Workouts */}
            <RecentWorkoutsList workouts={data?.recent_workouts || []} isLoading={isLoading} />

            {/* Progress Chart */}
            <ProgressChartWidget
              data={data?.recent_workouts ? transformToChartData(data.recent_workouts) : []}
              isLoading={isLoading}
            />
          </div>
        </>
      )}
    </div>
  );
}

