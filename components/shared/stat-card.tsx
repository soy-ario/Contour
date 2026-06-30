import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  meta?: string;
  trend?: number[];
  sparklineData?: number[];
  loading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  delta?: number;
  deltaLabel?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  meta,
  trend,
  sparklineData,
  loading = false,
  className,
  size,
  delta,
  deltaLabel = "vs last month",
}: StatCardProps) {
  if (loading) {
    return (
      <div className={cn("bg-white border border-[#ECECF4] rounded-2xl p-4 space-y-3", className)}>
        <Skeleton className="h-10 w-10 rounded-full bg-muted" />
        <Skeleton className="h-3 w-16 bg-muted" />
        <Skeleton className="h-8 w-24 bg-muted" />
      </div>
    );
  }

  const trendData = trend ?? sparklineData;

  const drawSparkline = (data: number[]) => {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    const width = 52;
    const height = 20;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    });
    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke="#F2485A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
      </svg>
    );
  };

  const hasDelta = delta !== undefined;
  const isPositive = hasDelta && delta > 0;
  const isNegative = hasDelta && delta < 0;
  const deltaValue = hasDelta
    ? Math.abs(delta) < 1 ? delta * 100 : delta
    : 0;
  const deltaText = hasDelta
    ? `${isPositive ? "▲" : isNegative ? "▼" : "—"} ${Math.abs(deltaValue).toFixed(1)}%`
    : "";

  const valueSize = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-[28px]";

  return (
    <div className={cn(
      "bg-white border border-[#ECECF4] rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative overflow-hidden",
      className
    )}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-full bg-[#FFE3E3] flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-medium text-[#6B7280] tracking-widest uppercase block leading-none">
            {label}
          </span>
          <span className={cn("font-bold text-[#111827] leading-none mt-1.5 block tracking-tight", valueSize)}>
            {value}
          </span>
          {meta && (
            <span className="text-[13px] text-[#6B7280] mt-1 block">{meta}</span>
          )}
          {hasDelta && !meta && (
            <span className={cn(
              "text-[13px] font-semibold",
              isPositive ? "text-[#F2485A]" : isNegative ? "text-rose-500" : "text-[#6B7280]"
            )}>
              {deltaText} <span className="font-normal text-[#6B7280]">{deltaLabel}</span>
            </span>
          )}
        </div>
        {trendData && trendData.length > 0 && (
          <div className="shrink-0 self-start mt-1">
            {drawSparkline(trendData)}
          </div>
        )}
      </div>
    </div>
  );
}
