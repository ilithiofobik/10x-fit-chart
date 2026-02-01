/**
 * Workout Editor Reducer - Unit Tests
 * Testing editor-specific reducer functions with extension of workoutLoggerReducer
 *
 * @see .ai/unit-test-plan.md - Priority 1: Critical
 * @see .cursor/rules/vitest-unit-testing.mdc - Testing guidelines
 */

import { describe, it, expect, beforeEach } from "vitest";
import { workoutEditorReducer, getInitialState } from "./workoutEditorReducer";
import type { WorkoutEditorState, WorkoutEditorActionType } from "./workoutEditorReducer";
import type { WorkoutDetailsDTO } from "../../types";

describe("workoutEditorReducer", () => {
  // ============================================================================
  // Test Setup & Helpers
  // ============================================================================

  let initialState: WorkoutEditorState;

  beforeEach(() => {
    initialState = getInitialState();
  });

  const createMockWorkout = (): WorkoutDetailsDTO => ({
    id: "workout-123",
    user_id: "user-1",
    date: "2026-01-20",
    notes: "Great workout!",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:30:00Z",
    sets: [
      {
        id: "set-1",
        workout_id: "workout-123",
        exercise_id: "ex-1",
        exercise_name: "Bench Press",
        exercise_type: "strength",
        sort_order: 0,
        weight: 100,
        reps: 8,
        distance: null,
        time: null,
        calculated_1rm: 124.16,
        calculated_volume: 800,
        created_at: "2026-01-20T10:00:00Z",
        updated_at: "2026-01-20T10:00:00Z",
      },
      {
        id: "set-2",
        workout_id: "workout-123",
        exercise_id: "ex-1",
        exercise_name: "Bench Press",
        exercise_type: "strength",
        sort_order: 1,
        weight: 100,
        reps: 7,
        distance: null,
        time: null,
        calculated_1rm: 120.02,
        calculated_volume: 700,
        created_at: "2026-01-20T10:00:00Z",
        updated_at: "2026-01-20T10:00:00Z",
      },
      {
        id: "set-3",
        workout_id: "workout-123",
        exercise_id: "ex-2",
        exercise_name: "Squat",
        exercise_type: "strength",
        sort_order: 2,
        weight: 120,
        reps: 5,
        distance: null,
        time: null,
        calculated_1rm: 135.0,
        calculated_volume: 600,
        created_at: "2026-01-20T10:00:00Z",
        updated_at: "2026-01-20T10:00:00Z",
      },
    ],
  });

  const createMockCardioWorkout = (): WorkoutDetailsDTO => ({
    id: "workout-456",
    user_id: "user-1",
    date: "2026-01-21",
    notes: null,
    created_at: "2026-01-21T08:00:00Z",
    updated_at: "2026-01-21T08:30:00Z",
    sets: [
      {
        id: "set-4",
        workout_id: "workout-456",
        exercise_id: "ex-cardio-1",
        exercise_name: "Running",
        exercise_type: "cardio",
        sort_order: 0,
        weight: null,
        reps: null,
        distance: 5.5,
        time: 1800,
        calculated_1rm: null,
        calculated_volume: null,
        created_at: "2026-01-21T08:00:00Z",
        updated_at: "2026-01-21T08:00:00Z",
      },
    ],
  });

  // ============================================================================
  // Initial State
  // ============================================================================

  describe("getInitialState", () => {
    it("rozszerza workoutLoggerReducer initialState", () => {
      // Act
      const state = getInitialState();

      // Assert - Standard logger fields
      expect(state.date).toBeDefined();
      expect(state.notes).toBeNull();
      expect(state.exercises).toEqual([]);
      expect(state.availableExercises).toEqual([]);
      expect(state.isLoadingExercises).toBe(false);
      expect(state.isSaving).toBe(false);
    });

    it("dodaje editor-specific fields", () => {
      // Act
      const state = getInitialState();

      // Assert - Editor-specific fields
      expect(state.workoutId).toBeNull();
      expect(state.originalDate).toBeNull();
      expect(state.createdAt).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isDeleting).toBe(false);
    });
  });

  // ============================================================================
  // LOAD_WORKOUT_START Action
  // ============================================================================

  describe("LOAD_WORKOUT_START", () => {
    it("ustawia isLoading na true", () => {
      // Arrange
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_START",
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.isLoading).toBe(true);
    });

    it("zachowuje pozostałe pola state", () => {
      // Arrange
      const stateWithData: WorkoutEditorState = {
        ...initialState,
        notes: "Test notes",
        workoutId: "workout-123",
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_START",
      };

      // Act
      const newState = workoutEditorReducer(stateWithData, action);

      // Assert
      expect(newState.notes).toBe("Test notes");
      expect(newState.workoutId).toBe("workout-123");
    });

    it("nie mutuje oryginalnego state", () => {
      // Arrange
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_START",
      };

      // Act
      workoutEditorReducer(initialState, action);

      // Assert
      expect(initialState.isLoading).toBe(false);
    });
  });

  // ============================================================================
  // LOAD_WORKOUT_SUCCESS Action
  // ============================================================================

  describe("LOAD_WORKOUT_SUCCESS", () => {
    it("ładuje pełne dane workout do edycji", () => {
      // Arrange
      const workout = createMockWorkout();
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.workoutId).toBe("workout-123");
      expect(newState.date).toBe("2026-01-20");
      expect(newState.notes).toBe("Great workout!");
      expect(newState.createdAt).toBe("2026-01-20T10:00:00Z");
      expect(newState.isLoading).toBe(false);
    });

    it("zachowuje original_date dla porównania zmian", () => {
      // Arrange
      const workout = createMockWorkout();
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.originalDate).toBe("2026-01-20");
      expect(newState.originalDate).toBe(newState.date);
    });

    it("mapuje WorkoutSetDTO na local format (exercises)", () => {
      // Arrange
      const workout = createMockWorkout();
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.exercises).toHaveLength(2);

      // First exercise (Bench Press with 2 sets)
      expect(newState.exercises[0].exercise_id).toBe("ex-1");
      expect(newState.exercises[0].exercise_name).toBe("Bench Press");
      expect(newState.exercises[0].exercise_type).toBe("strength");
      expect(newState.exercises[0].sets).toHaveLength(2);
      expect(newState.exercises[0].sets[0]).toEqual({
        weight: 100,
        reps: 8,
        distance: null,
        time: null,
      });
      expect(newState.exercises[0].sets[1]).toEqual({
        weight: 100,
        reps: 7,
        distance: null,
        time: null,
      });

      // Second exercise (Squat with 1 set)
      expect(newState.exercises[1].exercise_id).toBe("ex-2");
      expect(newState.exercises[1].exercise_name).toBe("Squat");
      expect(newState.exercises[1].exercise_type).toBe("strength");
      expect(newState.exercises[1].sets).toHaveLength(1);
      expect(newState.exercises[1].sets[0]).toEqual({
        weight: 120,
        reps: 5,
        distance: null,
        time: null,
      });
    });

    it("generuje temporary IDs dla exercises (UI requirement)", () => {
      // Arrange
      const workout = createMockWorkout();
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.exercises[0].id).toMatch(/^temp_/);
      expect(newState.exercises[1].id).toMatch(/^temp_/);
      expect(newState.exercises[0].id).not.toBe(newState.exercises[1].id);
    });

    it("obsługuje workout bez notes", () => {
      // Arrange
      const workout: WorkoutDetailsDTO = {
        ...createMockWorkout(),
        notes: null,
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.notes).toBeNull();
    });

    it("obsługuje workout z jednym ćwiczeniem", () => {
      // Arrange
      const workout: WorkoutDetailsDTO = {
        ...createMockWorkout(),
        sets: [createMockWorkout().sets[0]],
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.exercises).toHaveLength(1);
      expect(newState.exercises[0].sets).toHaveLength(1);
    });

    it("obsługuje workout cardio z distance i time", () => {
      // Arrange
      const workout = createMockCardioWorkout();
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.exercises).toHaveLength(1);
      expect(newState.exercises[0].exercise_type).toBe("cardio");
      expect(newState.exercises[0].sets[0].distance).toBe(5.5);
      expect(newState.exercises[0].sets[0].time).toBe(1800);
      expect(newState.exercises[0].sets[0].weight).toBeNull();
      expect(newState.exercises[0].sets[0].reps).toBeNull();
    });

    it("grupuje sets według exercise_id", () => {
      // Arrange
      const workout: WorkoutDetailsDTO = {
        ...createMockWorkout(),
        sets: [
          {
            id: "set-1",
            workout_id: "workout-123",
            exercise_id: "ex-1",
            exercise_name: "Bench Press",
            exercise_type: "strength",
            sort_order: 0,
            weight: 100,
            reps: 10,
            distance: null,
            time: null,
            calculated_1rm: 133.4,
            calculated_volume: 1000,
            created_at: "2026-01-20T10:00:00Z",
            updated_at: "2026-01-20T10:00:00Z",
          },
          {
            id: "set-2",
            workout_id: "workout-123",
            exercise_id: "ex-1",
            exercise_name: "Bench Press",
            exercise_type: "strength",
            sort_order: 1,
            weight: 100,
            reps: 9,
            distance: null,
            time: null,
            calculated_1rm: 129.1,
            calculated_volume: 900,
            created_at: "2026-01-20T10:00:00Z",
            updated_at: "2026-01-20T10:00:00Z",
          },
          {
            id: "set-3",
            workout_id: "workout-123",
            exercise_id: "ex-1",
            exercise_name: "Bench Press",
            exercise_type: "strength",
            sort_order: 2,
            weight: 100,
            reps: 8,
            distance: null,
            time: null,
            calculated_1rm: 124.16,
            calculated_volume: 800,
            created_at: "2026-01-20T10:00:00Z",
            updated_at: "2026-01-20T10:00:00Z",
          },
        ],
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.exercises).toHaveLength(1);
      expect(newState.exercises[0].sets).toHaveLength(3);
      expect(newState.exercises[0].sets[0].reps).toBe(10);
      expect(newState.exercises[0].sets[1].reps).toBe(9);
      expect(newState.exercises[0].sets[2].reps).toBe(8);
    });

    it("nie mutuje oryginalnego workout payload", () => {
      // Arrange
      const workout = createMockWorkout();
      const originalSets = [...workout.sets];
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      workoutEditorReducer(initialState, action);

      // Assert
      expect(workout.sets).toEqual(originalSets);
    });

    it("zastępuje istniejące exercises", () => {
      // Arrange
      const stateWithExercises: WorkoutEditorState = {
        ...initialState,
        exercises: [
          {
            id: "temp_old_1",
            exercise_id: "ex-old",
            exercise_name: "Old Exercise",
            exercise_type: "strength",
            sets: [{ weight: 50, reps: 10, distance: null, time: null }],
          },
        ],
      };
      const workout = createMockWorkout();
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(stateWithExercises, action);

      // Assert
      expect(newState.exercises).toHaveLength(2);
      expect(newState.exercises[0].exercise_name).toBe("Bench Press");
      expect(newState.exercises[0].exercise_name).not.toBe("Old Exercise");
    });
  });

  // ============================================================================
  // LOAD_WORKOUT_ERROR Action
  // ============================================================================

  describe("LOAD_WORKOUT_ERROR", () => {
    it("ustawia isLoading na false", () => {
      // Arrange
      const stateWithLoading: WorkoutEditorState = {
        ...initialState,
        isLoading: true,
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_ERROR",
        payload: "Failed to load workout",
      };

      // Act
      const newState = workoutEditorReducer(stateWithLoading, action);

      // Assert
      expect(newState.isLoading).toBe(false);
    });

    it("zachowuje pozostałe pola state", () => {
      // Arrange
      const stateWithData: WorkoutEditorState = {
        ...initialState,
        workoutId: "workout-123",
        date: "2026-01-20",
        isLoading: true,
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_ERROR",
        payload: "Error message",
      };

      // Act
      const newState = workoutEditorReducer(stateWithData, action);

      // Assert
      expect(newState.workoutId).toBe("workout-123");
      expect(newState.date).toBe("2026-01-20");
    });

    it("nie mutuje oryginalnego state", () => {
      // Arrange
      const stateWithLoading: WorkoutEditorState = {
        ...initialState,
        isLoading: true,
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_ERROR",
        payload: "Error",
      };

      // Act
      workoutEditorReducer(stateWithLoading, action);

      // Assert
      expect(stateWithLoading.isLoading).toBe(true);
    });
  });

  // ============================================================================
  // SET_DELETING Action
  // ============================================================================

  describe("SET_DELETING", () => {
    it("ustawia isDeleting na true", () => {
      // Arrange
      const action: WorkoutEditorActionType = {
        type: "SET_DELETING",
        payload: true,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.isDeleting).toBe(true);
    });

    it("ustawia isDeleting na false", () => {
      // Arrange
      const stateWithDeleting: WorkoutEditorState = {
        ...initialState,
        isDeleting: true,
      };
      const action: WorkoutEditorActionType = {
        type: "SET_DELETING",
        payload: false,
      };

      // Act
      const newState = workoutEditorReducer(stateWithDeleting, action);

      // Assert
      expect(newState.isDeleting).toBe(false);
    });

    it("zachowuje pozostałe pola state", () => {
      // Arrange
      const stateWithData: WorkoutEditorState = {
        ...initialState,
        workoutId: "workout-123",
        notes: "Test notes",
      };
      const action: WorkoutEditorActionType = {
        type: "SET_DELETING",
        payload: true,
      };

      // Act
      const newState = workoutEditorReducer(stateWithData, action);

      // Assert
      expect(newState.workoutId).toBe("workout-123");
      expect(newState.notes).toBe("Test notes");
    });
  });

  // ============================================================================
  // Delegation to workoutLoggerReducer
  // ============================================================================

  describe("delegation to workoutLoggerReducer", () => {
    it("deleguje SET_DATE do workoutLoggerReducer", () => {
      // Arrange
      const workout = createMockWorkout();
      const state = workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });

      const action: WorkoutEditorActionType = {
        type: "SET_DATE",
        payload: "2026-02-15",
      };

      // Act
      const newState = workoutEditorReducer(state, action);

      // Assert
      expect(newState.date).toBe("2026-02-15");
      expect(newState.originalDate).toBe("2026-01-20"); // Preserved
    });

    it("deleguje SET_NOTES do workoutLoggerReducer", () => {
      // Arrange
      const workout = createMockWorkout();
      const state = workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });

      const action: WorkoutEditorActionType = {
        type: "SET_NOTES",
        payload: "Updated notes",
      };

      // Act
      const newState = workoutEditorReducer(state, action);

      // Assert
      expect(newState.notes).toBe("Updated notes");
      expect(newState.workoutId).toBe("workout-123"); // Preserved
    });

    it("deleguje ADD_EXERCISE do workoutLoggerReducer", () => {
      // Arrange
      const workout = createMockWorkout();
      const state = workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });

      const newExercise = {
        id: "ex-new",
        name: "Deadlift",
        type: "strength" as const,
        user_id: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      };

      const action: WorkoutEditorActionType = {
        type: "ADD_EXERCISE",
        payload: newExercise,
      };

      // Act
      const newState = workoutEditorReducer(state, action);

      // Assert
      expect(newState.exercises).toHaveLength(3);
      expect(newState.exercises[2].exercise_name).toBe("Deadlift");
      expect(newState.workoutId).toBe("workout-123"); // Preserved
      expect(newState.originalDate).toBe("2026-01-20"); // Preserved
    });

    it("deleguje UPDATE_SET do workoutLoggerReducer", () => {
      // Arrange
      const workout = createMockWorkout();
      const state = workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });

      const exerciseId = state.exercises[0].id;
      const action: WorkoutEditorActionType = {
        type: "UPDATE_SET",
        payload: {
          exerciseId,
          setIndex: 0,
          data: { weight: 105 },
        },
      };

      // Act
      const newState = workoutEditorReducer(state, action);

      // Assert
      expect(newState.exercises[0].sets[0].weight).toBe(105);
      expect(newState.workoutId).toBe("workout-123"); // Preserved
    });

    it("deleguje REMOVE_EXERCISE do workoutLoggerReducer", () => {
      // Arrange
      const workout = createMockWorkout();
      const state = workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });

      const exerciseIdToRemove = state.exercises[1].id;
      const action: WorkoutEditorActionType = {
        type: "REMOVE_EXERCISE",
        payload: exerciseIdToRemove,
      };

      // Act
      const newState = workoutEditorReducer(state, action);

      // Assert
      expect(newState.exercises).toHaveLength(1);
      expect(newState.exercises[0].exercise_name).toBe("Bench Press");
      expect(newState.workoutId).toBe("workout-123"); // Preserved
    });

    it("deleguje RESET do workoutLoggerReducer", () => {
      // Arrange
      const workout = createMockWorkout();
      const state = workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });

      const action: WorkoutEditorActionType = {
        type: "RESET",
      };

      // Act
      const newState = workoutEditorReducer(state, action);

      // Assert
      expect(newState.exercises).toEqual([]);
      expect(newState.notes).toBeNull();
      expect(newState.workoutId).toBe("workout-123"); // Preserved
      expect(newState.originalDate).toBe("2026-01-20"); // Preserved
    });

    it("zachowuje editor-specific fields podczas delegacji", () => {
      // Arrange
      const workout = createMockWorkout();
      let state = workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });

      // Act - Execute multiple delegated actions
      state = workoutEditorReducer(state, {
        type: "SET_DATE",
        payload: "2026-02-15",
      });
      state = workoutEditorReducer(state, {
        type: "SET_NOTES",
        payload: "Updated",
      });
      state = workoutEditorReducer(state, {
        type: "SET_SAVING",
        payload: true,
      });

      // Assert - Editor fields preserved
      expect(state.workoutId).toBe("workout-123");
      expect(state.originalDate).toBe("2026-01-20");
      expect(state.createdAt).toBe("2026-01-20T10:00:00Z");
      expect(state.isLoading).toBe(false);
      expect(state.isDeleting).toBe(false);

      // Assert - Logger fields updated
      expect(state.date).toBe("2026-02-15");
      expect(state.notes).toBe("Updated");
      expect(state.isSaving).toBe(true);
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================

  describe("immutability", () => {
    it("nie mutuje oryginalnego state przy editor actions", () => {
      // Arrange
      const workout = createMockWorkout();
      const originalState = { ...initialState };

      // Act
      workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });

      // Assert
      expect(initialState).toEqual(originalState);
    });

    it("nie mutuje oryginalnego state przy delegated actions", () => {
      // Arrange
      const workout = createMockWorkout();
      const state = workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });

      const beforeDelegation = { ...state };

      // Act
      workoutEditorReducer(state, {
        type: "SET_DATE",
        payload: "2026-02-15",
      });

      // Assert
      expect(state).toEqual(beforeDelegation);
    });

    it("zwraca nowy obiekt przy każdej akcji", () => {
      // Arrange
      const workout = createMockWorkout();

      // Act
      const state1 = workoutEditorReducer(initialState, {
        type: "LOAD_WORKOUT_START",
      });
      const state2 = workoutEditorReducer(state1, {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      });
      const state3 = workoutEditorReducer(state2, {
        type: "SET_DATE",
        payload: "2026-02-15",
      });

      // Assert
      expect(state1).not.toBe(initialState);
      expect(state2).not.toBe(state1);
      expect(state3).not.toBe(state2);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("edge cases", () => {
    it("obsługuje workout bez sets (edge case)", () => {
      // Arrange
      const workout: WorkoutDetailsDTO = {
        ...createMockWorkout(),
        sets: [],
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.exercises).toEqual([]);
      expect(newState.workoutId).toBe("workout-123");
    });

    it("obsługuje workout z długimi notes", () => {
      // Arrange
      const longNotes = "A".repeat(1000);
      const workout: WorkoutDetailsDTO = {
        ...createMockWorkout(),
        notes: longNotes,
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.notes).toBe(longNotes);
      expect(newState.notes?.length).toBe(1000);
    });

    it("obsługuje workout z wieloma ćwiczeniami tego samego typu", () => {
      // Arrange
      const workout: WorkoutDetailsDTO = {
        ...createMockWorkout(),
        sets: Array.from({ length: 10 }, (_, i) => ({
          id: `set-${i}`,
          workout_id: "workout-123",
          exercise_id: `ex-${i}`,
          exercise_name: `Exercise ${i}`,
          exercise_type: "strength" as const,
          sort_order: i,
          weight: 100 + i * 5,
          reps: 8,
          distance: null,
          time: null,
          calculated_1rm: 124.16,
          calculated_volume: 800,
          created_at: "2026-01-20T10:00:00Z",
          updated_at: "2026-01-20T10:00:00Z",
        })),
      };
      const action: WorkoutEditorActionType = {
        type: "LOAD_WORKOUT_SUCCESS",
        payload: workout,
      };

      // Act
      const newState = workoutEditorReducer(initialState, action);

      // Assert
      expect(newState.exercises).toHaveLength(10);
      newState.exercises.forEach((exercise, i) => {
        expect(exercise.exercise_name).toBe(`Exercise ${i}`);
        expect(exercise.sets).toHaveLength(1);
      });
    });
  });
});
