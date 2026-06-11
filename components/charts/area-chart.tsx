"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AreaConfig {
  key: string;
  color: string;
  label: string;
}

interface AreaChartProps {
  data: Record<string, string | number>[];
  areas: AreaConfig[];
  height?: number;
  xKey?: string;
}

export default function AreaChart({
  data,
  areas,
  height = 300,
  xKey = "date",
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          {areas.map((area) => (
            <linearGradient
              key={`gradient-${area.key}`}
              id={`gradient-${area.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="5%" stopColor={area.color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={area.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
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
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            name={area.label}
            stroke={area.color}
            strokeWidth={2}
            fill={`url(#gradient-${area.key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: area.color }}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
