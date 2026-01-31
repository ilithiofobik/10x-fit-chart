import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { ExerciseFiltersProps } from "@/types";

/**
 * Sekcja filtrów dla listy ćwiczeń
 */
export default function ExerciseFilters({
  searchQuery,
  typeFilter,
  onSearchChange,
  onTypeFilterChange,
}: ExerciseFiltersProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Debounced search - 300ms
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(localSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, onSearchChange]);

  // Walidacja długości tekstu wyszukiwania
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.length <= 100) {
        setLocalSearchQuery(value);
      }
    },
    []
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Pole wyszukiwania */}
      <div className="flex-1">
        <Label htmlFor="search" className="sr-only">
          Szukaj ćwiczenia
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            placeholder="Szukaj ćwiczenia..."
            value={localSearchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtr typu */}
      <div className="w-full sm:w-[200px]">
        <Label htmlFor="type-filter" className="sr-only">
          Typ ćwiczenia
        </Label>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger id="type-filter">
            <SelectValue placeholder="Typ ćwiczenia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="strength">Siłowe</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
