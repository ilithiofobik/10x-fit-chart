/**
 * Empty State Component
 *
 * Displayed when the user has no workouts in their history.
 */

import { Button } from "../ui/button";
import { Calendar, Plus } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 p-6 bg-muted rounded-full">
        <Calendar className="h-12 w-12 text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-semibold mb-2">Nie masz jeszcze żadnych treningów</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Zacznij swoją podróż fitness, logując pierwszy trening. Wszystkie treningi pojawią się tutaj.
      </p>

      <Button asChild className="gap-2">
        <a href="/app/log">
          <Plus className="h-4 w-4" />
          Zaloguj pierwszy trening
        </a>
      </Button>
    </div>
  );
};
