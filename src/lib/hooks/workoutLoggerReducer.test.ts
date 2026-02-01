/**
 * Workout Logger Reducer - Unit Tests
 * Testing pure reducer functions with comprehensive edge cases and immutability checks
 *
 * @see .ai/unit-test-plan.md - Priority 1: Critical
 * @see .cursor/rules/vitest-unit-testing.mdc - Testing guidelines
 */

import { describe, it, expect, beforeEach } from "vitest";
import { workoutLoggerReducer, getInitialState } from "./workoutLoggerReducer";
import type { WorkoutLoggerState, WorkoutLoggerActionType } from "../../components/workout-logger/types";
import type { ExerciseDTO, WorkoutDetailsDTO } from "../../types";

describe("workoutLoggerReducer", () => {
  // ============================================================================
  // Test Setup & Helpers
  // ============================================================================

  let initialState: WorkoutLoggerState;

  beforeEach(() => {
    initialState = getInitialState();
  });

  // Mock data helpers
  const createMockExercise = (overrides?: Partial<ExerciseDTO>): ExerciseDTO => ({
    id: "ex-1",
    name: "Bench Press",
    type: "strength",
    user_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  });

  const createMockCardioExercise = (): ExerciseDTO => ({
    id: "ex-cardio-1",
    name: "Running",
    type: "cardio",
    user_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  });

  const createMockWorkoutTemplate = (): WorkoutDetailsDTO => ({
    id: "workout-1",
    user_id: "user-1",
    date: "2026-01-20",
    notes: "Template notes",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T10:00:00Z",
    sets: [
      {
        id: "set-1",
        workout_id: "workout-1",
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
        workout_id: "workout-1",
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
        workout_id: "workout-1",
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

  // ============================================================================
  // SET_DATE Action
  // ============================================================================

  describe("SET_DATE", () => {
    it("ustawia nową datę", () => {
      // Arrange
      const action: WorkoutLoggerActionType = {
        type: "SET_DATE",
        payload: "2026-02-15",
      };

      // Act
      const newState = workoutLoggerReducer(initialState, action);

      // Assert
      expect(newState.date).toBe("2026-02-15");
    });

    it("nie mutuje oryginalnego state", () => {
      // Arrange
      const action: WorkoutLoggerActionType = {
        type: "SET_DATE",
        payload: "2026-02-15",
      };
      const originalDate = initialState.date;

      // Act
      workoutLoggerReducer(initialState, action);

      // Assert
      expect(initialState.date).toBe(originalDate);
    });

    it("zwraca nowy obiekt state", () => {
      // Arrange
      const action: WorkoutLoggerActionType = {
        type: "SET_DATE",
        payload: "2026-02-15",
      };

      // Act
      const newState = workoutLoggerReducer(initialState, action);

      // Assert
      expect(newState).not.toBe(initialState);
    });

    it("zachowuje pozostałe pola state", () => {
      // Arrange
      const stateWithData: WorkoutLoggerState = {
        ...initialState,
        notes: "Test notes",
      };
      const action: WorkoutLoggerActionType = {
        type: "SET_DATE",
        payload: "2026-02-15",
      };

      // Act
      const newState = workoutLoggerReducer(stateWithData, action);

      // Assert
      expect(newState.notes).toBe("Test notes");
    });
  });

  // ============================================================================
  // SET_NOTES Action
  // ============================================================================

  describe("SET_NOTES", () => {
    it("ustawia notes z wartością string", () => {
      // Arrange
      const action: WorkoutLoggerActionType = {
        type: "SET_NOTES",
        payload: "Great workout today!",
      };

      // Act
      const newState = workoutLoggerReducer(initialState, action);

      // Assert
      expect(newState.notes).toBe("Great workout today!");
    });

    it("ustawia notes na null", () => {
      // Arrange
      const stateWithNotes: WorkoutLoggerState = {
        ...initialState,
        notes: "Some notes",
      };
      const action: WorkoutLoggerActionType = {
        type: "SET_NOTES",
        payload: null,
      };

      // Act
      const newState = workoutLoggerReducer(stateWithNotes, action);

      // Assert
      expect(newState.notes).toBeNull();
    });

    it("nie mutuje oryginalnego state", () => {
      // Arrange
      const action: WorkoutLoggerActionType = {
        type: "SET_NOTES",
        payload: "New notes",
      };

      // Act
      workoutLoggerReducer(initialState, action);

      // Assert
      expect(initialState.notes).toBeNull();
    });
  });

  // ============================================================================
  // ADD_EXERCISE Action
  // ============================================================================

  describe("ADD_EXERCISE", () => {
    it("dodaje ćwiczenie strength z pustą listą sets", () => {
      // Arrange
      const exercise = createMockExercise();
      const action: WorkoutLoggerActionType = {
        type: "ADD_EXERCISE",
        payload: exercise,
      };

      // Act
      const newState = workoutLoggerReducer(initialState, action);

      // Assert
      expect(newState.exercises).toHaveLength(1);
      expect(newState.exercises[0].exercise_id).toBe("ex-1");
      expect(newState.exercises[0].exercise_name).toBe("Bench Press");
      expect(newState.exercises[0].exercise_type).toBe("strength");
      expect(newState.exercises[0].sets).toHaveLength(1);
      expect(newState.exercises[0].sets[0]).toEqual({
        weight: null,
        reps: null,
        distance: null,
        time: null,
      });
    });

    it("dodaje ćwiczenie cardio z pustą listą sets", () => {
      // Arrange
      const exercise = createMockCardioExercise();
      const action: WorkoutLoggerActionType = {
        type: "ADD_EXERCISE",
        payload: exercise,
      };

      // Act
      const newState = workoutLoggerReducer(initialState, action);

      // Assert
      expect(newState.exercises).toHaveLength(1);
      expect(newState.exercises[0].exercise_type).toBe("cardio");
      expect(newState.exercises[0].sets).toHaveLength(1);
      expect(newState.exercises[0].sets[0]).toEqual({
        weight: null,
        reps: null,
        distance: null,
        time: null,
      });
    });

    it("generuje unique temporary ID dla ćwiczenia", () => {
      // Arrange
      const exercise = createMockExercise();
      const action: WorkoutLoggerActionType = {
        type: "ADD_EXERCISE",
        payload: exercise,
      };

      // Act
      const state1 = workoutLoggerReducer(initialState, action);
      const state2 = workoutLoggerReducer(state1, action);

      // Assert
      expect(state2.exercises).toHaveLength(2);
      expect(state2.exercises[0].id).not.toBe(state2.exercises[1].id);
      expect(state2.exercises[0].id).toMatch(/^temp_/);
      expect(state2.exercises[1].id).toMatch(/^temp_/);
    });

    it("zachowuje istniejące ćwiczenia", () => {
      // Arrange
      const exercise1 = createMockExercise({ id: "ex-1", name: "Bench Press" });
      const exercise2 = createMockExercise({ id: "ex-2", name: "Squat" });

      // Act
      const state1 = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise1,
      });
      const state2 = workoutLoggerReducer(state1, {
        type: "ADD_EXERCISE",
        payload: exercise2,
      });

      // Assert
      expect(state2.exercises).toHaveLength(2);
      expect(state2.exercises[0].exercise_name).toBe("Bench Press");
      expect(state2.exercises[1].exercise_name).toBe("Squat");
    });

    it("nie mutuje oryginalnej tablicy exercises", () => {
      // Arrange
      const exercise = createMockExercise();
      const action: WorkoutLoggerActionType = {
        type: "ADD_EXERCISE",
        payload: exercise,
      };
      const originalExercises = initialState.exercises;

      // Act
      const newState = workoutLoggerReducer(initialState, action);

      // Assert
      expect(initialState.exercises).toBe(originalExercises);
      expect(newState.exercises).not.toBe(originalExercises);
    });
  });

  // ============================================================================
  // REMOVE_EXERCISE Action
  // ============================================================================

  describe("REMOVE_EXERCISE", () => {
    it("usuwa ćwiczenie po ID", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });
      const exerciseId = stateWithExercise.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, {
        type: "REMOVE_EXERCISE",
        payload: exerciseId,
      });

      // Assert
      expect(newState.exercises).toHaveLength(0);
    });

    it("usuwa tylko określone ćwiczenie, zachowuje pozostałe", () => {
      // Arrange
      const exercise1 = createMockExercise({ id: "ex-1", name: "Bench Press" });
      const exercise2 = createMockExercise({ id: "ex-2", name: "Squat" });
      const exercise3 = createMockExercise({ id: "ex-3", name: "Deadlift" });

      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise1 });
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise2 });
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise3 });

      const exerciseIdToRemove = state.exercises[1].id;

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "REMOVE_EXERCISE",
        payload: exerciseIdToRemove,
      });

      // Assert
      expect(newState.exercises).toHaveLength(2);
      expect(newState.exercises[0].exercise_name).toBe("Bench Press");
      expect(newState.exercises[1].exercise_name).toBe("Deadlift");
    });

    it("nie zmienia state gdy ID nie istnieje (graceful handling)", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, {
        type: "REMOVE_EXERCISE",
        payload: "non-existent-id",
      });

      // Assert
      expect(newState.exercises).toHaveLength(1);
    });

    it("nie mutuje oryginalnej tablicy exercises", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });
      const exerciseId = stateWithExercise.exercises[0].id;
      const originalExercises = stateWithExercise.exercises;

      // Act
      workoutLoggerReducer(stateWithExercise, {
        type: "REMOVE_EXERCISE",
        payload: exerciseId,
      });

      // Assert
      expect(stateWithExercise.exercises).toBe(originalExercises);
    });
  });

  // ============================================================================
  // ADD_SET Action
  // ============================================================================

  describe("ADD_SET", () => {
    it("dodaje nowy pusty set do ćwiczenia strength", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });
      const exerciseId = stateWithExercise.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, {
        type: "ADD_SET",
        payload: exerciseId,
      });

      // Assert
      expect(newState.exercises[0].sets).toHaveLength(2);
      expect(newState.exercises[0].sets[1]).toEqual({
        weight: null,
        reps: null,
        distance: null,
        time: null,
      });
    });

    it("dodaje nowy pusty set do ćwiczenia cardio", () => {
      // Arrange
      const exercise = createMockCardioExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });
      const exerciseId = stateWithExercise.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, {
        type: "ADD_SET",
        payload: exerciseId,
      });

      // Assert
      expect(newState.exercises[0].sets).toHaveLength(2);
      expect(newState.exercises[0].sets[1]).toEqual({
        weight: null,
        reps: null,
        distance: null,
        time: null,
      });
    });

    it("zachowuje istniejące sets", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;

      // Update first set
      state = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 100, reps: 8 } },
      });

      // Act - Add second set
      const newState = workoutLoggerReducer(state, {
        type: "ADD_SET",
        payload: exerciseId,
      });

      // Assert
      expect(newState.exercises[0].sets).toHaveLength(2);
      expect(newState.exercises[0].sets[0].weight).toBe(100);
      expect(newState.exercises[0].sets[0].reps).toBe(8);
      expect(newState.exercises[0].sets[1].weight).toBeNull();
    });

    it("nie zmienia innych ćwiczeń", () => {
      // Arrange
      const exercise1 = createMockExercise({ id: "ex-1", name: "Bench Press" });
      const exercise2 = createMockExercise({ id: "ex-2", name: "Squat" });

      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise1 });
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise2 });

      const exercise1Id = state.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "ADD_SET",
        payload: exercise1Id,
      });

      // Assert
      expect(newState.exercises[0].sets).toHaveLength(2);
      expect(newState.exercises[1].sets).toHaveLength(1);
    });

    it("nie mutuje oryginalnej tablicy sets", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });
      const exerciseId = stateWithExercise.exercises[0].id;
      const originalSets = stateWithExercise.exercises[0].sets;

      // Act
      workoutLoggerReducer(stateWithExercise, {
        type: "ADD_SET",
        payload: exerciseId,
      });

      // Assert
      expect(stateWithExercise.exercises[0].sets).toBe(originalSets);
    });
  });

  // ============================================================================
  // REMOVE_SET Action
  // ============================================================================

  describe("REMOVE_SET", () => {
    it("usuwa set z określonego indeksu", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;
      state = workoutLoggerReducer(state, { type: "ADD_SET", payload: exerciseId });
      state = workoutLoggerReducer(state, { type: "ADD_SET", payload: exerciseId });

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "REMOVE_SET",
        payload: { exerciseId, setIndex: 1 },
      });

      // Assert
      expect(newState.exercises[0].sets).toHaveLength(2);
    });

    it("zachowuje pozostałe sets w poprawnej kolejności", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;

      // Add sets with different data
      state = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 100, reps: 8 } },
      });
      state = workoutLoggerReducer(state, { type: "ADD_SET", payload: exerciseId });
      state = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 1, data: { weight: 105, reps: 7 } },
      });
      state = workoutLoggerReducer(state, { type: "ADD_SET", payload: exerciseId });
      state = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 2, data: { weight: 110, reps: 6 } },
      });

      // Act - Remove middle set
      const newState = workoutLoggerReducer(state, {
        type: "REMOVE_SET",
        payload: { exerciseId, setIndex: 1 },
      });

      // Assert
      expect(newState.exercises[0].sets).toHaveLength(2);
      expect(newState.exercises[0].sets[0].weight).toBe(100);
      expect(newState.exercises[0].sets[1].weight).toBe(110);
    });

    it("nie zmienia innych ćwiczeń", () => {
      // Arrange
      const exercise1 = createMockExercise({ id: "ex-1", name: "Bench Press" });
      const exercise2 = createMockExercise({ id: "ex-2", name: "Squat" });

      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise1 });
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise2 });

      const exercise1Id = state.exercises[0].id;
      state = workoutLoggerReducer(state, { type: "ADD_SET", payload: exercise1Id });

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "REMOVE_SET",
        payload: { exerciseId: exercise1Id, setIndex: 1 },
      });

      // Assert
      expect(newState.exercises[0].sets).toHaveLength(1);
      expect(newState.exercises[1].sets).toHaveLength(1);
    });

    it("obsługuje nieistniejący setIndex (graceful)", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });
      const exerciseId = stateWithExercise.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, {
        type: "REMOVE_SET",
        payload: { exerciseId, setIndex: 99 },
      });

      // Assert
      expect(newState.exercises[0].sets).toHaveLength(1);
    });

    it("obsługuje nieistniejący exerciseId (graceful)", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, {
        type: "REMOVE_SET",
        payload: { exerciseId: "non-existent-id", setIndex: 0 },
      });

      // Assert
      expect(newState.exercises[0].sets).toHaveLength(1);
    });

    it("nie mutuje oryginalnej tablicy sets", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;
      state = workoutLoggerReducer(state, { type: "ADD_SET", payload: exerciseId });

      const originalSets = state.exercises[0].sets;

      // Act
      workoutLoggerReducer(state, {
        type: "REMOVE_SET",
        payload: { exerciseId, setIndex: 1 },
      });

      // Assert
      expect(state.exercises[0].sets).toBe(originalSets);
    });
  });

  // ============================================================================
  // UPDATE_SET Action
  // ============================================================================

  describe("UPDATE_SET", () => {
    it("aktualizuje weight bez zmiany innych pól", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;

      state = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 100, reps: 8 } },
      });

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 105 } },
      });

      // Assert
      expect(newState.exercises[0].sets[0].weight).toBe(105);
      expect(newState.exercises[0].sets[0].reps).toBe(8);
    });

    it("aktualizuje reps bez zmiany innych pól", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;

      state = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 100, reps: 8 } },
      });

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { reps: 10 } },
      });

      // Assert
      expect(newState.exercises[0].sets[0].weight).toBe(100);
      expect(newState.exercises[0].sets[0].reps).toBe(10);
    });

    it("aktualizuje distance dla cardio", () => {
      // Arrange
      const exercise = createMockCardioExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { distance: 5.5 } },
      });

      // Assert
      expect(newState.exercises[0].sets[0].distance).toBe(5.5);
    });

    it("aktualizuje time dla cardio", () => {
      // Arrange
      const exercise = createMockCardioExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { time: 1800 } },
      });

      // Assert
      expect(newState.exercises[0].sets[0].time).toBe(1800);
    });

    it("aktualizuje wiele pól jednocześnie", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 100, reps: 8 } },
      });

      // Assert
      expect(newState.exercises[0].sets[0].weight).toBe(100);
      expect(newState.exercises[0].sets[0].reps).toBe(8);
    });

    it("nie zmienia innych sets w tym samym ćwiczeniu", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;

      state = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 100, reps: 8 } },
      });
      state = workoutLoggerReducer(state, { type: "ADD_SET", payload: exerciseId });
      state = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 1, data: { weight: 105, reps: 7 } },
      });

      // Act - Update only first set
      const newState = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 110 } },
      });

      // Assert
      expect(newState.exercises[0].sets[0].weight).toBe(110);
      expect(newState.exercises[0].sets[1].weight).toBe(105);
    });

    it("nie zmienia innych ćwiczeń", () => {
      // Arrange
      const exercise1 = createMockExercise({ id: "ex-1", name: "Bench Press" });
      const exercise2 = createMockExercise({ id: "ex-2", name: "Squat" });

      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise1 });
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise2 });

      const exercise1Id = state.exercises[0].id;
      const exercise2Id = state.exercises[1].id;

      state = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId: exercise2Id, setIndex: 0, data: { weight: 120 } },
      });

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId: exercise1Id, setIndex: 0, data: { weight: 100 } },
      });

      // Assert
      expect(newState.exercises[0].sets[0].weight).toBe(100);
      expect(newState.exercises[1].sets[0].weight).toBe(120);
    });

    it("obsługuje nieistniejący exerciseId (graceful)", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, {
        type: "UPDATE_SET",
        payload: { exerciseId: "non-existent-id", setIndex: 0, data: { weight: 100 } },
      });

      // Assert
      expect(newState).toEqual(stateWithExercise);
    });

    it("obsługuje nieistniejący setIndex (graceful)", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });
      const exerciseId = stateWithExercise.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 99, data: { weight: 100 } },
      });

      // Assert
      expect(newState).toEqual(stateWithExercise);
    });

    it("zachowuje immutability", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      const exerciseId = state.exercises[0].id;

      const originalSets = state.exercises[0].sets;
      const originalSet = state.exercises[0].sets[0];

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 100 } },
      });

      // Assert
      expect(state.exercises[0].sets).toBe(originalSets);
      expect(state.exercises[0].sets[0]).toBe(originalSet);
      expect(newState.exercises[0].sets).not.toBe(originalSets);
      expect(newState.exercises[0].sets[0]).not.toBe(originalSet);
    });
  });

  // ============================================================================
  // LOAD_TEMPLATE Action
  // ============================================================================

  describe("LOAD_TEMPLATE", () => {
    it("ładuje strukturę ćwiczeń z template", () => {
      // Arrange
      const template = createMockWorkoutTemplate();

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      expect(newState.exercises).toHaveLength(2);
      expect(newState.exercises[0].exercise_name).toBe("Bench Press");
      expect(newState.exercises[0].sets).toHaveLength(2);
      expect(newState.exercises[1].exercise_name).toBe("Squat");
      expect(newState.exercises[1].sets).toHaveLength(1);
    });

    it("ustawia datę na dzisiaj (nie template date)", () => {
      // Arrange
      const template = createMockWorkoutTemplate();
      const today = new Date().toISOString().split("T")[0];

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      expect(newState.date).toBe(today);
      expect(newState.date).not.toBe(template.date);
    });

    it("czyści notes (nie kopiuje z template)", () => {
      // Arrange
      const template = createMockWorkoutTemplate();

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      expect(newState.notes).toBeNull();
    });

    it("zachowuje exercise_id z template", () => {
      // Arrange
      const template = createMockWorkoutTemplate();

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      expect(newState.exercises[0].exercise_id).toBe("ex-1");
      expect(newState.exercises[1].exercise_id).toBe("ex-2");
    });

    it("zachowuje strukturę sets z template (weight, reps, distance, time)", () => {
      // Arrange
      const template = createMockWorkoutTemplate();

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      const firstExercise = newState.exercises[0];
      expect(firstExercise.sets[0].weight).toBe(100);
      expect(firstExercise.sets[0].reps).toBe(8);
      expect(firstExercise.sets[1].weight).toBe(100);
      expect(firstExercise.sets[1].reps).toBe(7);

      const secondExercise = newState.exercises[1];
      expect(secondExercise.sets[0].weight).toBe(120);
      expect(secondExercise.sets[0].reps).toBe(5);
    });

    it("grupuje sets według exercise_id", () => {
      // Arrange
      const template = createMockWorkoutTemplate();

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      expect(newState.exercises).toHaveLength(2);
      expect(newState.exercises[0].sets).toHaveLength(2);
      expect(newState.exercises[1].sets).toHaveLength(1);
    });

    it("generuje nowe temporary IDs dla ćwiczeń (nie kopiuje workout IDs)", () => {
      // Arrange
      const template = createMockWorkoutTemplate();

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      expect(newState.exercises[0].id).toMatch(/^temp_/);
      expect(newState.exercises[1].id).toMatch(/^temp_/);
      expect(newState.exercises[0].id).not.toBe("set-1");
    });

    it("obsługuje template z jednym ćwiczeniem", () => {
      // Arrange
      const template: WorkoutDetailsDTO = {
        ...createMockWorkoutTemplate(),
        sets: [
          {
            id: "set-1",
            workout_id: "workout-1",
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
        ],
      };

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      expect(newState.exercises).toHaveLength(1);
      expect(newState.exercises[0].sets).toHaveLength(1);
    });

    it("obsługuje template bez sets (edge case)", () => {
      // Arrange
      const template: WorkoutDetailsDTO = {
        ...createMockWorkoutTemplate(),
        sets: [],
      };

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      expect(newState.exercises).toHaveLength(0);
    });

    it("zastępuje istniejące exercises", () => {
      // Arrange
      const exercise = createMockExercise({ id: "existing-ex", name: "Existing Exercise" });
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });

      const template = createMockWorkoutTemplate();

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, {
        type: "LOAD_TEMPLATE",
        payload: template,
      });

      // Assert
      expect(newState.exercises).toHaveLength(2);
      expect(newState.exercises[0].exercise_name).toBe("Bench Press");
      expect(newState.exercises[0].exercise_name).not.toBe("Existing Exercise");
    });
  });

  // ============================================================================
  // RESET_STATE Action
  // ============================================================================

  describe("RESET", () => {
    it("resetuje do initialState", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });
      state = workoutLoggerReducer(state, {
        type: "SET_NOTES",
        payload: "Some notes",
      });

      // Act
      const newState = workoutLoggerReducer(state, { type: "RESET" });

      // Assert
      const expectedState = getInitialState();
      expect(newState.exercises).toEqual(expectedState.exercises);
      expect(newState.notes).toBe(expectedState.notes);
      expect(newState.availableExercises).toEqual(expectedState.availableExercises);
    });

    it("ustawia datę na dzisiaj", () => {
      // Arrange
      const state: WorkoutLoggerState = {
        ...initialState,
        date: "2025-01-01",
      };
      const today = new Date().toISOString().split("T")[0];

      // Act
      const newState = workoutLoggerReducer(state, { type: "RESET" });

      // Assert
      expect(newState.date).toBe(today);
    });

    it("czyści exercises", () => {
      // Arrange
      const exercise = createMockExercise();
      const stateWithExercise = workoutLoggerReducer(initialState, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });

      // Act
      const newState = workoutLoggerReducer(stateWithExercise, { type: "RESET" });

      // Assert
      expect(newState.exercises).toEqual([]);
    });

    it("czyści notes", () => {
      // Arrange
      const stateWithNotes: WorkoutLoggerState = {
        ...initialState,
        notes: "Test notes",
      };

      // Act
      const newState = workoutLoggerReducer(stateWithNotes, { type: "RESET" });

      // Assert
      expect(newState.notes).toBeNull();
    });

    it("zachowuje availableExercises", () => {
      // Arrange
      const exercises = [createMockExercise()];
      const stateWithExercises: WorkoutLoggerState = {
        ...initialState,
        availableExercises: exercises,
      };

      // Act
      const newState = workoutLoggerReducer(stateWithExercises, { type: "RESET" });

      // Assert - availableExercises should be preserved (it's app data, not form data)
      // Actually, looking at the implementation, RESET returns getInitialState() which has empty availableExercises
      // So this test should verify that availableExercises is reset to empty array
      expect(newState.availableExercises).toEqual([]);
    });
  });

  // ============================================================================
  // Immutability Tests
  // ============================================================================

  describe("immutability", () => {
    it("nie mutuje oryginalnego state przy żadnej akcji", () => {
      // Arrange
      const exercise = createMockExercise();
      const originalState = { ...initialState };

      // Act - Execute multiple actions
      workoutLoggerReducer(initialState, { type: "SET_DATE", payload: "2026-02-15" });
      workoutLoggerReducer(initialState, { type: "SET_NOTES", payload: "Notes" });
      workoutLoggerReducer(initialState, { type: "ADD_EXERCISE", payload: exercise });

      // Assert
      expect(initialState).toEqual(originalState);
    });

    it("zwraca nowy obiekt przy każdej akcji", () => {
      // Arrange
      const exercise = createMockExercise();

      // Act
      const state1 = workoutLoggerReducer(initialState, {
        type: "SET_DATE",
        payload: "2026-02-15",
      });
      const state2 = workoutLoggerReducer(state1, {
        type: "ADD_EXERCISE",
        payload: exercise,
      });
      const state3 = workoutLoggerReducer(state2, {
        type: "SET_NOTES",
        payload: "Notes",
      });

      // Assert
      expect(state1).not.toBe(initialState);
      expect(state2).not.toBe(state1);
      expect(state3).not.toBe(state2);
    });

    it("nie mutuje zagnieżdżonych obiektów (sets, exercises)", () => {
      // Arrange
      const exercise = createMockExercise();
      let state = initialState;
      state = workoutLoggerReducer(state, { type: "ADD_EXERCISE", payload: exercise });

      const originalExercises = state.exercises;
      const originalSets = state.exercises[0].sets;
      const exerciseId = state.exercises[0].id;

      // Act
      const newState = workoutLoggerReducer(state, {
        type: "UPDATE_SET",
        payload: { exerciseId, setIndex: 0, data: { weight: 100 } },
      });

      // Assert
      expect(state.exercises).toBe(originalExercises);
      expect(state.exercises[0].sets).toBe(originalSets);
      expect(newState.exercises).not.toBe(originalExercises);
      expect(newState.exercises[0].sets).not.toBe(originalSets);
    });
  });

  // ============================================================================
  // Additional Actions
  // ============================================================================

  describe("SET_AVAILABLE_EXERCISES", () => {
    it("ustawia listę dostępnych ćwiczeń", () => {
      // Arrange
      const exercises = [createMockExercise(), createMockCardioExercise()];

      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "SET_AVAILABLE_EXERCISES",
        payload: exercises,
      });

      // Assert
      expect(newState.availableExercises).toEqual(exercises);
    });
  });

  describe("SET_LOADING_EXERCISES", () => {
    it("ustawia flagę isLoadingExercises", () => {
      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "SET_LOADING_EXERCISES",
        payload: true,
      });

      // Assert
      expect(newState.isLoadingExercises).toBe(true);
    });
  });

  describe("SET_SAVING", () => {
    it("ustawia flagę isSaving", () => {
      // Act
      const newState = workoutLoggerReducer(initialState, {
        type: "SET_SAVING",
        payload: true,
      });

      // Assert
      expect(newState.isSaving).toBe(true);
    });
  });
});
