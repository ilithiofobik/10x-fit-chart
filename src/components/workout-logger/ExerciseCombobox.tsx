/**
 * Exercise Combobox Component
 *
 * Advanced combobox for selecting or creating exercises with search functionality
 */

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Dumbbell, HeartPulse } from "lucide-react";
import { Button } from "../ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";
import type { ExerciseComboboxProps } from "./types";
import type { ExerciseType } from "../../types";
import { toast } from "sonner";

export const ExerciseCombobox = ({ exercises, onAddExercise, onCreateExercise }: ExerciseComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseType, setNewExerciseType] = useState<ExerciseType>("strength");
  const [isCreating, setIsCreating] = useState(false);

  // Filter exercises based on search
  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Group exercises by system/user
  const systemExercises = filteredExercises.filter((ex) => ex.is_system);
  const userExercises = filteredExercises.filter((ex) => !ex.is_system);

  const handleSelectExercise = (exercise: (typeof exercises)[0]) => {
    onAddExercise(exercise);
    setOpen(false);
    setSearchValue("");
    toast.success(`Dodano ćwiczenie: ${exercise.name}`);
  };

  const handleOpenCreateDialog = () => {
    setNewExerciseName(searchValue);
    setIsCreateDialogOpen(true);
    setOpen(false);
  };

  const handleCreateExercise = async () => {
    // Validation
    if (!newExerciseName.trim()) {
      toast.error("Nazwa ćwiczenia nie może być pusta");
      return;
    }

    if (newExerciseName.trim().length < 2) {
      toast.error("Nazwa ćwiczenia musi mieć co najmniej 2 znaki");
      return;
    }

    if (newExerciseName.trim().length > 100) {
      toast.error("Nazwa ćwiczenia nie może przekraczać 100 znaków");
      return;
    }

    setIsCreating(true);

    try {
      const newExercise = await onCreateExercise(newExerciseName.trim(), newExerciseType);

      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      setNewExerciseName("");
      setNewExerciseType("strength");
      setSearchValue("");

      toast.success(`Utworzono nowe ćwiczenie: ${newExercise.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się utworzyć ćwiczenia";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreateDialogOpen(false);
    setNewExerciseName("");
    setNewExerciseType("strength");
  };

  return (
    <>
      <div className="border-2 border-dashed rounded-lg p-6 bg-muted/50">
        <div className="flex flex-col items-center gap-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full max-w-md justify-between gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Dodaj ćwiczenie</span>
                <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Szukaj ćwiczenia..." value={searchValue} onValueChange={setSearchValue} />
                <CommandList>
                  <CommandEmpty>
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">Nie znaleziono ćwiczenia "{searchValue}"</p>
                      <Button variant="outline" size="sm" onClick={handleOpenCreateDialog} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Utwórz nowe ćwiczenie
                      </Button>
                    </div>
                  </CommandEmpty>

                  {systemExercises.length > 0 && (
                    <CommandGroup heading="Ćwiczenia systemowe">
                      {systemExercises.map((exercise) => (
                        <CommandItem
                          key={exercise.id}
                          value={exercise.name}
                          onSelect={() => handleSelectExercise(exercise)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {exercise.type === "strength" ? (
                              <Dumbbell className="h-4 w-4 text-blue-600" />
                            ) : (
                              <HeartPulse className="h-4 w-4 text-green-600" />
                            )}
                            <span>{exercise.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {userExercises.length > 0 && (
                    <CommandGroup heading="Moje ćwiczenia">
                      {userExercises.map((exercise) => (
                        <CommandItem
                          key={exercise.id}
                          value={exercise.name}
                          onSelect={() => handleSelectExercise(exercise)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {exercise.type === "strength" ? (
                              <Dumbbell className="h-4 w-4 text-blue-600" />
                            ) : (
                              <HeartPulse className="h-4 w-4 text-green-600" />
                            )}
                            <span>{exercise.name}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <p className="text-sm text-muted-foreground">Wybierz ćwiczenie z listy lub utwórz nowe</p>
        </div>
      </div>

      {/* Create Exercise Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Utwórz nowe ćwiczenie</DialogTitle>
            <DialogDescription>
              Dodaj własne ćwiczenie do swojej bazy. Będzie ono dostępne tylko dla Ciebie.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-name">Nazwa ćwiczenia</Label>
              <Input
                id="exercise-name"
                placeholder="np. Martwy ciąg"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                maxLength={100}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating) {
                    handleCreateExercise();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">{newExerciseName.length}/100 znaków</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-type">Typ ćwiczenia</Label>
              <Select value={newExerciseType} onValueChange={(value) => setNewExerciseType(value as ExerciseType)}>
                <SelectTrigger id="exercise-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      <span>Siłowe</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cardio">
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4" />
                      <span>Cardio</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {newExerciseType === "strength"
                  ? "Będziesz logować ciężar i powtórzenia"
                  : "Będziesz logować dystans i czas"}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelCreate} disabled={isCreating}>
              Anuluj
            </Button>
            <Button onClick={handleCreateExercise} disabled={isCreating || !newExerciseName.trim()}>
              {isCreating ? "Tworzenie..." : "Utwórz ćwiczenie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
