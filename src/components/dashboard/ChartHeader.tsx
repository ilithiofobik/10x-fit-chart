/**
 * ChartHeader - Header for chart section
 * Shows title and optional metric selector (for future enhancements)
 */

import type { ChartHeaderProps } from "@/types";

export function ChartHeader({ title }: ChartHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold">{title}</h2>
      {/* Metric selector can be added here in future */}
    </div>
  );
}
