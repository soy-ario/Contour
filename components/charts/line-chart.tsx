"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LineConfig {
  key: string;
  color: string;
  label: string;
}

interface LineChartProps {
  data: Record<string, string | number>[];
  lines: LineConfig[];
  height?: number;
  xKey?: string;
}

export default function LineChart({
  data,
  lines,
  height = 300,
  xKey = "date",
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E8" vertical={false} />
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
          cursor={{ stroke: "#E0E0E8", strokeDasharray: "3 3" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#6B6B80" }}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: line.color }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
