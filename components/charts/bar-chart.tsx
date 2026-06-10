"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BarConfig {
  key: string;
  color: string;
  label: string;
}

interface BarChartProps {
  data: Record<string, string | number>[];
  bars: BarConfig[];
  height?: number;
  xKey?: string;
  layout?: "horizontal" | "vertical";
}

export default function BarChart({
  data,
  bars,
  height = 300,
  xKey = "name",
  layout = "horizontal",
}: BarChartProps) {
  const isVertical = layout === "vertical";

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey={xKey}
              type="category"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--foreground))",
            fontSize: 13,
          }}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
        />
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.label}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
