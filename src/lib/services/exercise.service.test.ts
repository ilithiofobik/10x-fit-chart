/**
 * Exercise Service - Validation Unit Tests
 * Testing validation logic with mocked Supabase client
 *
 * @see .ai/unit-test-plan.md - Priority 2: High
 * @see .cursor/rules/vitest-unit-testing.mdc - Testing guidelines
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createExercise,
  updateExercise,
  ExerciseConflictError,
  NotFoundError,
  ForbiddenError,
} from "./exercise.service";
import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateExerciseCommand, UpdateExerciseCommand } from "../../types";

describe("exercise.service - Validation", () => {
  // ============================================================================
  // Test Setup & Mocks
  // ============================================================================

  let mockSupabase: SupabaseClient;
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn(),
    } as any;
  });

  // ============================================================================
  // createExercise - Name Uniqueness
  // ============================================================================

  describe("checkNameUnique (createExercise)", () => {
    it("akceptuje unikalną nazwę", async () => {
      // Arrange
      const command: CreateExerciseCommand = {
        name: "My Custom Exercise",
        type: "strength",
      };

      // Mock: No existing exercises with this name
      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "exercises") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [], // No duplicates
                    error: null,
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "ex-new",
                    user_id: userId,
                    name: "My Custom Exercise",
                    type: "strength",
                    is_archived: false,
                    created_at: "2026-01-20T10:00:00Z",
                    updated_at: "2026-01-20T10:00:00Z",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await createExercise(mockSupabase, userId, command);

      // Assert
      expect(result.name).toBe("My Custom Exercise");
      expect(result.is_system).toBe(false);
    });

    it("rzuca ExerciseConflictError dla duplikatu nazwy", async () => {
      // Arrange
      const command: CreateExerciseCommand = {
        name: "Duplicate Exercise",
        type: "strength",
      };

      // Mock: Existing exercise with same name
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: "ex-existing" }],
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createExercise(mockSupabase, userId, command)).rejects.toThrow(ExerciseConflictError);
      await expect(createExercise(mockSupabase, userId, command)).rejects.toThrow(
        "Exercise with this name already exists"
      );
    });

    it("case-sensitive sprawdzanie nazwy (same as DB)", async () => {
      // Arrange
      const command: CreateExerciseCommand = {
        name: "Bench Press", // Exact match with DB
        type: "strength",
      };

      // Mock: Existing "Bench Press"
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: "ex-existing" }],
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(createExercise(mockSupabase, userId, command)).rejects.toThrow(ExerciseConflictError);
    });

    it("pozwala na tę samą nazwę dla różnych userów", async () => {
      // Arrange
      const command: CreateExerciseCommand = {
        name: "Common Exercise Name",
        type: "strength",
      };

      // Mock: No exercises for THIS user with this name
      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "exercises") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [], // No match for this user_id
                    error: null,
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "ex-new",
                    user_id: userId,
                    name: "Common Exercise Name",
                    type: "strength",
                    is_archived: false,
                    created_at: "2026-01-20T10:00:00Z",
                    updated_at: "2026-01-20T10:00:00Z",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await createExercise(mockSupabase, userId, command);

      // Assert
      expect(result.name).toBe("Common Exercise Name");
    });

    it("sprawdza nazwę przed insertem (race condition protection)", async () => {
      // Arrange
      const command: CreateExerciseCommand = {
        name: "Test Exercise",
        type: "strength",
      };

      const selectMock = vi.fn();
      const insertMock = vi.fn();

      // Mock to track call order
      (mockSupabase.from as any).mockReturnValue({
        select: selectMock.mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
        insert: insertMock.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "ex-new",
                user_id: userId,
                name: "Test Exercise",
                type: "strength",
                is_archived: false,
                created_at: "2026-01-20T10:00:00Z",
                updated_at: "2026-01-20T10:00:00Z",
              },
              error: null,
            }),
          }),
        }),
      });

      // Act
      await createExercise(mockSupabase, userId, command);

      // Assert - select should be called before insert
      const selectCallOrder = selectMock.mock.invocationCallOrder[0];
      const insertCallOrder = insertMock.mock.invocationCallOrder[0];
      expect(selectCallOrder).toBeLessThan(insertCallOrder);
    });
  });

  // ============================================================================
  // updateExercise - Validation
  // ============================================================================

  describe("updateExercise validation", () => {
    it("akceptuje update z unikalną nazwą", async () => {
      // Arrange
      const exerciseId = "ex-1";
      const command: UpdateExerciseCommand = {
        name: "Updated Name",
      };

      const existingExercise = {
        id: exerciseId,
        user_id: userId,
        name: "Old Name",
        type: "strength",
        is_archived: false,
      };

      // Mock Supabase
      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "exercises") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: existingExercise,
                  error: null,
                }),
                eq: vi.fn().mockReturnValue({
                  neq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [], // No conflict
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { ...existingExercise, name: "Updated Name" },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await updateExercise(mockSupabase, userId, exerciseId, command);

      // Assert
      expect(result.name).toBe("Updated Name");
    });

    it("rzuca ExerciseConflictError gdy nowa nazwa już istnieje", async () => {
      // Arrange
      const exerciseId = "ex-1";
      const command: UpdateExerciseCommand = {
        name: "Existing Name",
      };

      const existingExercise = {
        id: exerciseId,
        user_id: userId,
        name: "Old Name",
        type: "strength",
        is_archived: false,
      };

      // Mock Supabase
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: existingExercise,
              error: null,
            }),
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ id: "ex-other" }], // Conflict!
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateExercise(mockSupabase, userId, exerciseId, command)).rejects.toThrow(ExerciseConflictError);
    });

    it("rzuca NotFoundError gdy exercise nie istnieje", async () => {
      // Arrange
      const exerciseId = "non-existent";
      const command: UpdateExerciseCommand = {
        name: "New Name",
      };

      // Mock Supabase
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateExercise(mockSupabase, userId, exerciseId, command)).rejects.toThrow(NotFoundError);
      await expect(updateExercise(mockSupabase, userId, exerciseId, command)).rejects.toThrow("Exercise not found");
    });

    it("rzuca ForbiddenError gdy próbuje modyfikować system exercise", async () => {
      // Arrange
      const exerciseId = "ex-system";
      const command: UpdateExerciseCommand = {
        name: "Modified System Exercise",
      };

      const systemExercise = {
        id: exerciseId,
        user_id: null, // System exercise!
        name: "System Exercise",
        type: "strength",
        is_archived: false,
      };

      // Mock Supabase
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: systemExercise,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateExercise(mockSupabase, userId, exerciseId, command)).rejects.toThrow(ForbiddenError);
      await expect(updateExercise(mockSupabase, userId, exerciseId, command)).rejects.toThrow(
        "Cannot modify system exercise"
      );
    });

    it("rzuca NotFoundError gdy exercise należy do innego usera", async () => {
      // Arrange
      const exerciseId = "ex-other-user";
      const command: UpdateExerciseCommand = {
        name: "New Name",
      };

      const otherUserExercise = {
        id: exerciseId,
        user_id: "other-user-456", // Different user!
        name: "Other User Exercise",
        type: "strength",
        is_archived: false,
      };

      // Mock Supabase
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: otherUserExercise,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateExercise(mockSupabase, userId, exerciseId, command)).rejects.toThrow(NotFoundError);
      // Should return 404, not 403, to avoid leaking information
    });

    it("sprawdza ownership przed sprawdzaniem uniqueness", async () => {
      // Arrange
      const exerciseId = "ex-other-user";
      const command: UpdateExerciseCommand = {
        name: "New Name",
      };

      const otherUserExercise = {
        id: exerciseId,
        user_id: "other-user-456",
        name: "Other User Exercise",
        type: "strength",
        is_archived: false,
      };

      const fetchMock = vi.fn();
      const uniqueCheckMock = vi.fn();

      // Mock Supabase
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: fetchMock.mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: otherUserExercise,
              error: null,
            }),
            eq: uniqueCheckMock.mockReturnValue({
              neq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(updateExercise(mockSupabase, userId, exerciseId, command)).rejects.toThrow(NotFoundError);

      // Uniqueness check should NOT be called for other user's exercise
      expect(uniqueCheckMock).not.toHaveBeenCalled();
    });

    it("wykluwa current exercise z uniqueness check (pozwala na tę samą nazwę)", async () => {
      // Arrange
      const exerciseId = "ex-1";
      const command: UpdateExerciseCommand = {
        name: "Same Name", // Keeping the same name
      };

      const existingExercise = {
        id: exerciseId,
        user_id: userId,
        name: "Same Name",
        type: "strength",
        is_archived: false,
      };

      // Mock Supabase
      (mockSupabase.from as any).mockImplementation((table: string) => {
        if (table === "exercises") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: existingExercise,
                  error: null,
                }),
                eq: vi.fn().mockReturnValue({
                  neq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [], // No other exercise with this name (excluding self)
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: existingExercise,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Act
      const result = await updateExercise(mockSupabase, userId, exerciseId, command);

      // Assert - Should succeed
      expect(result.name).toBe("Same Name");
    });
  });

  // ============================================================================
  // Custom Error Classes
  // ============================================================================

  describe("custom error classes", () => {
    it("ExerciseConflictError ma poprawną nazwę", async () => {
      // Arrange
      const command: CreateExerciseCommand = {
        name: "Duplicate",
        type: "strength",
      };

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: "existing" }],
                error: null,
              }),
            }),
          }),
        }),
      });

      // Act & Assert
      try {
        await createExercise(mockSupabase, userId, command);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ExerciseConflictError);
        expect((error as ExerciseConflictError).name).toBe("ExerciseConflictError");
      }
    });

    it("NotFoundError ma poprawną nazwę", async () => {
      // Arrange
      const command: UpdateExerciseCommand = { name: "New" };

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Not found" },
            }),
          }),
        }),
      });

      // Act & Assert
      try {
        await updateExercise(mockSupabase, userId, "non-existent", command);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).name).toBe("NotFoundError");
      }
    });

    it("ForbiddenError ma poprawną nazwę", async () => {
      // Arrange
      const command: UpdateExerciseCommand = { name: "Modified" };
      const systemExercise = {
        id: "ex-system",
        user_id: null,
        name: "System",
        type: "strength",
        is_archived: false,
      };

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: systemExercise,
              error: null,
            }),
          }),
        }),
      });

      // Act & Assert
      try {
        await updateExercise(mockSupabase, userId, "ex-system", command);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenError);
        expect((error as ForbiddenError).name).toBe("ForbiddenError");
      }
    });

    it("wszystkie custom errors są instanceof Error", () => {
      // Arrange & Act
      const conflictError = new ExerciseConflictError("Conflict");
      const notFoundError = new NotFoundError("Not found");
      const forbiddenError = new ForbiddenError("Forbidden");

      // Assert
      expect(conflictError).toBeInstanceOf(Error);
      expect(notFoundError).toBeInstanceOf(Error);
      expect(forbiddenError).toBeInstanceOf(Error);
    });

    it("custom errors mają poprawne messages", () => {
      // Arrange & Act
      const conflictError = new ExerciseConflictError("Custom conflict message");
      const notFoundError = new NotFoundError("Custom not found message");
      const forbiddenError = new ForbiddenError("Custom forbidden message");

      // Assert
      expect(conflictError.message).toBe("Custom conflict message");
      expect(notFoundError.message).toBe("Custom not found message");
      expect(forbiddenError.message).toBe("Custom forbidden message");
    });
  });
});
