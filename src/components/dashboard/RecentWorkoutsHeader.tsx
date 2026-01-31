/**
 * RecentWorkoutsHeader - Header for recent workouts section
 * Shows title and "View all" link to history
 */

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecentWorkoutsHeader() {
  const handleViewAll = () => {
    window.location.href = "/app/history";
  };

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">Ostatnie treningi</h2>

      <Button variant="ghost" size="sm" onClick={handleViewAll} className="gap-2">
        Zobacz wszystkie
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
