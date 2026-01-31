/**
 * Quick Actions Component
 * 
 * Provides quick action buttons like "Copy Last Workout"
 */

import { Button } from "../ui/button";
import { Copy, Loader2 } from "lucide-react";
import type { QuickActionsProps } from "./types";

export const QuickActions = ({
  onCopyLastWorkout,
  hasExercises,
  isLoading,
}: QuickActionsProps) => {
  const getButtonTooltip = () => {
    if (hasExercises) {
      return "Usuń wszystkie ćwiczenia, aby skopiować ostatni trening";
    }
    return "Skopiuj ćwiczenia i serie z ostatniego treningu";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <Button
        variant="outline"
        onClick={onCopyLastWorkout}
        disabled={hasExercises || isLoading}
        className="gap-2"
        title={getButtonTooltip()}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {isLoading ? "Ładowanie..." : "Kopiuj ostatni trening"}
      </Button>
      
      <p className="text-sm text-muted-foreground">
        Zaoszczędź czas kopiując strukturę poprzedniego treningu
      </p>
    </div>
  );
};
