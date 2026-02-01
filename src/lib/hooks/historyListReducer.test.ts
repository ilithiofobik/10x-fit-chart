/**
 * History List Reducer - Unit Tests
 * Testing state management for workout history list with pagination and filters
 *
 * @see .ai/unit-test-plan.md - Priority 1: Critical
 * @see .cursor/rules/vitest-unit-testing.mdc - Testing guidelines
 */

import { describe, it, expect, beforeEach } from "vitest";
import { historyListReducer, getInitialState } from "./historyListReducer";
import type { HistoryListState, HistoryListActionType } from "./historyListReducer";
import type { WorkoutListItemDTO, PaginationDTO, ExerciseDTO } from "../../types";

describe("historyListReducer", () => {
  // ============================================================================
  // Test Setup & Helpers
  // ============================================================================

  let initialState: HistoryListState;

  beforeEach(() => {
    initialState = getInitialState();
  });

  const createMockWorkout = (overrides?: Partial<WorkoutListItemDTO>): WorkoutListItemDTO => ({
    id: "workout-1",
    user_id: "user-1",
    date: "2026-01-20",
    notes: "Great workout!",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:30:00Z",
    exercise_count: 3,
    set_count: 9,
    ...overrides,
  });

  const createMockPagination = (overrides?: Partial<PaginationDTO>): PaginationDTO => ({
    total: 100,
    limit: 20,
    offset: 0,
    has_more: true,
    ...overrides,
  });

  const createMockExercise = (overrides?: Partial<ExerciseDTO>): ExerciseDTO => ({
    id: "ex-1",
    name: "Bench Press",
    type: "strength",
    user_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  });

  // ============================================================================
  // Initial State
  // ============================================================================

  describe("getInitialState", () => {
    it("zwraca poprawny initial state", () => {
      // Act
      const state = getInitialState();

      // Assert
      expect(state.workouts).toEqual([]);
      expect(state.pagination).toEqual({
        total: 0,
        limit: 20,
        offset: 0,
        has_more: false,
      });
      expect(state.filters).toEqual({
        start_date: null,
        end_date: null,
        exercise_id: null,
      });
      expect(state.availableExercises).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isLoadingMore).toBe(false);
      expect(state.error).toBeNull();
    });

    it("ustawia domyślny limit na 20", () => {
      // Act
      const state = getInitialState();

      // Assert
      expect(state.pagination.limit).toBe(20);
    });
  });

  // ============================================================================
  // LOAD_WORKOUTS_START Action
  // ============================================================================

  describe("LOAD_WORKOUTS_START", () => {
    it("ustawia isLoading na true", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_START",
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.isLoading).toBe(true);
    });

    it("czyści error", () => {
      // Arrange
      const stateWithError: HistoryListState = {
        ...initialState,
        error: "Previous error",
      };
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_START",
      };

      // Act
      const newState = historyListReducer(stateWithError, action);

      // Assert
      expect(newState.error).toBeNull();
    });

    it("zachowuje pozostałe pola state", () => {
      // Arrange
      const workouts = [createMockWorkout()];
      const stateWithData: HistoryListState = {
        ...initialState,
        workouts,
      };
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_START",
      };

      // Act
      const newState = historyListReducer(stateWithData, action);

      // Assert
      expect(newState.workouts).toEqual(workouts);
    });

    it("nie mutuje oryginalnego state", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_START",
      };

      // Act
      historyListReducer(initialState, action);

      // Assert
      expect(initialState.isLoading).toBe(false);
    });
  });

  // ============================================================================
  // LOAD_WORKOUTS_SUCCESS Action
  // ============================================================================

  describe("LOAD_WORKOUTS_SUCCESS", () => {
    it("ładuje workouts i pagination", () => {
      // Arrange
      const workouts = [
        createMockWorkout({ id: "workout-1", date: "2026-01-20" }),
        createMockWorkout({ id: "workout-2", date: "2026-01-19" }),
      ];
      const pagination = createMockPagination({ total: 50, offset: 0 });
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: { workouts, pagination },
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.workouts).toEqual(workouts);
      expect(newState.pagination).toEqual(pagination);
    });

    it("ustawia isLoading na false", () => {
      // Arrange
      const stateWithLoading: HistoryListState = {
        ...initialState,
        isLoading: true,
      };
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: {
          workouts: [],
          pagination: createMockPagination(),
        },
      };

      // Act
      const newState = historyListReducer(stateWithLoading, action);

      // Assert
      expect(newState.isLoading).toBe(false);
    });

    it("czyści error", () => {
      // Arrange
      const stateWithError: HistoryListState = {
        ...initialState,
        error: "Previous error",
      };
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: {
          workouts: [],
          pagination: createMockPagination(),
        },
      };

      // Act
      const newState = historyListReducer(stateWithError, action);

      // Assert
      expect(newState.error).toBeNull();
    });

    it("zastępuje istniejące workouts (nie appenduje)", () => {
      // Arrange
      const existingWorkouts = [createMockWorkout({ id: "old-workout" })];
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts: existingWorkouts,
      };
      const newWorkouts = [createMockWorkout({ id: "new-workout" })];
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: {
          workouts: newWorkouts,
          pagination: createMockPagination(),
        },
      };

      // Act
      const newState = historyListReducer(stateWithWorkouts, action);

      // Assert
      expect(newState.workouts).toHaveLength(1);
      expect(newState.workouts[0].id).toBe("new-workout");
    });

    it("obsługuje pustą listę workouts", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: {
          workouts: [],
          pagination: createMockPagination({ total: 0, has_more: false }),
        },
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.workouts).toEqual([]);
      expect(newState.pagination.total).toBe(0);
      expect(newState.pagination.has_more).toBe(false);
    });

    it("zachowuje filters podczas ładowania", () => {
      // Arrange
      const stateWithFilters: HistoryListState = {
        ...initialState,
        filters: {
          start_date: "2026-01-01",
          end_date: "2026-01-31",
          exercise_id: "ex-1",
        },
      };
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: {
          workouts: [],
          pagination: createMockPagination(),
        },
      };

      // Act
      const newState = historyListReducer(stateWithFilters, action);

      // Assert
      expect(newState.filters).toEqual({
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        exercise_id: "ex-1",
      });
    });

    it("nie mutuje payload workouts", () => {
      // Arrange
      const workouts = [createMockWorkout()];
      const originalWorkouts = [...workouts];
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: {
          workouts,
          pagination: createMockPagination(),
        },
      };

      // Act
      historyListReducer(initialState, action);

      // Assert
      expect(workouts).toEqual(originalWorkouts);
    });
  });

  // ============================================================================
  // LOAD_MORE_START Action
  // ============================================================================

  describe("LOAD_MORE_START", () => {
    it("ustawia isLoadingMore na true", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "LOAD_MORE_START",
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.isLoadingMore).toBe(true);
    });

    it("czyści error", () => {
      // Arrange
      const stateWithError: HistoryListState = {
        ...initialState,
        error: "Previous error",
      };
      const action: HistoryListActionType = {
        type: "LOAD_MORE_START",
      };

      // Act
      const newState = historyListReducer(stateWithError, action);

      // Assert
      expect(newState.error).toBeNull();
    });

    it("nie zmienia isLoading", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "LOAD_MORE_START",
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.isLoading).toBe(false);
    });

    it("zachowuje istniejące workouts", () => {
      // Arrange
      const workouts = [createMockWorkout()];
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts,
      };
      const action: HistoryListActionType = {
        type: "LOAD_MORE_START",
      };

      // Act
      const newState = historyListReducer(stateWithWorkouts, action);

      // Assert
      expect(newState.workouts).toEqual(workouts);
    });
  });

  // ============================================================================
  // LOAD_MORE_SUCCESS Action
  // ============================================================================

  describe("LOAD_MORE_SUCCESS", () => {
    it("appenduje nowe workouts do istniejących", () => {
      // Arrange
      const existingWorkouts = [
        createMockWorkout({ id: "workout-1", date: "2026-01-20" }),
        createMockWorkout({ id: "workout-2", date: "2026-01-19" }),
      ];
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts: existingWorkouts,
        pagination: createMockPagination({ offset: 0 }),
      };
      const newWorkouts = [
        createMockWorkout({ id: "workout-3", date: "2026-01-18" }),
        createMockWorkout({ id: "workout-4", date: "2026-01-17" }),
      ];
      const action: HistoryListActionType = {
        type: "LOAD_MORE_SUCCESS",
        payload: {
          workouts: newWorkouts,
          pagination: createMockPagination({ offset: 20 }),
        },
      };

      // Act
      const newState = historyListReducer(stateWithWorkouts, action);

      // Assert
      expect(newState.workouts).toHaveLength(4);
      expect(newState.workouts[0].id).toBe("workout-1");
      expect(newState.workouts[1].id).toBe("workout-2");
      expect(newState.workouts[2].id).toBe("workout-3");
      expect(newState.workouts[3].id).toBe("workout-4");
    });

    it("aktualizuje pagination", () => {
      // Arrange
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts: [createMockWorkout()],
        pagination: createMockPagination({ offset: 0, has_more: true }),
      };
      const newPagination = createMockPagination({ offset: 20, has_more: false });
      const action: HistoryListActionType = {
        type: "LOAD_MORE_SUCCESS",
        payload: {
          workouts: [createMockWorkout()],
          pagination: newPagination,
        },
      };

      // Act
      const newState = historyListReducer(stateWithWorkouts, action);

      // Assert
      expect(newState.pagination).toEqual(newPagination);
    });

    it("ustawia isLoadingMore na false", () => {
      // Arrange
      const stateWithLoading: HistoryListState = {
        ...initialState,
        isLoadingMore: true,
      };
      const action: HistoryListActionType = {
        type: "LOAD_MORE_SUCCESS",
        payload: {
          workouts: [],
          pagination: createMockPagination(),
        },
      };

      // Act
      const newState = historyListReducer(stateWithLoading, action);

      // Assert
      expect(newState.isLoadingMore).toBe(false);
    });

    it("czyści error", () => {
      // Arrange
      const stateWithError: HistoryListState = {
        ...initialState,
        error: "Previous error",
      };
      const action: HistoryListActionType = {
        type: "LOAD_MORE_SUCCESS",
        payload: {
          workouts: [],
          pagination: createMockPagination(),
        },
      };

      // Act
      const newState = historyListReducer(stateWithError, action);

      // Assert
      expect(newState.error).toBeNull();
    });

    it("obsługuje pustą listę nowych workouts", () => {
      // Arrange
      const existingWorkouts = [createMockWorkout({ id: "workout-1" })];
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts: existingWorkouts,
      };
      const action: HistoryListActionType = {
        type: "LOAD_MORE_SUCCESS",
        payload: {
          workouts: [],
          pagination: createMockPagination({ has_more: false }),
        },
      };

      // Act
      const newState = historyListReducer(stateWithWorkouts, action);

      // Assert
      expect(newState.workouts).toHaveLength(1);
      expect(newState.workouts[0].id).toBe("workout-1");
    });

    it("nie mutuje istniejącej tablicy workouts", () => {
      // Arrange
      const existingWorkouts = [createMockWorkout()];
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts: existingWorkouts,
      };
      const originalWorkouts = stateWithWorkouts.workouts;
      const action: HistoryListActionType = {
        type: "LOAD_MORE_SUCCESS",
        payload: {
          workouts: [createMockWorkout({ id: "new-workout" })],
          pagination: createMockPagination(),
        },
      };

      // Act
      historyListReducer(stateWithWorkouts, action);

      // Assert
      expect(stateWithWorkouts.workouts).toBe(originalWorkouts);
    });
  });

  // ============================================================================
  // LOAD_WORKOUTS_ERROR Action
  // ============================================================================

  describe("LOAD_WORKOUTS_ERROR", () => {
    it("ustawia error message", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_ERROR",
        payload: "Failed to load workouts",
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.error).toBe("Failed to load workouts");
    });

    it("ustawia isLoading na false", () => {
      // Arrange
      const stateWithLoading: HistoryListState = {
        ...initialState,
        isLoading: true,
      };
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_ERROR",
        payload: "Error",
      };

      // Act
      const newState = historyListReducer(stateWithLoading, action);

      // Assert
      expect(newState.isLoading).toBe(false);
    });

    it("ustawia isLoadingMore na false", () => {
      // Arrange
      const stateWithLoading: HistoryListState = {
        ...initialState,
        isLoadingMore: true,
      };
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_ERROR",
        payload: "Error",
      };

      // Act
      const newState = historyListReducer(stateWithLoading, action);

      // Assert
      expect(newState.isLoadingMore).toBe(false);
    });

    it("zachowuje istniejące workouts", () => {
      // Arrange
      const workouts = [createMockWorkout()];
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts,
      };
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_ERROR",
        payload: "Error",
      };

      // Act
      const newState = historyListReducer(stateWithWorkouts, action);

      // Assert
      expect(newState.workouts).toEqual(workouts);
    });

    it("obsługuje puste error message", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "LOAD_WORKOUTS_ERROR",
        payload: "",
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.error).toBe("");
    });
  });

  // ============================================================================
  // SET_FILTERS Action
  // ============================================================================

  describe("SET_FILTERS", () => {
    it("ustawia nowe filters", () => {
      // Arrange
      const filters = {
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        exercise_id: "ex-1",
      };
      const action: HistoryListActionType = {
        type: "SET_FILTERS",
        payload: filters,
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.filters).toEqual(filters);
    });

    it("resetuje offset do 0 przy zmianie filters", () => {
      // Arrange
      const stateWithOffset: HistoryListState = {
        ...initialState,
        pagination: {
          ...initialState.pagination,
          offset: 40,
        },
      };
      const action: HistoryListActionType = {
        type: "SET_FILTERS",
        payload: {
          start_date: "2026-01-01",
          end_date: null,
          exercise_id: null,
        },
      };

      // Act
      const newState = historyListReducer(stateWithOffset, action);

      // Assert
      expect(newState.pagination.offset).toBe(0);
    });

    it("zachowuje pozostałe pola pagination", () => {
      // Arrange
      const stateWithPagination: HistoryListState = {
        ...initialState,
        pagination: {
          total: 100,
          limit: 20,
          offset: 40,
          has_more: true,
        },
      };
      const action: HistoryListActionType = {
        type: "SET_FILTERS",
        payload: {
          start_date: "2026-01-01",
          end_date: null,
          exercise_id: null,
        },
      };

      // Act
      const newState = historyListReducer(stateWithPagination, action);

      // Assert
      expect(newState.pagination.total).toBe(100);
      expect(newState.pagination.limit).toBe(20);
      expect(newState.pagination.has_more).toBe(true);
    });

    it("obsługuje partial filters (tylko start_date)", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "SET_FILTERS",
        payload: {
          start_date: "2026-01-01",
          end_date: null,
          exercise_id: null,
        },
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.filters.start_date).toBe("2026-01-01");
      expect(newState.filters.end_date).toBeNull();
      expect(newState.filters.exercise_id).toBeNull();
    });

    it("obsługuje partial filters (tylko exercise_id)", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "SET_FILTERS",
        payload: {
          start_date: null,
          end_date: null,
          exercise_id: "ex-1",
        },
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.filters.exercise_id).toBe("ex-1");
      expect(newState.filters.start_date).toBeNull();
      expect(newState.filters.end_date).toBeNull();
    });

    it("zastępuje poprzednie filters (nie merguje)", () => {
      // Arrange
      const stateWithFilters: HistoryListState = {
        ...initialState,
        filters: {
          start_date: "2025-01-01",
          end_date: "2025-12-31",
          exercise_id: "ex-old",
        },
      };
      const action: HistoryListActionType = {
        type: "SET_FILTERS",
        payload: {
          start_date: "2026-01-01",
          end_date: null,
          exercise_id: null,
        },
      };

      // Act
      const newState = historyListReducer(stateWithFilters, action);

      // Assert
      expect(newState.filters.start_date).toBe("2026-01-01");
      expect(newState.filters.end_date).toBeNull();
      expect(newState.filters.exercise_id).toBeNull();
    });

    it("zachowuje workouts (nie czyści)", () => {
      // Arrange
      const workouts = [createMockWorkout()];
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts,
      };
      const action: HistoryListActionType = {
        type: "SET_FILTERS",
        payload: {
          start_date: "2026-01-01",
          end_date: null,
          exercise_id: null,
        },
      };

      // Act
      const newState = historyListReducer(stateWithWorkouts, action);

      // Assert
      expect(newState.workouts).toEqual(workouts);
    });
  });

  // ============================================================================
  // RESET_FILTERS Action
  // ============================================================================

  describe("RESET_FILTERS", () => {
    it("resetuje filters do initial state", () => {
      // Arrange
      const stateWithFilters: HistoryListState = {
        ...initialState,
        filters: {
          start_date: "2026-01-01",
          end_date: "2026-01-31",
          exercise_id: "ex-1",
        },
      };
      const action: HistoryListActionType = {
        type: "RESET_FILTERS",
      };

      // Act
      const newState = historyListReducer(stateWithFilters, action);

      // Assert
      expect(newState.filters).toEqual({
        start_date: null,
        end_date: null,
        exercise_id: null,
      });
    });

    it("resetuje offset do 0", () => {
      // Arrange
      const stateWithOffset: HistoryListState = {
        ...initialState,
        pagination: {
          ...initialState.pagination,
          offset: 60,
        },
      };
      const action: HistoryListActionType = {
        type: "RESET_FILTERS",
      };

      // Act
      const newState = historyListReducer(stateWithOffset, action);

      // Assert
      expect(newState.pagination.offset).toBe(0);
    });

    it("zachowuje pozostałe pola pagination", () => {
      // Arrange
      const stateWithPagination: HistoryListState = {
        ...initialState,
        pagination: {
          total: 100,
          limit: 20,
          offset: 60,
          has_more: true,
        },
      };
      const action: HistoryListActionType = {
        type: "RESET_FILTERS",
      };

      // Act
      const newState = historyListReducer(stateWithPagination, action);

      // Assert
      expect(newState.pagination.total).toBe(100);
      expect(newState.pagination.limit).toBe(20);
      expect(newState.pagination.has_more).toBe(true);
    });

    it("zachowuje workouts", () => {
      // Arrange
      const workouts = [createMockWorkout()];
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts,
        filters: {
          start_date: "2026-01-01",
          end_date: null,
          exercise_id: null,
        },
      };
      const action: HistoryListActionType = {
        type: "RESET_FILTERS",
      };

      // Act
      const newState = historyListReducer(stateWithWorkouts, action);

      // Assert
      expect(newState.workouts).toEqual(workouts);
    });

    it("działa poprawnie gdy filters już są puste", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "RESET_FILTERS",
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.filters).toEqual({
        start_date: null,
        end_date: null,
        exercise_id: null,
      });
    });
  });

  // ============================================================================
  // SET_AVAILABLE_EXERCISES Action
  // ============================================================================

  describe("SET_AVAILABLE_EXERCISES", () => {
    it("ustawia listę dostępnych ćwiczeń", () => {
      // Arrange
      const exercises = [
        createMockExercise({ id: "ex-1", name: "Bench Press" }),
        createMockExercise({ id: "ex-2", name: "Squat" }),
      ];
      const action: HistoryListActionType = {
        type: "SET_AVAILABLE_EXERCISES",
        payload: exercises,
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.availableExercises).toEqual(exercises);
    });

    it("zastępuje poprzednią listę ćwiczeń", () => {
      // Arrange
      const oldExercises = [createMockExercise({ id: "ex-old" })];
      const stateWithExercises: HistoryListState = {
        ...initialState,
        availableExercises: oldExercises,
      };
      const newExercises = [createMockExercise({ id: "ex-new" })];
      const action: HistoryListActionType = {
        type: "SET_AVAILABLE_EXERCISES",
        payload: newExercises,
      };

      // Act
      const newState = historyListReducer(stateWithExercises, action);

      // Assert
      expect(newState.availableExercises).toHaveLength(1);
      expect(newState.availableExercises[0].id).toBe("ex-new");
    });

    it("obsługuje pustą listę ćwiczeń", () => {
      // Arrange
      const action: HistoryListActionType = {
        type: "SET_AVAILABLE_EXERCISES",
        payload: [],
      };

      // Act
      const newState = historyListReducer(initialState, action);

      // Assert
      expect(newState.availableExercises).toEqual([]);
    });

    it("zachowuje pozostałe pola state", () => {
      // Arrange
      const workouts = [createMockWorkout()];
      const stateWithData: HistoryListState = {
        ...initialState,
        workouts,
      };
      const exercises = [createMockExercise()];
      const action: HistoryListActionType = {
        type: "SET_AVAILABLE_EXERCISES",
        payload: exercises,
      };

      // Act
      const newState = historyListReducer(stateWithData, action);

      // Assert
      expect(newState.workouts).toEqual(workouts);
    });

    it("nie mutuje payload exercises", () => {
      // Arrange
      const exercises = [createMockExercise()];
      const originalExercises = [...exercises];
      const action: HistoryListActionType = {
        type: "SET_AVAILABLE_EXERCISES",
        payload: exercises,
      };

      // Act
      historyListReducer(initialState, action);

      // Assert
      expect(exercises).toEqual(originalExercises);
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================

  describe("immutability", () => {
    it("nie mutuje oryginalnego state przy żadnej akcji", () => {
      // Arrange
      const originalState = { ...initialState };

      // Act - Execute multiple actions
      historyListReducer(initialState, { type: "LOAD_WORKOUTS_START" });
      historyListReducer(initialState, {
        type: "SET_FILTERS",
        payload: { start_date: "2026-01-01", end_date: null, exercise_id: null },
      });
      historyListReducer(initialState, { type: "RESET_FILTERS" });

      // Assert
      expect(initialState).toEqual(originalState);
    });

    it("zwraca nowy obiekt przy każdej akcji", () => {
      // Act
      const state1 = historyListReducer(initialState, { type: "LOAD_WORKOUTS_START" });
      const state2 = historyListReducer(state1, {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: { workouts: [], pagination: createMockPagination() },
      });
      const state3 = historyListReducer(state2, { type: "LOAD_MORE_START" });

      // Assert
      expect(state1).not.toBe(initialState);
      expect(state2).not.toBe(state1);
      expect(state3).not.toBe(state2);
    });

    it("nie mutuje zagnieżdżonej tablicy workouts", () => {
      // Arrange
      const workouts = [createMockWorkout()];
      const stateWithWorkouts: HistoryListState = {
        ...initialState,
        workouts,
      };
      const originalWorkouts = stateWithWorkouts.workouts;

      // Act
      const newState = historyListReducer(stateWithWorkouts, {
        type: "LOAD_MORE_SUCCESS",
        payload: {
          workouts: [createMockWorkout({ id: "new-workout" })],
          pagination: createMockPagination(),
        },
      });

      // Assert
      expect(stateWithWorkouts.workouts).toBe(originalWorkouts);
      expect(newState.workouts).not.toBe(originalWorkouts);
    });

    it("nie mutuje zagnieżdżonego obiektu filters", () => {
      // Arrange
      const originalFilters = initialState.filters;

      // Act
      historyListReducer(initialState, {
        type: "SET_FILTERS",
        payload: { start_date: "2026-01-01", end_date: null, exercise_id: null },
      });

      // Assert
      expect(initialState.filters).toBe(originalFilters);
    });

    it("nie mutuje zagnieżdżonego obiektu pagination", () => {
      // Arrange
      const originalPagination = initialState.pagination;

      // Act
      historyListReducer(initialState, {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: {
          workouts: [],
          pagination: createMockPagination({ offset: 20 }),
        },
      });

      // Assert
      expect(initialState.pagination).toBe(originalPagination);
    });
  });

  // ============================================================================
  // Integration Scenarios
  // ============================================================================

  describe("integration scenarios", () => {
    it("kompletny flow: load -> load more -> error", () => {
      // Arrange & Act
      let state = initialState;

      // 1. Start loading
      state = historyListReducer(state, { type: "LOAD_WORKOUTS_START" });
      expect(state.isLoading).toBe(true);

      // 2. Load success with first page
      state = historyListReducer(state, {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: {
          workouts: [createMockWorkout({ id: "workout-1" })],
          pagination: createMockPagination({ offset: 0, has_more: true }),
        },
      });
      expect(state.workouts).toHaveLength(1);
      expect(state.isLoading).toBe(false);

      // 3. Load more
      state = historyListReducer(state, { type: "LOAD_MORE_START" });
      expect(state.isLoadingMore).toBe(true);

      // 4. Load more error
      state = historyListReducer(state, {
        type: "LOAD_WORKOUTS_ERROR",
        payload: "Network error",
      });
      expect(state.isLoadingMore).toBe(false);
      expect(state.error).toBe("Network error");
      expect(state.workouts).toHaveLength(1); // Preserved
    });

    it("kompletny flow: load -> filters -> reset filters", () => {
      // Arrange & Act
      let state = initialState;

      // 1. Load workouts
      state = historyListReducer(state, {
        type: "LOAD_WORKOUTS_SUCCESS",
        payload: {
          workouts: [createMockWorkout()],
          pagination: createMockPagination(),
        },
      });

      // 2. Apply filters
      state = historyListReducer(state, {
        type: "SET_FILTERS",
        payload: {
          start_date: "2026-01-01",
          end_date: "2026-01-31",
          exercise_id: "ex-1",
        },
      });
      expect(state.filters.start_date).toBe("2026-01-01");
      expect(state.pagination.offset).toBe(0);

      // 3. Reset filters
      state = historyListReducer(state, { type: "RESET_FILTERS" });
      expect(state.filters.start_date).toBeNull();
      expect(state.pagination.offset).toBe(0);
    });
  });
});
