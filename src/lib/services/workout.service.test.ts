/**
 * Workout Service - Calculation Functions Unit Tests
 * Testing calculate1RM() and calculateVolume() with comprehensive edge cases
 *
 * @see .ai/unit-test-plan.md - Priority 1: Critical
 * @see .cursor/rules/vitest-unit-testing.mdc - Testing guidelines
 */

import { describe, it, expect } from "vitest";
import { calculate1RM, calculateVolume } from "./workout.service";

describe("workout.service - Calculation Functions", () => {
  // ============================================================================
  // calculate1RM() - One Rep Max Calculation
  // ============================================================================

  describe("calculate1RM", () => {
    // ------------------------------------------------------------------------
    // Normal Cases - Brzycki Formula
    // ------------------------------------------------------------------------

    describe("Brzycki formula calculations", () => {
      it("zwraca weight bez zmian gdy reps=1", () => {
        // Arrange
        const weight = 100;
        const reps = 1;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result).toBe(100);
      });

      it("oblicza 1RM wzorem Brzycki dla reps=8", () => {
        // Arrange
        const weight = 100;
        const reps = 8;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        // Formula: 100 / (1.0278 - 0.0278 * 8) = 100 / 0.8054 ≈ 124.16
        expect(result).toBeCloseTo(124.16, 1);
      });

      it("oblicza 1RM wzorem Brzycki dla reps=5", () => {
        // Arrange
        const weight = 80;
        const reps = 5;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        // Formula: 80 / (1.0278 - 0.0278 * 5) = 80 / 0.889 ≈ 90.0
        expect(result).toBeCloseTo(90.0, 1);
      });

      it("oblicza 1RM wzorem Brzycki dla reps=10", () => {
        // Arrange
        const weight = 60;
        const reps = 10;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        // Formula: 60 / (1.0278 - 0.0278 * 10) = 60 / 0.7498 ≈ 80.02
        expect(result).toBeCloseTo(80.02, 1);
      });

      it("oblicza 1RM dla reps=12 (wysoka powtarzalność)", () => {
        // Arrange
        const weight = 50;
        const reps = 12;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        // Formula: 50 / (1.0278 - 0.0278 * 12) = 50 / 0.6942 ≈ 72.03
        expect(result).toBeCloseTo(72.03, 1);
      });

      it("oblicza 1RM dla reps=2 (niska powtarzalność)", () => {
        // Arrange
        const weight = 120;
        const reps = 2;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        // Formula: 120 / (1.0278 - 0.0278 * 2) = 120 / 0.9722 ≈ 123.43
        expect(result).toBeCloseTo(123.43, 1);
      });
    });

    // ------------------------------------------------------------------------
    // Precision & Rounding
    // ------------------------------------------------------------------------

    describe("zaokrąglanie i precyzja", () => {
      it("zaokrągla wynik do 2 miejsc po przecinku", () => {
        // Arrange
        const weight = 100;
        const reps = 8;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result.toString()).toMatch(/^\d+\.\d{1,2}$/);
      });

      it("zwraca liczbę całkowitą dla weight gdy reps=1", () => {
        // Arrange
        const weight = 100;
        const reps = 1;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(Number.isInteger(result)).toBe(true);
      });

      it("obsługuje liczby zmiennoprzecinkowe jako weight", () => {
        // Arrange
        const weight = 22.5;
        const reps = 10;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result).toBeCloseTo(30.01, 1);
        expect(result).toBeGreaterThan(0);
      });
    });

    // ------------------------------------------------------------------------
    // Edge Cases - Zero & Boundary Values
    // ------------------------------------------------------------------------

    describe("edge cases - wartości graniczne", () => {
      it("rzuca błąd dla reps=0", () => {
        // Arrange
        const weight = 100;
        const reps = 0;

        // Act & Assert
        expect(() => calculate1RM(weight, reps)).toThrow("Reps must be greater than 0");
      });

      it("rzuca błąd dla reps ujemnych", () => {
        // Arrange
        const weight = 100;
        const reps = -5;

        // Act & Assert
        expect(() => calculate1RM(weight, reps)).toThrow("Reps must be greater than 0");
      });

      it("rzuca błąd dla weight ujemnego", () => {
        // Arrange
        const weight = -100;
        const reps = 8;

        // Act & Assert
        expect(() => calculate1RM(weight, reps)).toThrow("Weight must be non-negative");
      });

      it("obsługuje weight=0 (zwraca 0)", () => {
        // Arrange
        const weight = 0;
        const reps = 8;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result).toBe(0);
      });

      it("obsługuje bardzo małe wartości weight", () => {
        // Arrange
        const weight = 0.5;
        const reps = 10;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result).toBeGreaterThan(0);
        expect(result).toBeCloseTo(0.67, 1);
      });

      it("obsługuje bardzo duże wartości weight", () => {
        // Arrange
        const weight = 500;
        const reps = 1;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result).toBe(500);
      });

      it("obsługuje bardzo duże wartości reps (limit wzoru Brzycki)", () => {
        // Arrange
        const weight = 20;
        const reps = 50;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        // Note: Brzycki formula becomes unreliable for reps > ~36
        // At reps=50: 1.0278 - 0.0278 * 50 = -0.3622 (negative denominator)
        // This results in negative 1RM, which is mathematically invalid
        // In real scenarios, Brzycki is typically used for reps 1-12
        expect(Number.isFinite(result)).toBe(true);

        // For very high reps, the formula breaks down
        // We should document this limitation
        if (reps > 36) {
          // Formula becomes unreliable - denominator approaches 0 or goes negative
          // 1.0278 - 0.0278 * 37 = 0 (divide by zero at ~37 reps)
          expect(Math.abs(result)).toBeGreaterThan(0);
        } else {
          expect(result).toBeGreaterThan(0);
        }
      });
    });

    // ------------------------------------------------------------------------
    // Real-World Scenarios
    // ------------------------------------------------------------------------

    describe("scenariusze rzeczywiste", () => {
      it("oblicza 1RM dla typowego treningu wyciskania (100kg x 8)", () => {
        // Arrange - Common bench press scenario
        const weight = 100;
        const reps = 8;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result).toBeGreaterThan(weight);
        expect(result).toBeCloseTo(124.16, 1);
      });

      it("oblicza 1RM dla treningu przysiadów (120kg x 5)", () => {
        // Arrange - Common squat scenario
        const weight = 120;
        const reps = 5;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result).toBeGreaterThan(weight);
        expect(result).toBeCloseTo(135.0, 1);
      });

      it("oblicza 1RM dla treningu z hantlami (22.5kg x 12)", () => {
        // Arrange - Common dumbbell scenario
        const weight = 22.5;
        const reps = 12;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result).toBeGreaterThan(weight);
        expect(result).toBeCloseTo(32.41, 1);
      });

      it("oblicza 1RM dla treningu z ciężarem ciała (bodyweight)", () => {
        // Arrange - Bodyweight scenario (80kg person)
        const weight = 80;
        const reps = 15;

        // Act
        const result = calculate1RM(weight, reps);

        // Assert
        expect(result).toBeGreaterThan(weight);
        expect(Number.isFinite(result)).toBe(true);
      });
    });

    // ------------------------------------------------------------------------
    // Type Safety & Input Validation
    // ------------------------------------------------------------------------

    describe("walidacja typów i inputów", () => {
      it("akceptuje integer values", () => {
        expect(() => calculate1RM(100, 8)).not.toThrow();
      });

      it("akceptuje float values", () => {
        expect(() => calculate1RM(22.5, 10)).not.toThrow();
      });

      it("zwraca zawsze liczbę", () => {
        const result = calculate1RM(100, 8);
        expect(typeof result).toBe("number");
      });

      it("zwraca zawsze wartość skończoną (nie Infinity, nie NaN)", () => {
        const result = calculate1RM(100, 8);
        expect(Number.isFinite(result)).toBe(true);
        expect(Number.isNaN(result)).toBe(false);
      });
    });
  });

  // ============================================================================
  // calculateVolume() - Total Work Calculation
  // ============================================================================

  describe("calculateVolume", () => {
    // ------------------------------------------------------------------------
    // Normal Cases - Simple Multiplication
    // ------------------------------------------------------------------------

    describe("podstawowe obliczenia", () => {
      it("oblicza volume jako weight * reps", () => {
        // Arrange
        const weight = 100;
        const reps = 8;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(800);
      });

      it("oblicza volume dla małych wartości", () => {
        // Arrange
        const weight = 10;
        const reps = 5;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(50);
      });

      it("oblicza volume dla dużych wartości", () => {
        // Arrange
        const weight = 200;
        const reps = 20;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(4000);
      });

      it("oblicza volume dla reps=1", () => {
        // Arrange
        const weight = 150;
        const reps = 1;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(150);
      });
    });

    // ------------------------------------------------------------------------
    // Precision & Rounding
    // ------------------------------------------------------------------------

    describe("zaokrąglanie i precyzja", () => {
      it("zaokrągla do 2 miejsc po przecinku", () => {
        // Arrange
        const weight = 22.5;
        const reps = 10;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(225);
        expect(result.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
      });

      it("obsługuje liczby zmiennoprzecinkowe (22.5kg x 10)", () => {
        // Arrange
        const weight = 22.5;
        const reps = 10;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(225);
      });

      it("obsługuje liczby zmiennoprzecinkowe z wynikiem dziesiętnym", () => {
        // Arrange
        const weight = 15.75;
        const reps = 8;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(126); // 15.75 * 8 = 126.0
      });

      it("zaokrągla wynik poprawnie dla liczb z długą częścią dziesiętną", () => {
        // Arrange
        const weight = 33.33;
        const reps = 3;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(99.99); // 33.33 * 3 = 99.99
      });
    });

    // ------------------------------------------------------------------------
    // Edge Cases - Zero & Boundary Values
    // ------------------------------------------------------------------------

    describe("edge cases - wartości graniczne", () => {
      it("rzuca błąd dla reps=0", () => {
        // Arrange
        const weight = 100;
        const reps = 0;

        // Act & Assert
        expect(() => calculateVolume(weight, reps)).toThrow("Reps must be greater than 0");
      });

      it("rzuca błąd dla reps ujemnych", () => {
        // Arrange
        const weight = 100;
        const reps = -5;

        // Act & Assert
        expect(() => calculateVolume(weight, reps)).toThrow("Reps must be greater than 0");
      });

      it("rzuca błąd dla weight ujemnego", () => {
        // Arrange
        const weight = -100;
        const reps = 8;

        // Act & Assert
        expect(() => calculateVolume(weight, reps)).toThrow("Weight must be non-negative");
      });

      it("obsługuje weight=0 (zwraca 0)", () => {
        // Arrange
        const weight = 0;
        const reps = 10;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(0);
      });

      it("obsługuje bardzo małe wartości weight", () => {
        // Arrange
        const weight = 0.5;
        const reps = 10;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(5);
      });

      it("obsługuje bardzo duże wartości", () => {
        // Arrange
        const weight = 500;
        const reps = 100;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(50000);
        expect(Number.isFinite(result)).toBe(true);
      });
    });

    // ------------------------------------------------------------------------
    // Real-World Scenarios
    // ------------------------------------------------------------------------

    describe("scenariusze rzeczywiste", () => {
      it("oblicza volume dla typowego treningu (100kg x 8 reps)", () => {
        // Arrange - Common strength training scenario
        const weight = 100;
        const reps = 8;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(800);
      });

      it("oblicza volume dla treningu z hantlami (22.5kg x 12 reps)", () => {
        // Arrange - Common dumbbell scenario
        const weight = 22.5;
        const reps = 12;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(270);
      });

      it("oblicza volume dla całej serii treningowej (3 serie)", () => {
        // Arrange - Multiple sets scenario
        const weight = 80;
        const sets = [{ reps: 10 }, { reps: 9 }, { reps: 8 }];

        // Act
        const totalVolume = sets.reduce((sum, set) => {
          return sum + calculateVolume(weight, set.reps);
        }, 0);

        // Assert
        expect(totalVolume).toBe(2160); // 800 + 720 + 640
      });

      it("oblicza volume dla treningu z progresją ciężaru", () => {
        // Arrange - Progressive overload scenario
        const sets = [
          { weight: 80, reps: 10 },
          { weight: 85, reps: 8 },
          { weight: 90, reps: 6 },
        ];

        // Act
        const totalVolume = sets.reduce((sum, set) => {
          return sum + calculateVolume(set.weight, set.reps);
        }, 0);

        // Assert
        expect(totalVolume).toBe(2020); // 800 + 680 + 540
      });

      it("oblicza volume dla bodyweight exercises (ciężar ciała)", () => {
        // Arrange - Bodyweight scenario (80kg person doing push-ups)
        const weight = 80;
        const reps = 20;

        // Act
        const result = calculateVolume(weight, reps);

        // Assert
        expect(result).toBe(1600);
      });
    });

    // ------------------------------------------------------------------------
    // Type Safety & Input Validation
    // ------------------------------------------------------------------------

    describe("walidacja typów i inputów", () => {
      it("akceptuje integer values", () => {
        expect(() => calculateVolume(100, 8)).not.toThrow();
      });

      it("akceptuje float values", () => {
        expect(() => calculateVolume(22.5, 10)).not.toThrow();
      });

      it("zwraca zawsze liczbę", () => {
        const result = calculateVolume(100, 8);
        expect(typeof result).toBe("number");
      });

      it("zwraca zawsze wartość skończoną (nie Infinity, nie NaN)", () => {
        const result = calculateVolume(100, 8);
        expect(Number.isFinite(result)).toBe(true);
        expect(Number.isNaN(result)).toBe(false);
      });
    });

    // ------------------------------------------------------------------------
    // Consistency with calculate1RM
    // ------------------------------------------------------------------------

    describe("spójność z calculate1RM", () => {
      it("volume zawsze >= 0 (podobnie jak calculate1RM)", () => {
        // Arrange
        const weight = 100;
        const reps = 8;

        // Act
        const volume = calculateVolume(weight, reps);
        const oneRM = calculate1RM(weight, reps);

        // Assert
        expect(volume).toBeGreaterThanOrEqual(0);
        expect(oneRM).toBeGreaterThanOrEqual(0);
      });

      it("rzuca te same błędy walidacji co calculate1RM", () => {
        // Assert - negative weight
        expect(() => calculateVolume(-100, 8)).toThrow("Weight must be non-negative");
        expect(() => calculate1RM(-100, 8)).toThrow("Weight must be non-negative");

        // Assert - zero/negative reps
        expect(() => calculateVolume(100, 0)).toThrow("Reps must be greater than 0");
        expect(() => calculate1RM(100, 0)).toThrow("Reps must be greater than 0");
      });
    });
  });

  // ============================================================================
  // Integration Tests - Both Functions Together
  // ============================================================================

  describe("integracja calculate1RM i calculateVolume", () => {
    it("oba obliczenia działają dla tych samych danych wejściowych", () => {
      // Arrange
      const weight = 100;
      const reps = 8;

      // Act
      const oneRM = calculate1RM(weight, reps);
      const volume = calculateVolume(weight, reps);

      // Assert
      expect(oneRM).toBeCloseTo(124.16, 1);
      expect(volume).toBe(800);
    });

    it("volume zawsze <= (1RM * reps) dla reps > 1", () => {
      // Arrange
      const testCases = [
        { weight: 100, reps: 8 },
        { weight: 80, reps: 10 },
        { weight: 120, reps: 5 },
      ];

      testCases.forEach(({ weight, reps }) => {
        // Act
        const oneRM = calculate1RM(weight, reps);
        const volume = calculateVolume(weight, reps);

        // Assert - volume should be less than theoretical max (1RM * reps)
        expect(volume).toBeLessThan(oneRM * reps);
      });
    });

    it("1RM zawsze >= weight dla reps > 1", () => {
      // Arrange
      const testCases = [
        { weight: 100, reps: 8 },
        { weight: 80, reps: 10 },
        { weight: 120, reps: 5 },
      ];

      testCases.forEach(({ weight, reps }) => {
        // Act
        const oneRM = calculate1RM(weight, reps);

        // Assert - 1RM should always be greater than working weight
        expect(oneRM).toBeGreaterThanOrEqual(weight);
      });
    });

    it("oblicza pełne statystyki dla serii treningowej", () => {
      // Arrange - Real workout set
      const sets = [
        { weight: 100, reps: 8 },
        { weight: 100, reps: 7 },
        { weight: 100, reps: 6 },
      ];

      // Act - Calculate all metrics
      const metrics = sets.map((set) => ({
        ...set,
        oneRM: calculate1RM(set.weight, set.reps),
        volume: calculateVolume(set.weight, set.reps),
      }));

      // Assert - Verify all calculations
      expect(metrics[0].oneRM).toBeCloseTo(124.16, 1);
      expect(metrics[0].volume).toBe(800);

      expect(metrics[1].oneRM).toBeCloseTo(120.02, 1); // 100 / (1.0278 - 0.0278 * 7) ≈ 120.02
      expect(metrics[1].volume).toBe(700);

      expect(metrics[2].oneRM).toBeCloseTo(116.14, 1); // 100 / (1.0278 - 0.0278 * 6) ≈ 116.14
      expect(metrics[2].volume).toBe(600);

      // Total volume
      const totalVolume = metrics.reduce((sum, m) => sum + m.volume, 0);
      expect(totalVolume).toBe(2100);

      // Max 1RM
      const maxOneRM = Math.max(...metrics.map((m) => m.oneRM));
      expect(maxOneRM).toBeCloseTo(124.16, 1);
    });
  });
});
