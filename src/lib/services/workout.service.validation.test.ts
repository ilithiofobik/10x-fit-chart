/**
 * Workout Service - Validation Logic Unit Tests
 * Testing validation functions with mocked Supabase client
 *
 * @see .ai/unit-test-plan.md - Priority 2: High
 * @see .cursor/rules/vitest-unit-testing.mdc - Testing guidelines
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWorkout, ExerciseNotFoundError, ExerciseTypeMismatchError } from "./workout.service";
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateWorkoutCommand } from "../../types";

describe("workout.service - Validation", () => {
  // ============================================================================
  // Test Setup & Mocks
  // ============================================================================

  let mockSupabase: SupabaseClient;
  const userId = "user-123";

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    } as any;
  });

  // Mock helpers
  const createMockExerciseResponse = (exercises: any[]) => ({
    data: exercises,
    error: null,
  });

  const createMockWorkoutResponse = (workout: any) => ({
    data: workout,
    error: null,
  });

  const createMockSetsResponse = (sets: any[]) => ({
    data: sets,
    error: null,
  });

  // ============================================================================
  // Exercise Type Validation
  // ============================================================================

  describe("validateExerciseType", () => {
    it("rzuca ExerciseTypeMismatchError gdy strength ma distance", async () => {
      // Arrange
      const strengthExercise = {
        id: "ex-1",
        name: "Bench Press",
        type: "strength",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-1",
            sort_order: 0,
            weight: 100,
            reps: 8,
            distance: 5.0, // ❌ Invalid for strength
            time: null,
          },
        ],
      };

      // Mock Supabase responses
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([strengthExercise])),
        }),
      });

      // Act & Assert
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(ExerciseTypeMismatchError);
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(
        'Strength exercise "Bench Press" cannot have distance field'
      );
    });

    it("rzuca ExerciseTypeMismatchError gdy strength ma time", async () => {
      // Arrange
      const strengthExercise = {
        id: "ex-1",
        name: "Squat",
        type: "strength",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-1",
            sort_order: 0,
            weight: 120,
            reps: 5,
            distance: null,
            time: 1800, // ❌ Invalid for strength
          },
        ],
      };

      // Mock Supabase responses
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([strengthExercise])),
        }),
      });

      // Act & Assert
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(ExerciseTypeMismatchError);
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(
        'Strength exercise "Squat" cannot have time field'
      );
    });

    it("rzuca ExerciseTypeMismatchError gdy cardio ma weight", async () => {
      // Arrange
      const cardioExercise = {
        id: "ex-cardio-1",
        name: "Running",
        type: "cardio",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-cardio-1",
            sort_order: 0,
            weight: 5.0, // ❌ Invalid for cardio
            reps: null,
            distance: 5.0,
            time: 1800,
          },
        ],
      };

      // Mock Supabase responses
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([cardioExercise])),
        }),
      });

      // Act & Assert
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(ExerciseTypeMismatchError);
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(
        'Cardio exercise "Running" cannot have weight field'
      );
    });

    it("rzuca ExerciseTypeMismatchError gdy cardio ma reps", async () => {
      // Arrange
      const cardioExercise = {
        id: "ex-cardio-1",
        name: "Cycling",
        type: "cardio",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-cardio-1",
            sort_order: 0,
            weight: null,
            reps: 10, // ❌ Invalid for cardio
            distance: 10.0,
            time: 2400,
          },
        ],
      };

      // Mock Supabase responses
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([cardioExercise])),
        }),
      });

      // Act & Assert
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(ExerciseTypeMismatchError);
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(
        'Cardio exercise "Cycling" cannot have reps field'
      );
    });

    it("akceptuje poprawne pola dla strength (weight, reps)", async () => {
      // Arrange
      const strengthExercise = {
        id: "ex-1",
        name: "Bench Press",
        type: "strength",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-1",
            sort_order: 0,
            weight: 100, // ✅ Valid for strength
            reps: 8, // ✅ Valid for strength
            distance: null,
            time: null,
          },
        ],
      };

      const mockWorkout = {
        id: "workout-1",
        user_id: userId,
        date: "2026-01-20",
        notes: null,
        created_at: "2026-01-20T10:00:00Z",
        updated_at: "2026-01-20T10:00:00Z",
      };

      const mockSet = {
        id: "set-1",
        workout_id: "workout-1",
        exercise_id: "ex-1",
        sort_order: 0,
        weight: 100,
        reps: 8,
        distance: null,
        time: null,
        calculated_1rm: 124.16,
        calculated_volume: 800,
        created_at: "2026-01-20T10:00:00Z",
        updated_at: "2026-01-20T10:00:00Z",
      };

      // Mock Supabase responses
      let fromCallCount = 0;
      (mockSupabase.from as any).mockImplementation((table: string) => {
        fromCallCount++;

        if (table === "exercises") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue(createMockExerciseResponse([strengthExercise])),
            }),
          };
        }

        if (table === "workouts" && fromCallCount === 2) {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(createMockWorkoutResponse(mockWorkout)),
              }),
            }),
          };
        }

        if (table === "workout_sets") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue(createMockSetsResponse([mockSet])),
            }),
          };
        }

        return {};
      });

      // Act & Assert
      await expect(createWorkout(mockSupabase, userId, command)).resolves.not.toThrow();
    });

    it("akceptuje poprawne pola dla cardio (distance, time)", async () => {
      // Arrange
      const cardioExercise = {
        id: "ex-cardio-1",
        name: "Running",
        type: "cardio",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-cardio-1",
            sort_order: 0,
            weight: null,
            reps: null,
            distance: 5.0, // ✅ Valid for cardio
            time: 1800, // ✅ Valid for cardio
          },
        ],
      };

      const mockWorkout = {
        id: "workout-1",
        user_id: userId,
        date: "2026-01-20",
        notes: null,
        created_at: "2026-01-20T10:00:00Z",
        updated_at: "2026-01-20T10:00:00Z",
      };

      const mockSet = {
        id: "set-1",
        workout_id: "workout-1",
        exercise_id: "ex-cardio-1",
        sort_order: 0,
        weight: null,
        reps: null,
        distance: 5.0,
        time: 1800,
        calculated_1rm: null,
        calculated_volume: null,
        created_at: "2026-01-20T10:00:00Z",
        updated_at: "2026-01-20T10:00:00Z",
      };

      // Mock Supabase responses
      let fromCallCount = 0;
      (mockSupabase.from as any).mockImplementation((table: string) => {
        fromCallCount++;

        if (table === "exercises") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue(createMockExerciseResponse([cardioExercise])),
            }),
          };
        }

        if (table === "workouts" && fromCallCount === 2) {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(createMockWorkoutResponse(mockWorkout)),
              }),
            }),
          };
        }

        if (table === "workout_sets") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue(createMockSetsResponse([mockSet])),
            }),
          };
        }

        return {};
      });

      // Act & Assert
      await expect(createWorkout(mockSupabase, userId, command)).resolves.not.toThrow();
    });

    it("waliduje wszystkie sets w workout", async () => {
      // Arrange
      const strengthExercise = {
        id: "ex-1",
        name: "Bench Press",
        type: "strength",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-1",
            sort_order: 0,
            weight: 100,
            reps: 8,
            distance: null,
            time: null,
          },
          {
            exercise_id: "ex-1",
            sort_order: 1,
            weight: 100,
            reps: 7,
            distance: null,
            time: null,
          },
          {
            exercise_id: "ex-1",
            sort_order: 2,
            weight: 100,
            reps: 6,
            distance: 5.0, // ❌ Invalid in third set
            time: null,
          },
        ],
      };

      // Mock Supabase responses
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([strengthExercise])),
        }),
      });

      // Act & Assert
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(ExerciseTypeMismatchError);
    });
  });

  // ============================================================================
  // Exercise Existence Validation
  // ============================================================================

  describe("validateExerciseExists", () => {
    it("rzuca ExerciseNotFoundError gdy exercise nie istnieje", async () => {
      // Arrange
      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "non-existent-id",
            sort_order: 0,
            weight: 100,
            reps: 8,
            distance: null,
            time: null,
          },
        ],
      };

      // Mock Supabase to return empty array (no exercises found)
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([])),
        }),
      });

      // Act & Assert
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(ExerciseNotFoundError);
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(
        "One or more exercises not found or not accessible"
      );
    });

    it("rzuca ExerciseNotFoundError gdy niektóre exercises nie istnieją", async () => {
      // Arrange
      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-1",
            sort_order: 0,
            weight: 100,
            reps: 8,
            distance: null,
            time: null,
          },
          {
            exercise_id: "ex-non-existent",
            sort_order: 1,
            weight: 105,
            reps: 7,
            distance: null,
            time: null,
          },
        ],
      };

      // Mock Supabase to return only one exercise (ex-1), but command has two
      const exercises = [
        {
          id: "ex-1",
          name: "Bench Press",
          type: "strength",
          user_id: null,
        },
      ];

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse(exercises)),
        }),
      });

      // Act & Assert
      await expect(createWorkout(mockSupabase, userId, command)).rejects.toThrow(ExerciseNotFoundError);
    });

    it("weryfikuje unique exercise IDs (deduplikacja przed sprawdzeniem)", async () => {
      // Arrange
      const strengthExercise = {
        id: "ex-1",
        name: "Bench Press",
        type: "strength",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-1",
            sort_order: 0,
            weight: 100,
            reps: 8,
            distance: null,
            time: null,
          },
          {
            exercise_id: "ex-1", // Same exercise, multiple sets
            sort_order: 1,
            weight: 100,
            reps: 7,
            distance: null,
            time: null,
          },
        ],
      };

      const mockWorkout = {
        id: "workout-1",
        user_id: userId,
        date: "2026-01-20",
        notes: null,
        created_at: "2026-01-20T10:00:00Z",
        updated_at: "2026-01-20T10:00:00Z",
      };

      const mockSets = [
        {
          id: "set-1",
          workout_id: "workout-1",
          exercise_id: "ex-1",
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
      ];

      // Mock Supabase responses
      let fromCallCount = 0;
      (mockSupabase.from as any).mockImplementation((table: string) => {
        fromCallCount++;

        if (table === "exercises") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue(createMockExerciseResponse([strengthExercise])),
            }),
          };
        }

        if (table === "workouts" && fromCallCount === 2) {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(createMockWorkoutResponse(mockWorkout)),
              }),
            }),
          };
        }

        if (table === "workout_sets") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue(createMockSetsResponse(mockSets)),
            }),
          };
        }

        return {};
      });

      // Act & Assert - Should not throw, should deduplicate exercise IDs
      await expect(createWorkout(mockSupabase, userId, command)).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Custom Error Classes
  // ============================================================================

  describe("custom error classes", () => {
    it("ExerciseNotFoundError ma poprawną nazwę", async () => {
      // Arrange
      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "non-existent",
            sort_order: 0,
            weight: 100,
            reps: 8,
            distance: null,
            time: null,
          },
        ],
      };

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([])),
        }),
      });

      // Act & Assert
      try {
        await createWorkout(mockSupabase, userId, command);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ExerciseNotFoundError);
        expect((error as ExerciseNotFoundError).name).toBe("ExerciseNotFoundError");
      }
    });

    it("ExerciseTypeMismatchError ma poprawną nazwę", async () => {
      // Arrange
      const strengthExercise = {
        id: "ex-1",
        name: "Bench Press",
        type: "strength",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-1",
            sort_order: 0,
            weight: 100,
            reps: 8,
            distance: 5.0,
            time: null,
          },
        ],
      };

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([strengthExercise])),
        }),
      });

      // Act & Assert
      try {
        await createWorkout(mockSupabase, userId, command);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ExerciseTypeMismatchError);
        expect((error as ExerciseTypeMismatchError).name).toBe("ExerciseTypeMismatchError");
      }
    });

    it("custom errors są instanceof Error", async () => {
      // Arrange
      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "non-existent",
            sort_order: 0,
            weight: 100,
            reps: 8,
            distance: null,
            time: null,
          },
        ],
      };

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([])),
        }),
      });

      // Act & Assert
      try {
        await createWorkout(mockSupabase, userId, command);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ExerciseNotFoundError);
      }
    });

    it("custom errors mają poprawne message", async () => {
      // Arrange
      const strengthExercise = {
        id: "ex-1",
        name: "Test Exercise",
        type: "strength",
        user_id: null,
      };

      const command: CreateWorkoutCommand = {
        date: "2026-01-20",
        notes: null,
        sets: [
          {
            exercise_id: "ex-1",
            sort_order: 0,
            weight: null,
            reps: null,
            distance: 5.0,
            time: null,
          },
        ],
      };

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(createMockExerciseResponse([strengthExercise])),
        }),
      });

      // Act & Assert
      try {
        await createWorkout(mockSupabase, userId, command);
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("Test Exercise");
        expect((error as Error).message).toContain("distance");
      }
    });
  });
});
