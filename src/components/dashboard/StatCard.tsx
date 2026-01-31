/**
 * StatCard - Single statistic card with icon, label and value
 * Supports loading state with Skeleton UI
 */

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatCardProps } from "@/types";

export function StatCard({ icon: Icon, label, value, formatter, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    );
  }

  const displayValue = value !== undefined ? (formatter ? formatter(value) : value.toString()) : "—";

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </div>
        <div className="text-3xl font-bold">{displayValue}</div>
      </CardContent>
    </Card>
  );
}
