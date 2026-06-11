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
        barCategoryGap="20%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E8" vertical={false} />
        {isVertical ? (
          <>
            <XAxis
              type="number"
              tick={{ fill: "#A0A0B0", fontSize: 12 }}
              axisLine={{ stroke: "#E0E0E8" }}
              tickLine={false}
            />
            <YAxis
              dataKey={xKey}
              type="category"
              tick={{ fill: "#A0A0B0", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fill: "#A0A0B0", fontSize: 12 }}
              axisLine={{ stroke: "#E0E0E8" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#A0A0B0", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            backgroundColor: "#1E1E2E",
            border: "none",
            borderRadius: "12px",
            color: "#FFFFFF",
            fontSize: 13,
            padding: "10px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}
          cursor={{ fill: "#E0E0E8", opacity: 0.3 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#6B6B80" }}
        />
        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.label}
            fill={bar.color}
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
