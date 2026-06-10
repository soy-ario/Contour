import { cn } from "@/lib/utils";
import { Archive, Minus } from "lucide-react";

type StatusValue =
  // ClientStatus
  | "LEAD"
  | "DISCOVERY"
  | "PROPOSAL_SENT"
  | "CONTRACT_SIGNED"
  | "SETUP"
  | "DASHBOARD_READY"
  | "ACTIVE"
  | "PAUSED"
  | "ARCHIVED"
  // ContentStatus
  | "IDEA"
  | "DRAFT"
  | "CLIENT_APPROVAL_PENDING"
  | "APPROVED"
  | "SCHEDULED"
  | "POSTED"
  | "REJECTED"
  // ProductStatus / PaymentStatus
  | "INACTIVE"
  | "DISCONTINUED"
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "PARTIAL";

interface StatusBadgeProps {
  status: StatusValue;
  size?: "sm" | "md";
  className?: string;
}

export default function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  // Define mappings
  let label = status.replace(/_/g, " ").toLowerCase();
  // Capitalize first letter of each word
  label = label.replace(/\b\w/g, (char) => char.toUpperCase());

  // Set colors based on status category
  let badgeStyle = "";
  let dotStyle = "";
  let icon: React.ReactNode = null;

  switch (status) {
    case "ACTIVE":
    case "PAID":
    case "POSTED":
      badgeStyle = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      dotStyle = "bg-emerald-400";
      break;

    case "PENDING":
    case "PARTIAL":
    case "CLIENT_APPROVAL_PENDING":
    case "LEAD":
    case "DISCOVERY":
    case "PROPOSAL_SENT":
    case "CONTRACT_SIGNED":
    case "SETUP":
      badgeStyle = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      dotStyle = "bg-amber-400";
      break;

    case "DRAFT":
    case "IDEA":
    case "INACTIVE":
      badgeStyle = "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
      dotStyle = "bg-zinc-400";
      break;

    case "APPROVED":
    case "SCHEDULED":
    case "DASHBOARD_READY":
      badgeStyle = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      dotStyle = "bg-blue-400";
      break;

    case "REJECTED":
    case "OVERDUE":
    case "DISCONTINUED":
      badgeStyle = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      dotStyle = "bg-rose-400";
      break;

    case "PAUSED":
      badgeStyle = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      icon = <Minus className="w-3.5 h-3.5 mr-1" />;
      break;

    case "ARCHIVED":
      badgeStyle = "bg-zinc-500/5 text-zinc-500 border border-zinc-500/10";
      icon = <Archive className="w-3.5 h-3.5 mr-1" />;
      break;

    default:
      badgeStyle = "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
      dotStyle = "bg-zinc-400";
  }

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-full font-medium tracking-wide uppercase",
        size === "sm" ? "px-2 py-0.5 text-[10px] h-5" : "px-2.5 py-1 text-xs h-6",
        badgeStyle,
        className
      )}
    >
      {icon}
      {!icon && dotStyle && (
        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 shrink-0", dotStyle)} />
      )}
      <span>{label}</span>
    </span>
  );
}
