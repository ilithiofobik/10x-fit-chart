/**
 * Formatters - Unit Tests
 * Testing utility functions for formatting numbers, dates, and values
 */

import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatVolume,
  formatWorkoutDate,
  formatChartValue,
  isValidISODate,
  formatChartDate,
  formatDateRange,
} from "./formatters";

describe("formatters", () => {
  describe("formatNumber", () => {
    it("formatuje liczby z separatorami tysięcy (PL locale)", () => {
      expect(formatNumber(1000)).toBe("1 000");
      expect(formatNumber(125000)).toBe("125 000");
      expect(formatNumber(1000000)).toBe("1 000 000");
    });

    it("obsługuje liczby zmiennoprzecinkowe", () => {
      expect(formatNumber(1234.56)).toBe("1 234,56");
      expect(formatNumber(999.99)).toBe("999,99");
    });

    it("obsługuje zero", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("obsługuje liczby ujemne", () => {
      expect(formatNumber(-1000)).toBe("-1 000");
    });

    it("obsługuje małe liczby", () => {
      expect(formatNumber(1)).toBe("1");
      expect(formatNumber(99)).toBe("99");
      expect(formatNumber(999)).toBe("999");
    });
  });

  describe("formatVolume", () => {
    it("formatuje volume z jednostką kg", () => {
      expect(formatVolume(125000)).toBe("125 000 kg");
      expect(formatVolume(800)).toBe("800 kg");
    });

    it("obsługuje zero", () => {
      expect(formatVolume(0)).toBe("0 kg");
    });

    it("obsługuje liczby zmiennoprzecinkowe", () => {
      expect(formatVolume(1234.56)).toBe("1 234,56 kg");
    });
  });

  describe("formatWorkoutDate", () => {
    it("zwraca 'Dzisiaj' dla dzisiejszej daty", () => {
      const today = new Date().toISOString().split("T")[0];
      expect(formatWorkoutDate(today)).toBe("Dzisiaj");
    });

    it("zwraca 'Wczoraj' dla wczorajszej daty", () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      expect(formatWorkoutDate(yesterday)).toBe("Wczoraj");
    });

    it("formatuje inne daty w formacie 'd MMM yyyy'", () => {
      const result = formatWorkoutDate("2026-01-31");
      expect(result).toMatch(/31 sty 2026/i);
    });

    it("obsługuje nieprawidłową datę (fallback)", () => {
      const invalid = "not-a-date";
      expect(formatWorkoutDate(invalid)).toBe(invalid);
    });
  });

  describe("formatChartValue", () => {
    it("zaokrągla do 2 miejsc po przecinku domyślnie", () => {
      expect(formatChartValue(125.456)).toBe("125.46");
      expect(formatChartValue(100.0)).toBe("100.00");
    });

    it("zaokrągla do custom liczby miejsc", () => {
      expect(formatChartValue(125.456, 0)).toBe("125");
      expect(formatChartValue(125.456, 1)).toBe("125.5");
      expect(formatChartValue(125.456, 3)).toBe("125.456");
    });

    it("obsługuje liczby całkowite", () => {
      expect(formatChartValue(100)).toBe("100.00");
      expect(formatChartValue(100, 0)).toBe("100");
    });
  });

  describe("isValidISODate", () => {
    it("waliduje poprawne daty ISO", () => {
      expect(isValidISODate("2026-01-31")).toBe(true);
      expect(isValidISODate("2026-02-01")).toBe(true);
      expect(isValidISODate("2025-12-31")).toBe(true);
    });

    it("zwraca false dla nieprawidłowych dat", () => {
      expect(isValidISODate("not-a-date")).toBe(false);
      expect(isValidISODate("2026-13-01")).toBe(false); // invalid month
      expect(isValidISODate("2026-02-30")).toBe(false); // invalid day
    });

    it("zwraca false dla pustego stringa", () => {
      expect(isValidISODate("")).toBe(false);
    });

    it("obsługuje daty z czasem", () => {
      expect(isValidISODate("2026-01-31T20:00:00Z")).toBe(true);
    });
  });

  describe("formatChartDate", () => {
    it("formatuje datę w krótkim formacie 'd MMM'", () => {
      const result = formatChartDate("2026-01-31");
      expect(result).toMatch(/31 sty/i);
    });

    it("używa polskiego locale", () => {
      const result = formatChartDate("2026-02-15");
      expect(result).toMatch(/15 lut/i);
    });

    it("obsługuje nieprawidłową datę (fallback)", () => {
      const invalid = "not-a-date";
      expect(formatChartDate(invalid)).toBe(invalid);
    });
  });

  describe("formatDateRange", () => {
    it("formatuje zakres dat w tym samym roku", () => {
      const result = formatDateRange("2026-01-01", "2026-01-31");
      expect(result).toMatch(/1 sty 2026 - 31 sty 2026/i);
    });

    it("formatuje zakres dat w różnych latach", () => {
      const result = formatDateRange("2025-12-01", "2026-01-31");
      expect(result).toMatch(/1 gru 2025 - 31 sty 2026/i);
    });

    it("obsługuje ten sam dzień", () => {
      const result = formatDateRange("2026-01-31", "2026-01-31");
      expect(result).toMatch(/31 sty 2026 - 31 sty 2026/i);
    });

    it("fallback dla nieprawidłowych dat", () => {
      const result = formatDateRange("invalid-start", "invalid-end");
      expect(result).toBe("invalid-start - invalid-end");
    });
  });
});
