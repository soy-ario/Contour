import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  sparklineData?: number[];
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function StatCard({
  label,
  value,
  delta,
  deltaLabel = "vs last month",
  sparklineData,
  loading = false,
  size = "md",
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("bg-card border-border", className)}>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-4 w-24 bg-muted" />
          <Skeleton className="h-8 w-36 bg-muted" />
          <Skeleton className="h-4 w-32 bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const hasDelta = delta !== undefined;
  const isPositive = hasDelta && delta > 0;
  const isNegative = hasDelta && delta < 0;
  
  // Format delta: support both fraction (0.183) and percent number (18.3)
  const deltaValue = hasDelta
    ? Math.abs(delta) < 1
      ? delta * 100
      : delta
    : 0;
  
  const deltaText = hasDelta
    ? `${isPositive ? "▲" : isNegative ? "▼" : "—"} ${Math.abs(deltaValue).toFixed(1)}%`
    : "";

  const drawSparkline = (data: number[]) => {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    const width = 80;
    const height = 24;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    });
    return (
      <svg width={width} height={height} className="overflow-visible stroke-primary drop-shadow-[0_0_4px_rgba(var(--color-primary-rgb,79,70,229),0.3)]">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
      </svg>
    );
  };

  return (
    <Card className={cn(
      "bg-card border-border hover:border-zinc-700 transition-all duration-300 shadow-sm relative overflow-hidden group hover:-translate-y-0.5",
      size === "sm" ? "p-4" : size === "lg" ? "p-8" : "p-6",
      className
    )}>
      {/* Decorative gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex flex-col justify-between h-full relative z-10 space-y-2">
        <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
          {label}
        </span>
        
        <div className="flex items-baseline justify-between">
          <span className={cn(
            "font-bold text-foreground bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent",
            size === "sm" ? "text-2xl" : size === "lg" ? "text-4xl" : "text-3xl"
          )}>
            {value}
          </span>
          {sparklineData && sparklineData.length > 0 && (
            <div className="h-6 flex items-center">
              {drawSparkline(sparklineData)}
            </div>
          )}
        </div>

        {hasDelta && (
          <div className="flex items-center space-x-2 text-xs">
            <span
              className={cn(
                "font-semibold flex items-center",
                isPositive
                  ? "text-emerald-500"
                  : isNegative
                  ? "text-rose-500"
                  : "text-muted-foreground"
              )}
            >
              {deltaText}
            </span>
            <span className="text-muted-foreground">{deltaLabel}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
