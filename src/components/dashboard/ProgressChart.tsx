/**
 * ProgressChart - Line chart component using Recharts
 * Displays workout progress over time
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatChartValue, formatChartDate, formatWorkoutDate } from "@/lib/utils/formatters";
import type { ProgressChartProps } from "@/types";

interface TooltipPayload {
  value: number;
  name: string;
  payload: {
    date: string;
    dateValue: string;
    label: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];

  return (
    <div className="bg-popover text-popover-foreground rounded-lg border p-3 shadow-md">
      <p className="text-sm font-medium">{data.payload.label}</p>
      <p className="text-muted-foreground mt-1 text-xs">{formatWorkoutDate(data.payload.dateValue)}</p>
      <p className="mt-2 text-lg font-bold">{formatChartValue(data.value)}</p>
    </div>
  );
}

// Custom tick formatter for X axis - formats ISO date to short format
const formatXAxisTick = (value: string) => {
  return formatChartDate(value);
};

export function ProgressChart({ data, xAxisKey, yAxisKey, lineColor = "#2563eb" }: ProgressChartProps) {
  if (data.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey={xAxisKey}
          className="text-muted-foreground text-xs"
          tick={{ fill: "currentColor" }}
          tickFormatter={formatXAxisTick}
        />
        <YAxis className="text-muted-foreground text-xs" tick={{ fill: "currentColor" }} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey={yAxisKey}
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: lineColor, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
