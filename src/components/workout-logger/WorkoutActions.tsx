/**
 * Workout Actions Component
 *
 * Action buttons for saving or canceling the workout
 */

import { Button } from "../ui/button";
import { Save, X } from "lucide-react";
import type { WorkoutActionsProps } from "./types";

export const WorkoutActions = ({ onSave, onCancel, isValid, isSaving }: WorkoutActionsProps) => {
  // Determine disabled tooltip message
  const getDisabledReason = () => {
    if (!isValid) {
      return "Formularz jest niekompletny";
    }
    return undefined;
  };

  const disabledReason = getDisabledReason();

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="gap-2 sm:order-1">
        <X className="h-4 w-4" />
        Anuluj
      </Button>
      <Button
        type="button"
        onClick={onSave}
        disabled={!isValid || isSaving}
        className="gap-2 sm:order-2"
        title={disabledReason}
      >
        <Save className="h-4 w-4" />
        {isSaving ? "Zapisywanie..." : "Zapisz trening"}
      </Button>

      {!isValid && !isSaving && (
        <p className="text-sm text-muted-foreground text-center sm:text-right w-full sm:order-3">
          Dodaj przynajmniej jedno ćwiczenie z seriami
        </p>
      )}
    </div>
  );
};
