/**
 * Edit Workout Header Component
 *
 * Displays date picker, notes textarea, and original creation timestamp.
 */

import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface EditWorkoutHeaderProps {
  date: string;
  notes: string | null;
  createdAt: string | null;
  onDateChange: (date: string) => void;
  onNotesChange: (notes: string | null) => void;
}

const formatCreatedAt = (timestamp: string | null): string => {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const EditWorkoutHeader = ({ date, notes, createdAt, onDateChange, onNotesChange }: EditWorkoutHeaderProps) => {
  const notesLength = notes?.length || 0;
  const maxLength = 1000;
  const isNotesTooLong = notesLength > maxLength;

  // Validate date is not in future
  const today = new Date().toISOString().split("T")[0];
  const isDateInFuture = date > today;

  return (
    <div className="space-y-4 bg-card border rounded-lg p-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Edytuj Trening</h2>
        {createdAt && (
          <p className="text-sm text-muted-foreground">
            Utworzono: {formatCreatedAt(createdAt)}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="workout-date">Data treningu</Label>
          <input
            id="workout-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => onDateChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              isDateInFuture ? "border-destructive" : ""
            }`}
          />
          {isDateInFuture && (
            <p className="text-xs text-destructive">Data nie może być w przyszłości</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workout-notes">Notatki (opcjonalnie)</Label>
        <Textarea
          id="workout-notes"
          value={notes || ""}
          onChange={(e) => onNotesChange(e.target.value || null)}
          placeholder="Dodaj notatki do treningu..."
          rows={3}
          maxLength={maxLength}
          className={isNotesTooLong ? "border-destructive" : ""}
        />
        <div className="flex justify-between items-center text-xs">
          <span className={isNotesTooLong ? "text-destructive" : "text-muted-foreground"}>
            {notesLength} / {maxLength} znaków
          </span>
          {isNotesTooLong && (
            <span className="text-destructive font-medium">Przekroczono limit znaków</span>
          )}
        </div>
      </div>
    </div>
  );
};
