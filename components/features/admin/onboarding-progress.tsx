import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { ClientStatus } from "@prisma/client";

interface OnboardingProgressProps {
  status: ClientStatus;
  socialCount: number;
  productCount: number;
  className?: string;
}

export default function OnboardingProgress({
  status,
  socialCount,
  productCount,
  className,
}: OnboardingProgressProps) {
  // Ordered status hierarchy
  const statusOrder: ClientStatus[] = [
    "LEAD",
    "DISCOVERY",
    "PROPOSAL_SENT",
    "CONTRACT_SIGNED",
    "SETUP",
    "DASHBOARD_READY",
    "ACTIVE",
  ];

  const currentStatusIndex = statusOrder.indexOf(status);

  // The 8 steps to render
  const steps = [
    { label: "Lead", isCompleted: currentStatusIndex > 0 },
    { label: "Discovery", isCompleted: currentStatusIndex > 1 },
    { label: "Proposal Sent", isCompleted: currentStatusIndex > 2 },
    { label: "Contract Signed", isCompleted: currentStatusIndex > 3 },
    {
      label: "Social Link",
      isCompleted:
        currentStatusIndex > 4 || (status === "SETUP" && socialCount > 0),
    },
    {
      label: "Products Added",
      isCompleted:
        currentStatusIndex > 4 || (status === "SETUP" && socialCount > 0 && productCount > 0),
    },
    { label: "Dashboard Ready", isCompleted: currentStatusIndex > 4 && status !== "SETUP" },
    { label: "Active", isCompleted: status === "ACTIVE" },
  ];

  // Determine current active step (first step that is not completed)
  let activeIndex = steps.findIndex((step) => !step.isCompleted);
  if (activeIndex === -1) {
    if (status === "ACTIVE") activeIndex = 7;
    else activeIndex = 0;
  }
  if (status === "PAUSED" || status === "ARCHIVED") {
    // Just show all onboarding steps completed if active previously
    activeIndex = -1;
  }

  return (
    <div className={cn("w-full bg-card border border-border/50 rounded-xl p-6 shadow-sm", className)}>
      <h3 className="text-sm font-semibold text-foreground mb-6">Onboarding Progress</h3>
      
      {/* Stepper Container */}
      <div className="relative flex items-center justify-between w-full">
        {/* Connection line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800 z-0" />
        
        {/* Active connection line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 ease-in-out z-0"
          style={{
            width: `${(Math.max(0, activeIndex) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = step.isCompleted;
          const isActive = idx === activeIndex;

          return (
            <div key={idx} className="flex flex-col items-center relative z-10">
              {/* Step circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                    : isActive
                    ? "bg-zinc-950 border-primary text-primary"
                    : "bg-zinc-950 border-zinc-800 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <span className="text-xs font-semibold">{idx + 1}</span>
                )}
              </div>

              {/* Step label */}
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-medium mt-2 text-center whitespace-nowrap hidden sm:inline-block",
                  isCompleted
                    ? "text-foreground font-semibold"
                    : isActive
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
