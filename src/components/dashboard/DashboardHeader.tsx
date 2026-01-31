/**
 * DashboardHeader - Header for Dashboard view
 * Shows title and period selector (1, 3, 6, 12 months)
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DashboardHeaderProps } from "@/types";

const MONTHS_OPTIONS = [
  { value: 1, label: "1 miesiąc" },
  { value: 3, label: "3 miesiące" },
  { value: 6, label: "6 miesięcy" },
  { value: 12, label: "12 miesięcy" },
];

export function DashboardHeader({ selectedMonths, onMonthsChange }: DashboardHeaderProps) {
  const handleValueChange = (value: string) => {
    const months = parseInt(value, 10);
    if (!isNaN(months)) {
      onMonthsChange(months);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Okres:</span>
        <Select value={selectedMonths.toString()} onValueChange={handleValueChange}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
