/**
 * Workout Header Component
 * 
 * Header section of the workout form containing date picker and notes field.
 */

import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import type { WorkoutHeaderProps } from "./types";
import { cn } from "../../lib/utils";

export const WorkoutHeader = ({
  date,
  notes,
  onDateChange,
  onNotesChange,
}: WorkoutHeaderProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Parse date string to Date object
  const dateObj = date ? new Date(date) : new Date();

  // Today's date for validation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    // Validation: Date cannot be in the future
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      return; // Don't allow future dates
    }

    // Format to YYYY-MM-DD
    const formatted = format(selectedDate, "yyyy-MM-dd");
    onDateChange(formatted);
    setIsCalendarOpen(false);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onNotesChange(value || null);
  };

  // Character count for notes
  const notesLength = notes?.length || 0;
  const maxNotesLength = 1000;
  const isNotesOverLimit = notesLength > maxNotesLength;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label htmlFor="workout-date">Data treningu</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                id="workout-date"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? (
                  format(dateObj, "PPP", { locale: pl })
                ) : (
                  <span>Wybierz datę</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateObj}
                onSelect={handleDateSelect}
                disabled={(date) => {
                  const checkDate = new Date(date);
                  checkDate.setHours(0, 0, 0, 0);
                  return checkDate > today; // Disable future dates
                }}
                initialFocus
                locale={pl}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Notes Field */}
        <div className="space-y-2 sm:col-span-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="workout-notes">Notatki (opcjonalne)</Label>
            <span
              className={cn(
                "text-sm",
                isNotesOverLimit ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {notesLength}/{maxNotesLength}
            </span>
          </div>
          <Textarea
            id="workout-notes"
            placeholder="Dodaj notatki do treningu..."
            value={notes || ""}
            onChange={handleNotesChange}
            maxLength={maxNotesLength}
            rows={3}
            className={cn(isNotesOverLimit && "border-destructive")}
          />
        </div>
      </div>
    </div>
  );
};
