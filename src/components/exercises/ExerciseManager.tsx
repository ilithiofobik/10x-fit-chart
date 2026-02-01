import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import type {
  ExercisesViewState,
  ExerciseDTO,
  CreateExerciseCommand,
  UpdateExerciseCommand,
  ListExercisesResponse,
  ExerciseTypeFilter,
} from "@/types";
import ExerciseHeader from "./ExerciseHeader";
import ExerciseFilters from "./ExerciseFilters";
import ExerciseList from "./ExerciseList";
import ExerciseFormDialog from "./ExerciseFormDialog";
import ConfirmArchiveDialog from "./ConfirmArchiveDialog";

/**
 * Główny komponent zarządzający widokiem Bazy Ćwiczeń
 */
export default function ExerciseManager() {
  const [state, setState] = useState<ExercisesViewState>({
    exercises: [],
    searchQuery: "",
    typeFilter: "all",
    isLoading: true,
    error: null,
    formDialog: {
      open: false,
      mode: "create",
      exercise: null,
      isSubmitting: false,
    },
    archiveDialog: {
      open: false,
      exercise: null,
      isDeleting: false,
    },
  });

  /**
   * Pobieranie listy ćwiczeń z API
   */
  async function fetchExercises() {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const params = new URLSearchParams();
      params.append("include_archived", "false");

      const response = await fetch(`/api/exercises?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Sesja wygasła. Zaloguj się ponownie.");
          window.location.href = "/login?redirect=/app/exercises";
          return;
        }
        throw new Error("Nie udało się pobrać listy ćwiczeń");
      }

      const data: ListExercisesResponse = await response.json();

      setState((prev) => ({
        ...prev,
        exercises: data.exercises,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      setState((prev) => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
      toast.error("Błąd podczas pobierania ćwiczeń");
    }
  }

  /**
   * Pobierz ćwiczenia przy montowaniu komponentu
   */
  useEffect(() => {
    fetchExercises();
  }, []);

  /**
   * Filtrowana lista ćwiczeń
   */
  const filteredExercises = useMemo(() => {
    return state.exercises
      .filter((ex) => {
        // Filtr typu
        if (state.typeFilter !== "all" && ex.type !== state.typeFilter) {
          return false;
        }

        // Filtr wyszukiwania
        if (state.searchQuery) {
          return ex.name.toLowerCase().includes(state.searchQuery.toLowerCase());
        }

        return true;
      })
      .sort((a, b) => {
        // Systemowe na górze, potem własne
        if (a.is_system && !b.is_system) return -1;
        if (!a.is_system && b.is_system) return 1;
        // Alfabetycznie
        return a.name.localeCompare(b.name, "pl");
      });
  }, [state.exercises, state.searchQuery, state.typeFilter]);

  /**
   * Otwieranie dialogu dodawania ćwiczenia
   */
  function openCreateDialog() {
    setState((prev) => ({
      ...prev,
      formDialog: {
        open: true,
        mode: "create",
        exercise: null,
        isSubmitting: false,
      },
    }));
  }

  /**
   * Otwieranie dialogu edycji ćwiczenia
   */
  function openEditDialog(exercise: ExerciseDTO) {
    setState((prev) => ({
      ...prev,
      formDialog: {
        open: true,
        mode: "edit",
        exercise: exercise,
        isSubmitting: false,
      },
    }));
  }

  /**
   * Otwieranie dialogu archiwizacji ćwiczenia
   */
  function openArchiveDialog(exercise: ExerciseDTO) {
    setState((prev) => ({
      ...prev,
      archiveDialog: {
        open: true,
        exercise: exercise,
        isDeleting: false,
      },
    }));
  }

  /**
   * Zamykanie wszystkich dialogów
   */
  function closeDialogs() {
    setState((prev) => ({
      ...prev,
      formDialog: {
        open: false,
        mode: "create",
        exercise: null,
        isSubmitting: false,
      },
      archiveDialog: {
        open: false,
        exercise: null,
        isDeleting: false,
      },
    }));
  }

  /**
   * Aktualizacja zapytania wyszukiwania
   */
  function updateSearchQuery(query: string) {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }

  /**
   * Aktualizacja filtra typu
   */
  function updateTypeFilter(type: ExerciseTypeFilter) {
    setState((prev) => ({ ...prev, typeFilter: type }));
  }

  /**
   * Obsługa tworzenia nowego ćwiczenia
   */
  async function handleCreateExercise(data: CreateExerciseCommand) {
    try {
      setState((prev) => ({
        ...prev,
        formDialog: { ...prev.formDialog, isSubmitting: true },
      }));

      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Nie udało się utworzyć ćwiczenia");
      }

      // Sukces - odśwież listę i zamknij dialog
      await fetchExercises();
      closeDialogs();
      toast.success("Ćwiczenie zostało dodane");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error(message);
      throw error; // Rzuć błąd dalej, aby dialog mógł go obsłużyć
    } finally {
      setState((prev) => ({
        ...prev,
        formDialog: { ...prev.formDialog, isSubmitting: false },
      }));
    }
  }

  /**
   * Obsługa edycji ćwiczenia
   */
  async function handleUpdateExercise(data: UpdateExerciseCommand) {
    if (!state.formDialog.exercise) return;

    try {
      setState((prev) => ({
        ...prev,
        formDialog: { ...prev.formDialog, isSubmitting: true },
      }));

      const response = await fetch(`/api/exercises/${state.formDialog.exercise.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Nie można edytować ćwiczenia systemowego");
          closeDialogs();
          return;
        }
        if (response.status === 404) {
          toast.error("Ćwiczenie nie zostało znalezione. Lista zostanie odświeżona.");
          await fetchExercises();
          closeDialogs();
          return;
        }
        const error = await response.json();
        throw new Error(error.message || "Nie udało się zaktualizować ćwiczenia");
      }

      // Sukces - odśwież listę i zamknij dialog
      await fetchExercises();
      closeDialogs();
      toast.success("Ćwiczenie zostało zaktualizowane");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error(message);
      throw error;
    } finally {
      setState((prev) => ({
        ...prev,
        formDialog: { ...prev.formDialog, isSubmitting: false },
      }));
    }
  }

  /**
   * Obsługa archiwizacji ćwiczenia
   */
  async function handleArchiveExercise() {
    if (!state.archiveDialog.exercise) return;

    try {
      setState((prev) => ({
        ...prev,
        archiveDialog: { ...prev.archiveDialog, isDeleting: true },
      }));

      const response = await fetch(`/api/exercises/${state.archiveDialog.exercise.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 403) {
          toast.error("Nie można zarchiwizować ćwiczenia systemowego");
          closeDialogs();
          return;
        }
        if (response.status === 404) {
          toast.error("Ćwiczenie nie zostało znalezione. Lista zostanie odświeżona.");
          await fetchExercises();
          closeDialogs();
          return;
        }
        const error = await response.json();
        throw new Error(error.message || "Nie udało się zarchiwizować ćwiczenia");
      }

      // Sukces - odśwież listę i zamknij dialog
      await fetchExercises();
      closeDialogs();
      toast.success("Ćwiczenie zostało zarchiwizowane");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nieznany błąd";
      toast.error(message);
    } finally {
      setState((prev) => ({
        ...prev,
        archiveDialog: { ...prev.archiveDialog, isDeleting: false },
      }));
    }
  }

  /**
   * Obsługa submitu formularza
   */
  async function handleFormSubmit(data: CreateExerciseCommand | UpdateExerciseCommand) {
    if (state.formDialog.mode === "create") {
      await handleCreateExercise(data as CreateExerciseCommand);
    } else {
      await handleUpdateExercise(data as UpdateExerciseCommand);
    }
  }

  // Error boundary - jeśli wystąpił błąd przy ładowaniu
  if (state.error && !state.exercises.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-lg mb-4">Nie udało się załadować listy ćwiczeń</p>
        <p className="text-muted-foreground mb-6">{state.error}</p>
        <button
          onClick={fetchExercises}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <ExerciseHeader onAddClick={openCreateDialog} />

      <div className="mt-8">
        <ExerciseFilters
          searchQuery={state.searchQuery}
          typeFilter={state.typeFilter}
          onSearchChange={updateSearchQuery}
          onTypeFilterChange={updateTypeFilter}
        />
      </div>

      <div className="mt-6">
        <ExerciseList
          exercises={filteredExercises}
          isLoading={state.isLoading}
          onEdit={openEditDialog}
          onArchive={openArchiveDialog}
        />
      </div>

      <ExerciseFormDialog
        open={state.formDialog.open}
        mode={state.formDialog.mode}
        exercise={state.formDialog.exercise ?? undefined}
        isSubmitting={state.formDialog.isSubmitting}
        onOpenChange={(open) => {
          if (!open) closeDialogs();
        }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmArchiveDialog
        open={state.archiveDialog.open}
        exercise={state.archiveDialog.exercise}
        isDeleting={state.archiveDialog.isDeleting}
        onOpenChange={(open) => {
          if (!open) closeDialogs();
        }}
        onConfirm={handleArchiveExercise}
      />
    </div>
  );
}
