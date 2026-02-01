/**
 * Auth Guards - Unit Tests
 * Testing authentication utilities for API route protection
 *
 * @see .ai/unit-test-plan.md - Priority 2: High
 * @see .cursor/rules/vitest-unit-testing.mdc - Testing guidelines
 */

import { describe, it, expect } from "vitest";
import { requireAuth, isAuthenticated, getUser } from "./auth-guards";
import type { User } from "@supabase/supabase-js";

describe("auth-guards", () => {
  // ============================================================================
  // Test Helpers
  // ============================================================================

  const createMockUser = (overrides?: Partial<User>): User => ({
    id: "user-123",
    aud: "authenticated",
    role: "authenticated",
    email: "test@example.com",
    email_confirmed_at: "2026-01-01T00:00:00Z",
    phone: null,
    confirmed_at: "2026-01-01T00:00:00Z",
    last_sign_in_at: "2026-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    is_anonymous: false,
    ...overrides,
  });

  const createLocals = (user: User | null | undefined): App.Locals => ({
    user,
    supabase: {} as any, // Not used in auth-guards
  });

  // ============================================================================
  // requireAuth()
  // ============================================================================

  describe("requireAuth", () => {
    it("zwraca usera gdy jest zalogowany", () => {
      // Arrange
      const user = createMockUser();
      const locals = createLocals(user);

      // Act
      const result = requireAuth(locals);

      // Assert
      expect(result).toBe(user);
      expect(result.id).toBe("user-123");
      expect(result.email).toBe("test@example.com");
    });

    it("rzuca Response 401 gdy user = null", () => {
      // Arrange
      const locals = createLocals(null);

      // Act & Assert
      expect(() => requireAuth(locals)).toThrow(Response);

      try {
        requireAuth(locals);
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        const response = error as Response;
        expect(response.status).toBe(401);
      }
    });

    it("rzuca Response 401 gdy user = undefined", () => {
      // Arrange
      const locals = createLocals(undefined);

      // Act & Assert
      expect(() => requireAuth(locals)).toThrow(Response);

      try {
        requireAuth(locals);
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        const response = error as Response;
        expect(response.status).toBe(401);
      }
    });

    it("Response zawiera JSON z error message", async () => {
      // Arrange
      const locals = createLocals(null);

      // Act & Assert
      try {
        requireAuth(locals);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        const response = error as Response;
        const text = await response.text();
        const json = JSON.parse(text);

        expect(json).toEqual({ error: "Unauthorized" });
        expect(json.error).toBe("Unauthorized");
      }
    });

    it("Response ma poprawne headers (Content-Type: application/json)", () => {
      // Arrange
      const locals = createLocals(null);

      // Act & Assert
      try {
        requireAuth(locals);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        const response = error as Response;
        const contentType = response.headers.get("Content-Type");

        expect(contentType).toBe("application/json");
      }
    });

    it("zwraca tego samego usera (referential equality)", () => {
      // Arrange
      const user = createMockUser();
      const locals = createLocals(user);

      // Act
      const result1 = requireAuth(locals);
      const result2 = requireAuth(locals);

      // Assert
      expect(result1).toBe(user);
      expect(result2).toBe(user);
      expect(result1).toBe(result2);
    });

    it("nie modyfikuje user object", () => {
      // Arrange
      const user = createMockUser();
      const originalUser = { ...user };
      const locals = createLocals(user);

      // Act
      requireAuth(locals);

      // Assert
      expect(user).toEqual(originalUser);
    });
  });

  // ============================================================================
  // isAuthenticated()
  // ============================================================================

  describe("isAuthenticated", () => {
    it("zwraca true gdy user istnieje", () => {
      // Arrange
      const user = createMockUser();
      const locals = createLocals(user);

      // Act
      const result = isAuthenticated(locals);

      // Assert
      expect(result).toBe(true);
    });

    it("zwraca false gdy user = null", () => {
      // Arrange
      const locals = createLocals(null);

      // Act
      const result = isAuthenticated(locals);

      // Assert
      expect(result).toBe(false);
    });

    it("zwraca false gdy user = undefined", () => {
      // Arrange
      const locals = createLocals(undefined);

      // Act
      const result = isAuthenticated(locals);

      // Assert
      expect(result).toBe(false);
    });

    it("zwraca boolean type", () => {
      // Arrange
      const userLocals = createLocals(createMockUser());
      const nullLocals = createLocals(null);

      // Act
      const result1 = isAuthenticated(userLocals);
      const result2 = isAuthenticated(nullLocals);

      // Assert
      expect(typeof result1).toBe("boolean");
      expect(typeof result2).toBe("boolean");
    });

    it("nie rzuca wyjątków", () => {
      // Arrange
      const localsWithUser = createLocals(createMockUser());
      const localsWithNull = createLocals(null);
      const localsWithUndefined = createLocals(undefined);

      // Act & Assert
      expect(() => isAuthenticated(localsWithUser)).not.toThrow();
      expect(() => isAuthenticated(localsWithNull)).not.toThrow();
      expect(() => isAuthenticated(localsWithUndefined)).not.toThrow();
    });

    it("jest spójny z requireAuth (nie rzuca gdy true)", () => {
      // Arrange
      const user = createMockUser();
      const locals = createLocals(user);

      // Act
      const authenticated = isAuthenticated(locals);

      // Assert
      if (authenticated) {
        expect(() => requireAuth(locals)).not.toThrow();
        expect(requireAuth(locals)).toBe(user);
      }
    });

    it("jest spójny z requireAuth (rzuca gdy false)", () => {
      // Arrange
      const locals = createLocals(null);

      // Act
      const authenticated = isAuthenticated(locals);

      // Assert
      if (!authenticated) {
        expect(() => requireAuth(locals)).toThrow(Response);
      }
    });
  });

  // ============================================================================
  // getUser()
  // ============================================================================

  describe("getUser", () => {
    it("zwraca user gdy istnieje", () => {
      // Arrange
      const user = createMockUser();
      const locals = createLocals(user);

      // Act
      const result = getUser(locals);

      // Assert
      expect(result).toBe(user);
      expect(result?.id).toBe("user-123");
      expect(result?.email).toBe("test@example.com");
    });

    it("zwraca null gdy user = null", () => {
      // Arrange
      const locals = createLocals(null);

      // Act
      const result = getUser(locals);

      // Assert
      expect(result).toBeNull();
    });

    it("zwraca null gdy user = undefined", () => {
      // Arrange
      const locals = createLocals(undefined);

      // Act
      const result = getUser(locals);

      // Assert
      expect(result).toBeNull();
    });

    it("nie rzuca wyjątków", () => {
      // Arrange
      const localsWithUser = createLocals(createMockUser());
      const localsWithNull = createLocals(null);
      const localsWithUndefined = createLocals(undefined);

      // Act & Assert
      expect(() => getUser(localsWithUser)).not.toThrow();
      expect(() => getUser(localsWithNull)).not.toThrow();
      expect(() => getUser(localsWithUndefined)).not.toThrow();
    });

    it("zwraca User | null type", () => {
      // Arrange
      const userLocals = createLocals(createMockUser());
      const nullLocals = createLocals(null);

      // Act
      const result1 = getUser(userLocals);
      const result2 = getUser(nullLocals);

      // Assert
      // TypeScript should allow this
      const userOrNull1: User | null = result1;
      const userOrNull2: User | null = result2;

      expect(userOrNull1).not.toBeUndefined();
      expect(userOrNull2).not.toBeUndefined();
    });

    it("zwraca tego samego usera (referential equality)", () => {
      // Arrange
      const user = createMockUser();
      const locals = createLocals(user);

      // Act
      const result1 = getUser(locals);
      const result2 = getUser(locals);

      // Assert
      expect(result1).toBe(user);
      expect(result2).toBe(user);
      expect(result1).toBe(result2);
    });

    it("jest spójny z isAuthenticated", () => {
      // Arrange
      const userLocals = createLocals(createMockUser());
      const nullLocals = createLocals(null);

      // Act
      const user = getUser(userLocals);
      const noUser = getUser(nullLocals);

      // Assert
      expect(isAuthenticated(userLocals)).toBe(user !== null);
      expect(isAuthenticated(nullLocals)).toBe(noUser !== null);
    });

    it("nie modyfikuje user object", () => {
      // Arrange
      const user = createMockUser();
      const originalUser = { ...user };
      const locals = createLocals(user);

      // Act
      getUser(locals);

      // Assert
      expect(user).toEqual(originalUser);
    });
  });

  // ============================================================================
  // Integration & Edge Cases
  // ============================================================================

  describe("integration & edge cases", () => {
    it("wszystkie funkcje działają spójnie dla authenticated user", () => {
      // Arrange
      const user = createMockUser();
      const locals = createLocals(user);

      // Act & Assert
      expect(isAuthenticated(locals)).toBe(true);
      expect(getUser(locals)).toBe(user);
      expect(() => requireAuth(locals)).not.toThrow();
      expect(requireAuth(locals)).toBe(user);
    });

    it("wszystkie funkcje działają spójnie dla unauthenticated user", () => {
      // Arrange
      const locals = createLocals(null);

      // Act & Assert
      expect(isAuthenticated(locals)).toBe(false);
      expect(getUser(locals)).toBeNull();
      expect(() => requireAuth(locals)).toThrow(Response);
    });

    it("obsługuje user z minimalnymi danymi", () => {
      // Arrange
      const minimalUser = createMockUser({
        email: undefined,
        phone: null,
        user_metadata: {},
      });
      const locals = createLocals(minimalUser);

      // Act & Assert
      expect(isAuthenticated(locals)).toBe(true);
      expect(getUser(locals)).toBe(minimalUser);
      expect(requireAuth(locals)).toBe(minimalUser);
    });

    it("obsługuje user z dodatkowymi polami", () => {
      // Arrange
      const userWithMetadata = createMockUser({
        user_metadata: {
          full_name: "Test User",
          avatar_url: "https://example.com/avatar.jpg",
        },
        app_metadata: {
          provider: "email",
          role: "user",
        },
      });
      const locals = createLocals(userWithMetadata);

      // Act & Assert
      expect(requireAuth(locals)).toBe(userWithMetadata);
      expect(requireAuth(locals).user_metadata?.full_name).toBe("Test User");
    });

    it("Response z requireAuth jest natychmiast throwable", () => {
      // Arrange
      const locals = createLocals(null);

      // Act
      let thrownError: unknown = null;
      try {
        requireAuth(locals);
      } catch (error) {
        thrownError = error;
      }

      // Assert
      expect(thrownError).toBeInstanceOf(Response);
      expect((thrownError as Response).status).toBe(401);
    });

    it("Response z requireAuth może być używany w API routes", async () => {
      // Arrange
      const locals = createLocals(null);

      // Act
      let response: Response | null = null;
      try {
        requireAuth(locals);
      } catch (error) {
        response = error as Response;
      }

      // Assert
      expect(response).not.toBeNull();
      expect(response?.status).toBe(401);

      const body = await response?.json();
      expect(body).toEqual({ error: "Unauthorized" });
    });
  });

  // ============================================================================
  // Type Safety
  // ============================================================================

  describe("type safety", () => {
    it("requireAuth zwraca non-nullable User type", () => {
      // Arrange
      const user = createMockUser();
      const locals = createLocals(user);

      // Act
      const result = requireAuth(locals);

      // Assert - TypeScript compilation check
      const userId: string = result.id; // Should not error
      const email: string | undefined = result.email; // Should not error

      expect(userId).toBeDefined();
      expect(email).toBeDefined();
    });

    it("isAuthenticated zwraca boolean", () => {
      // Arrange
      const locals = createLocals(createMockUser());

      // Act
      const result = isAuthenticated(locals);

      // Assert - TypeScript compilation check
      const bool: boolean = result;
      expect(typeof bool).toBe("boolean");
    });

    it("getUser zwraca nullable User type", () => {
      // Arrange
      const userLocals = createLocals(createMockUser());
      const nullLocals = createLocals(null);

      // Act
      const result1 = getUser(userLocals);
      const result2 = getUser(nullLocals);

      // Assert - TypeScript compilation check
      const user1: User | null = result1;
      const user2: User | null = result2;

      // Optional chaining should work
      expect(user1?.id).toBeDefined();
      expect(user2?.id).toBeUndefined();
    });
  });
});
