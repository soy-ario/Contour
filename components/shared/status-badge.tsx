import { cn } from "@/lib/utils";
import { Archive, Minus } from "lucide-react";

type StatusValue =
  | "LEAD"
  | "DISCOVERY"
  | "PROPOSAL_SENT"
  | "CONTRACT_SIGNED"
  | "SETUP"
  | "DASHBOARD_READY"
  | "ACTIVE"
  | "PAUSED"
  | "ARCHIVED"
  | "IDEA"
  | "DRAFT"
  | "CLIENT_APPROVAL_PENDING"
  | "APPROVED"
  | "SCHEDULED"
  | "POSTED"
  | "REJECTED"
  | "INACTIVE"
  | "DISCONTINUED"
  | "PENDING"
  | "PAID"
  | "OVERDUE"
  | "PARTIAL"
  | "GENERATING"
  | "READY"
  | "FAILED";

interface StatusBadgeProps {
  status: StatusValue;
  size?: "sm" | "md";
  className?: string;
}

const statusStyles: Record<string, { bg: string; text: string; dot: string }> = {
  completed: { bg: "bg-[#EEFAF3]", text: "text-[#27AE60]", dot: "bg-[#27AE60]" },
  inprogress: { bg: "bg-[#EEF0FF]", text: "text-[#5B5EEF]", dot: "bg-[#5B5EEF]" },
  pending: { bg: "bg-[#FFF4EC]", text: "text-[#E07A2F]", dot: "bg-[#E07A2F]" },
  active: { bg: "bg-[#EEFAF3]", text: "text-[#27AE60]", dot: "bg-[#27AE60]" },
  draft: { bg: "bg-[#F5F5F5]", text: "text-[#6B6B80]", dot: "bg-[#6B6B80]" },
  error: { bg: "bg-rose-50", text: "text-rose-500", dot: "bg-rose-500" },
  muted: { bg: "bg-zinc-50", text: "text-zinc-400", dot: "bg-zinc-400" },
};

function getStatusStyle(status: StatusValue) {
  switch (status) {
    case "ACTIVE":
    case "PAID":
    case "POSTED":
    case "READY":
    case "APPROVED":
    case "SCHEDULED":
    case "DASHBOARD_READY":
      return statusStyles.completed;

    case "PENDING":
    case "PARTIAL":
    case "GENERATING":
    case "CLIENT_APPROVAL_PENDING":
    case "LEAD":
    case "DISCOVERY":
    case "PROPOSAL_SENT":
    case "CONTRACT_SIGNED":
    case "SETUP":
      return statusStyles.pending;

    case "DRAFT":
    case "IDEA":
    case "INACTIVE":
      return statusStyles.draft;

    case "REJECTED":
    case "OVERDUE":
    case "DISCONTINUED":
    case "FAILED":
      return statusStyles.error;

    case "PAUSED":
      return statusStyles.inprogress;

    case "ARCHIVED":
      return statusStyles.muted;

    default:
      return statusStyles.draft;
  }
}

export default function StatusBadge({ status, size = "sm", className }: StatusBadgeProps) {
  let label = status.replace(/_/g, " ").toLowerCase();
  label = label.replace(/\b\w/g, (char) => char.toUpperCase());
  const style = getStatusStyle(status);

  const isArchived = status === "ARCHIVED";
  const isPaused = status === "PAUSED";

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-full font-semibold tracking-wide",
        size === "sm" ? "px-2.5 py-0.5 text-[11px] h-5" : "px-3 py-1 text-xs h-6",
        style.bg,
        style.text,
        className
      )}
    >
      {isArchived ? (
        <Archive className="w-3 h-3 mr-1" />
      ) : isPaused ? (
        <Minus className="w-3 h-3 mr-1" />
      ) : (
        <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 shrink-0", style.dot)} />
      )}
      <span>{label}</span>
    </span>
  );
}
