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

  let color = "#F2485A";
  let textColor = "text-[#F2485A]";
  let labelText = "Good";

  if (hasScore) {
    if (clampedScore < 40) {
      color = "#ef4444";
      textColor = "text-rose-500";
      labelText = "Risk";
    } else if (clampedScore < 70) {
      color = "#E07A2F";
      textColor = "text-[#E07A2F]";
      labelText = "Fair";
    } else {
      color = "#F2485A";
      textColor = "text-[#F2485A]";
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-[#E0E0E8] fill-none"
          strokeWidth={strokeWidth}
        />
        {hasScore && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="fill-none transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        )}
      </svg>

      <div className="absolute flex flex-col items-center justify-center leading-none text-center">
        <span className={cn("font-bold tracking-tight", size < 50 ? "text-xs" : "text-sm", textColor)}>
          {hasScore ? clampedScore : "—"}
        </span>
        {size >= 64 && (
          <span className="text-[9px] font-medium text-text-secondary uppercase mt-0.5 tracking-wider">
            {labelText}
          </span>
        )}
      </div>
    </div>
  );
}
