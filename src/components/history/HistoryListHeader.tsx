/**
 * History List Header Component
 *
 * Displays the title, description, and filter controls for the workout history page.
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Filter, X } from "lucide-react";
import type { HistoryFilters, ExerciseDTO } from "../../types";

interface HistoryListHeaderProps {
  filters: HistoryFilters;
  exercises: ExerciseDTO[];
  onFilterChange: (filters: HistoryFilters) => void;
  onResetFilters: () => void;
}

export const HistoryListHeader = ({ filters, exercises, onFilterChange, onResetFilters }: HistoryListHeaderProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<HistoryFilters>(filters);

  const hasActiveFilters = filters.start_date || filters.end_date || filters.exercise_id;

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
    setIsFilterOpen(false);
  };

  const handleReset = () => {
    setLocalFilters({
      start_date: null,
      end_date: null,
      exercise_id: null,
    });
    onResetFilters();
    setIsFilterOpen(false);
  };

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Historia Treningów</h1>
          <p className="text-muted-foreground">
            Przeglądaj i edytuj swoje wcześniejsze treningi
          </p>
        </div>

        <div className="flex gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtry
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                    {[filters.start_date, filters.end_date, filters.exercise_id].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Filtruj treningi</h3>
                </div>

                <div className="space-y-2">
                  <Label>Data od</Label>
                  <input
                    type="date"
                    value={localFilters.start_date || ""}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, start_date: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data do</Label>
                  <input
                    type="date"
                    value={localFilters.end_date || ""}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, end_date: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ćwiczenie</Label>
                  <Select
                    value={localFilters.exercise_id || "all"}
                    onValueChange={(value) =>
                      setLocalFilters({ ...localFilters, exercise_id: value === "all" ? null : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wszystkie ćwiczenia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie ćwiczenia</SelectItem>
                      {exercises.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleApplyFilters} className="flex-1">
                    Zastosuj
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    Resetuj
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button onClick={handleReset} variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
