import { cn } from "@/lib/utils";

interface HealthScoreRingProps {
  score: number | null | undefined;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function HealthScoreRing({
  score,
  size = 64,
  strokeWidth = 4,
  className,
}: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const hasScore = score !== null && score !== undefined;
  const clampedScore = hasScore ? Math.max(0, Math.min(100, score)) : 0;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let colorClass = "stroke-zinc-800 text-zinc-500";
  let textColor = "text-zinc-400";
  let labelText = "N/A";

  if (hasScore) {
    if (clampedScore < 40) {
      colorClass = "stroke-rose-500 text-rose-500";
      textColor = "text-rose-400";
      labelText = "Risk";
    } else if (clampedScore < 70) {
      colorClass = "stroke-amber-500 text-amber-500";
      textColor = "text-amber-400";
      labelText = "Fair";
    } else {
      colorClass = "stroke-emerald-500 text-emerald-500";
      textColor = "text-emerald-400";
      labelText = "Good";
    }
  }

  return (
    <div
      className={cn("relative flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 overflow-visible"
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-zinc-800 fill-none"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        {hasScore && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={cn("fill-none transition-all duration-500 ease-out", colorClass.split(" ")[0])}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Score Text in Center */}
      <div className="absolute flex flex-col items-center justify-center leading-none text-center">
        <span className={cn("font-bold tracking-tight", size < 50 ? "text-xs" : "text-sm", textColor)}>
          {hasScore ? clampedScore : "—"}
        </span>
        {size >= 64 && (
          <span className="text-[9px] font-medium text-muted-foreground uppercase mt-0.5 tracking-wider">
            {labelText}
          </span>
        )}
      </div>
    </div>
  );
}
