/**
 * StatsGrid - Grid of KPI cards displaying main statistics
 * Shows total workouts, sets, volume, and unique exercises
 */

import { Dumbbell, ListChecks, Weight, Activity } from "lucide-react";
import { StatCard } from "./StatCard";
import { formatNumber, formatVolume } from "@/lib/utils/formatters";
import type { StatsGridProps } from "@/types";

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Dumbbell} label="Łącznie treningów" value={stats?.total_workouts} isLoading={isLoading} />

      <StatCard
        icon={ListChecks}
        label="Łącznie serii"
        value={stats?.total_sets}
        formatter={formatNumber}
        isLoading={isLoading}
      />

      <StatCard
        icon={Weight}
        label="Objętość"
        value={stats?.total_volume}
        formatter={formatVolume}
        isLoading={isLoading}
      />

      <StatCard icon={Activity} label="Unikalne ćwiczenia" value={stats?.unique_exercises} isLoading={isLoading} />
    </div>
  );
}
