/**
 * Set Row Component
 *
 * Polymorphic row component that renders different fields based on exercise type
 */

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { SetRowProps } from "./types";

export const SetRow = ({
  exerciseType,
  setIndex,
  setData,
  isLastSet,
  onUpdate,
  onRemove,
  onEnterPressed,
}: SetRowProps) => {
  const isStrength = exerciseType === "strength";

  // Validation helpers
  const isWeightValid = setData.weight === null || (setData.weight >= 0 && setData.weight <= 999.99);
  const isRepsValid = setData.reps === null || (setData.reps >= 1 && Number.isInteger(setData.reps));
  const isDistanceValid = setData.distance === null || (setData.distance >= 0 && setData.distance <= 999999.99);
  const isTimeValid = setData.time === null || setData.time >= 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isLastField: boolean) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (isLastField && isLastSet) {
        // Check if current row is complete before adding new set
        const isCurrentRowComplete = isStrength
          ? setData.weight !== null && setData.reps !== null && isWeightValid && isRepsValid
          : setData.distance !== null && setData.time !== null && isDistanceValid && isTimeValid;

        if (isCurrentRowComplete) {
          onEnterPressed();
        }
      }
    }
  };

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="py-2 px-2">
        <span className="font-medium text-muted-foreground">{setIndex + 1}</span>
      </td>

      {isStrength ? (
        <>
          {/* Weight Input */}
          <td className="py-2 px-2">
            <Input
              type="number"
              min="0"
              max="999.99"
              step="0.5"
              value={setData.weight ?? ""}
              onChange={(e) => onUpdate({ weight: e.target.value ? parseFloat(e.target.value) : null })}
              onKeyDown={(e) => handleKeyDown(e, false)}
              placeholder="0"
              className={cn("w-24", !isWeightValid && "border-destructive focus-visible:ring-destructive")}
              aria-label={`Seria ${setIndex + 1}: Ciężar`}
              aria-invalid={!isWeightValid}
            />
          </td>

          {/* Reps Input */}
          <td className="py-2 px-2">
            <Input
              type="number"
              min="1"
              step="1"
              value={setData.reps ?? ""}
              onChange={(e) => onUpdate({ reps: e.target.value ? parseInt(e.target.value) : null })}
              onKeyDown={(e) => handleKeyDown(e, true)}
              placeholder="0"
              className={cn("w-24", !isRepsValid && "border-destructive focus-visible:ring-destructive")}
              aria-label={`Seria ${setIndex + 1}: Powtórzenia`}
              aria-invalid={!isRepsValid}
            />
          </td>
        </>
      ) : (
        <>
          {/* Distance Input */}
          <td className="py-2 px-2">
            <Input
              type="number"
              min="0"
              max="999999.99"
              step="0.01"
              value={setData.distance ?? ""}
              onChange={(e) => onUpdate({ distance: e.target.value ? parseFloat(e.target.value) : null })}
              onKeyDown={(e) => handleKeyDown(e, false)}
              placeholder="0"
              className={cn("w-24", !isDistanceValid && "border-destructive focus-visible:ring-destructive")}
              aria-label={`Seria ${setIndex + 1}: Dystans`}
              aria-invalid={!isDistanceValid}
            />
          </td>

          {/* Time Input (in minutes, converted to seconds) */}
          <td className="py-2 px-2">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={setData.time ? (setData.time / 60).toFixed(1) : ""}
              onChange={(e) => {
                const minutes = e.target.value ? parseFloat(e.target.value) : null;
                onUpdate({ time: minutes ? Math.round(minutes * 60) : null });
              }}
              onKeyDown={(e) => handleKeyDown(e, true)}
              placeholder="0"
              className={cn("w-24", !isTimeValid && "border-destructive focus-visible:ring-destructive")}
              aria-label={`Seria ${setIndex + 1}: Czas`}
              aria-invalid={!isTimeValid}
            />
          </td>
        </>
      )}

      {/* Remove Button */}
      <td className="py-2 px-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Usuń serię ${setIndex + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};
