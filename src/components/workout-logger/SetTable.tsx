/**
 * Set Table Component
 *
 * Table displaying all sets for an exercise
 */

import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { SetRow } from "./SetRow";
import type { SetTableProps } from "./types";

export const SetTable = ({ exerciseType, sets, onUpdateSet, onRemoveSet, onAddSet }: SetTableProps) => {
  const isStrength = exerciseType === "strength";

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2 font-medium">Seria</th>
              {isStrength ? (
                <>
                  <th className="text-left py-2 px-2 font-medium">Ciężar (kg)</th>
                  <th className="text-left py-2 px-2 font-medium">Powtórzenia</th>
                </>
              ) : (
                <>
                  <th className="text-left py-2 px-2 font-medium">Dystans (km)</th>
                  <th className="text-left py-2 px-2 font-medium">Czas (min)</th>
                </>
              )}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, index) => (
              <SetRow
                key={index}
                exerciseType={exerciseType}
                setIndex={index}
                setData={set}
                isLastSet={index === sets.length - 1}
                onUpdate={(data) => onUpdateSet(index, data)}
                onRemove={() => onRemoveSet(index)}
                onEnterPressed={onAddSet}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onAddSet} className="gap-2">
        <Plus className="h-4 w-4" />
        Dodaj serię
      </Button>
    </div>
  );
};
