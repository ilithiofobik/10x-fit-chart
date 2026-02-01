/**
 * ProgressChartWidget - Widget containing chart header and chart
 * Shows workout progress chart with loading and empty states
 */

import { ChartHeader } from "./ChartHeader";
import { ProgressChart } from "./ProgressChart";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import type { ProgressChartWidgetProps } from "@/types";

function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

function EmptyChartState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
          <TrendingUp className="text-muted-foreground h-8 w-8" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold">Brak danych do wyświetlenia</h3>
          <p className="text-muted-foreground mt-1 text-sm">Wykres pojawi się, gdy zaczniesz logować treningi</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressChartWidget({ data, isLoading }: ProgressChartWidgetProps) {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (data.length === 0) {
    return <EmptyChartState />;
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <ChartHeader title="Postęp treningowy" />
        <ProgressChart data={data} xAxisKey="date" yAxisKey="value" />
      </CardContent>
    </Card>
  );
}
