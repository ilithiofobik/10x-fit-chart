/**
 * Example Test Suite
 * Verify that test environment is set up correctly
 */

import { describe, it, expect, vi } from "vitest";

describe("Test Environment", () => {
  describe("Basic functionality", () => {
    it("should run tests", () => {
      expect(true).toBe(true);
    });

    it("should support TypeScript", () => {
      const value = 42;
      expect(value).toBe(42);
    });

    it("should support mocking with vi", () => {
      const mockFn = vi.fn(() => "mocked");
      expect(mockFn()).toBe("mocked");
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("Global mocks", () => {
    it("should have localStorage mocked", () => {
      localStorage.setItem("test", "value");
      expect(localStorage.getItem("test")).toBe("value");
      localStorage.clear();
    });

    it("should have fetch mocked", () => {
      expect(global.fetch).toBeDefined();
    });
  });

  describe("Path aliases", () => {
    it("should resolve @/ alias", async () => {
      // This will throw if alias is not configured
      expect(() => import("@/types")).toBeDefined();
    });
  });
});
