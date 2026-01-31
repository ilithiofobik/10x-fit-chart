/**
 * Exercise Card Component
 * 
 * Card displaying a single exercise with its sets
 */

import { Card, CardContent, CardHeader } from "../ui/card";
import { ExerciseHeader } from "./ExerciseHeader";
import { SetTable } from "./SetTable";
import type { ExerciseCardProps } from "./types";

export const ExerciseCard = ({
  exercise,
  onRemove,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
}: ExerciseCardProps) => {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <ExerciseHeader
          exerciseName={exercise.exercise_name}
          exerciseType={exercise.exercise_type}
          onRemove={onRemove}
        />
      </CardHeader>
      <CardContent className="pt-0">
        <SetTable
          exerciseType={exercise.exercise_type}
          sets={exercise.sets}
          onUpdateSet={onUpdateSet}
          onRemoveSet={onRemoveSet}
          onAddSet={onAddSet}
        />
        
        {exercise.sets.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-md">
            Dodaj pierwszą serię
          </div>
        )}
      </CardContent>
    </Card>
  );
};
