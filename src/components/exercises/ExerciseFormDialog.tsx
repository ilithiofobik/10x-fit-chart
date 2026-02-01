import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  ExerciseFormDialogProps,
  ExerciseFormData,
  ExerciseType,
  CreateExerciseCommand,
  UpdateExerciseCommand,
} from "@/types";

/**
 * Dialog formularza tworzenia/edycji ćwiczenia
 */
export default function ExerciseFormDialog({
  open,
  mode,
  exercise,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: ExerciseFormDialogProps) {
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: "",
    type: undefined,
  });

  const [errors, setErrors] = useState<{ name?: string }>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inicjalizacja formularza
  useEffect(() => {
    if (open) {
      if (mode === "edit" && exercise) {
        setFormData({
          name: exercise.name,
          type: exercise.type,
        });
      } else {
        setFormData({
          name: "",
          type: undefined,
        });
      }
      setErrors({});
    }
  }, [open, mode, exercise]);

  // Focus na pole nazwy po otwarciu
  useEffect(() => {
    if (open && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [open]);

  /**
   * Walidacja nazwy
   */
  function validateName(value: string): string | undefined {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return "Nazwa ćwiczenia jest wymagana";
    }

    if (value.length > 100) {
      return "Nazwa nie może przekraczać 100 znaków";
    }

    return undefined;
  }

  /**
   * Obsługa zmiany nazwy
   */
  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, name: value }));

    // Real-time walidacja
    const error = validateName(value);
    setErrors((prev) => ({ ...prev, name: error }));
  }

  /**
   * Obsługa zmiany typu
   */
  function handleTypeChange(value: string) {
    setFormData((prev) => ({ ...prev, type: value as ExerciseType }));
  }

  /**
   * Walidacja całego formularza
   */
  function validateForm(): boolean {
    const nameError = validateName(formData.name);

    if (nameError) {
      setErrors({ name: nameError });
      nameInputRef.current?.focus();
      return false;
    }

    if (mode === "create" && !formData.type) {
      return false;
    }

    return true;
  }

  /**
   * Obsługa submitu formularza
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === "create") {
        if (!formData.type) {
          return;
        }
        const command: CreateExerciseCommand = {
          name: formData.name.trim(),
          type: formData.type,
        };
        await onSubmit(command);
      } else {
        const command: UpdateExerciseCommand = {
          name: formData.name.trim(),
        };
        await onSubmit(command);
      }
    } catch (error) {
      // Obsługa błędu 409 - duplikat nazwy
      if (error instanceof Error && error.message.includes("już istnieje")) {
        setErrors({ name: "Ćwiczenie o tej nazwie już istnieje" });
        nameInputRef.current?.focus();
      }
    }
  }

  const isFormInvalid =
    !formData.name.trim() || formData.name.length > 100 || (mode === "create" && !formData.type) || isSubmitting;

  const title = mode === "create" ? "Dodaj ćwiczenie" : "Edytuj ćwiczenie";
  const submitLabel = isSubmitting ? "Zapisywanie..." : "Zapisz";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Dodaj nowe ćwiczenie do swojej bazy."
              : "Edytuj nazwę ćwiczenia. Typ nie może być zmieniony."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Pole nazwy */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nazwa ćwiczenia <span className="text-destructive">*</span>
              </Label>
              <Input
                ref={nameInputRef}
                id="name"
                type="text"
                placeholder="np. Wyciskanie sztangi"
                value={formData.name}
                onChange={handleNameChange}
                className={errors.name ? "border-destructive" : ""}
                disabled={isSubmitting}
                maxLength={100}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              <p className="text-xs text-muted-foreground">{formData.name.length}/100 znaków</p>
            </div>

            {/* Pole typu */}
            <div className="grid gap-2">
              <Label htmlFor="type">
                Typ ćwiczenia <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.type} onValueChange={handleTypeChange} disabled={mode === "edit" || isSubmitting}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Wybierz typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Siłowe</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                </SelectContent>
              </Select>
              {mode === "edit" && (
                <p className="text-xs text-muted-foreground">Typ ćwiczenia nie może być zmieniony po utworzeniu.</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isFormInvalid}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
