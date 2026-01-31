import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExerciseHeaderProps } from "@/types";

/**
 * Nagłówek widoku Bazy Ćwiczeń z przyciskiem dodawania
 */
export default function ExerciseHeader({ onAddClick }: ExerciseHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Baza Ćwiczeń</h1>
      <Button onClick={onAddClick}>
        <Plus className="mr-2 h-4 w-4" />
        Dodaj ćwiczenie
      </Button>
    </header>
  );
}
