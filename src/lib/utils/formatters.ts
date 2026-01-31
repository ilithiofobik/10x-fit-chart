/**
 * Formatters - Utility functions for formatting numbers, dates, and values
 * Used across the Dashboard view and other components
 */

import { format, isToday, isYesterday, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

/**
 * Format number with thousand separators (Polish locale)
 * Example: 125000 → "125 000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pl-PL").format(value);
}

/**
 * Format volume with unit (kg)
 * Example: 125000 → "125 000 kg"
 */
export function formatVolume(value: number): string {
  return `${formatNumber(value)} kg`;
}

/**
 * Format workout date with relative labels for today/yesterday
 * Examples:
 * - Today → "Dzisiaj"
 * - Yesterday → "Wczoraj"
 * - Other → "31 sty 2026"
 */
export function formatWorkoutDate(dateString: string): string {
  try {
    const date = parseISO(dateString);

    if (isToday(date)) return "Dzisiaj";
    if (isYesterday(date)) return "Wczoraj";

    return format(date, "d MMM yyyy", { locale: pl });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

/**
 * Format chart value with fixed decimal places
 * Example: 125.456 → "125.46"
 */
export function formatChartValue(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/**
 * Validate if string is a valid ISO date
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Format date for chart axis (short format)
 * Example: "2026-01-31" → "31 sty"
 */
export function formatChartDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "d MMM", { locale: pl });
  } catch (error) {
    console.error("Error formatting chart date:", error);
    return dateString;
  }
}

/**
 * Format date range for display
 * Example: ("2025-10-31", "2026-01-31") → "31 paź 2025 - 31 sty 2026"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return `${format(start, "d MMM yyyy", { locale: pl })} - ${format(end, "d MMM yyyy", { locale: pl })}`;
  } catch (error) {
    console.error("Error formatting date range:", error);
    return `${startDate} - ${endDate}`;
  }
}
