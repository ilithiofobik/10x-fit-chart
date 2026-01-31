/**
 * useDashboard - Custom hook for managing Dashboard data fetching and state
 */

import { useState, useEffect, useCallback } from "react";
import type { DashboardSummaryDTO } from "@/types";

const VALID_MONTHS = [1, 3, 6, 12];

/**
 * Validate if months value is valid
 */
function isValidMonths(value: number): boolean {
  return VALID_MONTHS.includes(value);
}

/**
 * Validate dashboard data structure
 */
function validateDashboardData(data: unknown): data is DashboardSummaryDTO {
  if (typeof data !== "object" || data === null) return false;

  const d = data as DashboardSummaryDTO;

  // Sprawdź strukturę
  if (!d.period || !d.summary || !Array.isArray(d.recent_workouts)) {
    return false;
  }

  // Sprawdź wartości statystyk
  if (
    typeof d.summary.total_workouts !== "number" ||
    typeof d.summary.total_sets !== "number" ||
    typeof d.summary.total_volume !== "number" ||
    typeof d.summary.unique_exercises !== "number"
  ) {
    return false;
  }

  if (d.summary.total_workouts < 0 || d.summary.total_sets < 0) {
    return false;
  }

  return true;
}

/**
 * Fetch dashboard data from API
 */
async function fetchDashboardData(months: number): Promise<DashboardSummaryDTO> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`/api/analytics/dashboard?months=${months}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        throw new Error("Unauthorized");
      }
      if (response.status >= 500) {
        throw new Error("Błąd serwera. Spróbuj ponownie później.");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Walidacja danych
    if (!validateDashboardData(data)) {
      throw new Error("Nieprawidłowy format danych z serwera");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Żądanie przekroczyło limit czasu. Spróbuj ponownie.");
      }
      if (error.message.includes("fetch")) {
        throw new Error("Brak połączenia z serwerem. Sprawdź połączenie internetowe.");
      }
    }

    throw error;
  }
}

/**
 * Custom hook for managing Dashboard state and data fetching
 */
export function useDashboard(initialMonths = 3) {
  // Validate initial months
  const validInitialMonths = isValidMonths(initialMonths) ? initialMonths : 3;

  const [data, setData] = useState<DashboardSummaryDTO | null>(null);
  const [selectedMonths, setSelectedMonths] = useState(validInitialMonths);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funkcja pobierająca dane
  const fetchData = useCallback(async (months: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchDashboardData(months);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      setError(errorMessage);
      console.error("Dashboard data fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efekt pobierający dane przy montowaniu i zmianie months
  useEffect(() => {
    fetchData(selectedMonths);
  }, [selectedMonths, fetchData]);

  // Handler zmiany okresu
  const handleMonthsChange = useCallback((months: number) => {
    if (!isValidMonths(months)) {
      console.warn(`Invalid months value: ${months}. Using default: 3`);
      setSelectedMonths(3);
      return;
    }
    setSelectedMonths(months);
  }, []);

  // Handler dla retry
  const refetch = useCallback(() => {
    fetchData(selectedMonths);
  }, [selectedMonths, fetchData]);

  return {
    data,
    selectedMonths,
    isLoading,
    error,
    onMonthsChange: handleMonthsChange,
    refetch,
  };
}
