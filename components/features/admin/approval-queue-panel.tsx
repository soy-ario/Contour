"use client";

import * as React from "react";
import type { Platform, ContentType } from "@prisma/client";
import { PlatformIcon } from "@/components/shared/social-icons";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, Check, Loader2, Clock, Inbox } from "lucide-react";

interface PendingContentItem {
  id: string;
  title: string;
  platform: Platform;
  contentType: ContentType;
  clientBrandName: string;
  clientId: string;
  updatedAt: string | Date;
}

interface ApprovalQueuePanelProps {
  items: PendingContentItem[];
  onView: (id: string) => void;
  onApproveSuccess?: () => void;
  loading?: boolean;
}

export default function ApprovalQueuePanel({
  items,
  onView,
  onApproveSuccess,
  loading = false,
}: ApprovalQueuePanelProps) {
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [nowTime, setNowTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setNowTime(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const sortedItems = React.useMemo(() => {
    return [...items]
      .map((item) => ({
        ...item,
        daysWaiting: nowTime
          ? Math.floor(
              (nowTime - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
            )
          : null,
      }))
      .sort((a, b) => {
        const d1 = new Date(a.updatedAt).getTime();
        const d2 = new Date(b.updatedAt).getTime();
        return d1 - d2;
      });
  }, [items, nowTime]);

  const handleApprove = async (e: React.MouseEvent, item: PendingContentItem) => {
    e.stopPropagation();
    setApprovingId(item.id);
    const toastId = toast.loading(`Approving content "${item.title}"...`);

    try {
      const response = await fetch(`/api/clients/${item.clientId}/content/${item.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: "Approved via quick approval queue" }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Content approved successfully!", { id: toastId });
        if (onApproveSuccess) onApproveSuccess();
      } else {
        toast.error(result.error?.message || result.error || "Failed to approve content", { id: toastId });
      }
    } catch {
      toast.error("A network error occurred. Please try again.", { id: toastId });
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-[#E07A2F]" />
          <h3 className="text-base font-bold text-[#111827]">Content Approval Queue</h3>
        </div>
        <p className="text-[13px] text-[#6B7280] mb-4">Items awaiting client sign-off.</p>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-[#9CA3AF]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-[#E07A2F]" />
        <h3 className="text-base font-bold text-[#111827]">Content Approval Queue</h3>
      </div>
      <p className="text-[13px] text-[#6B7280] mb-4">Items awaiting client sign-off.</p>

      {sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F4F4FA] flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-[#9CA3AF]" />
          </div>
          <span className="text-sm font-bold text-[#111827]">Queue is clear</span>
          <span className="text-[12px] text-[#6B7280] mt-0.5 max-w-[180px]">
            No content items currently awaiting approval.
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item) => {
            const isApproving = approvingId === item.id;

            const daysWaiting = item.daysWaiting;

            return (
              <div
                key={item.id}
                onClick={() => onView(item.id)}
                className="h-[72px] px-3.5 border border-[#ECECF4] hover:border-[#C5F135] rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer bg-white hover:bg-[#FAFAFD]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <PlatformIcon platform={item.platform} className="w-4 h-4 shrink-0 text-[#6B7280]" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold text-[#111827] truncate">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                      {item.clientBrandName}
                      <span className="text-[#D1D5DB]">·</span>
                      {daysWaiting === null ? "..." : daysWaiting === 0 ? "Today" : `${daysWaiting}d ago`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(item.id);
                    }}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F4F4FA] transition-all"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <Button
                    size="icon-sm"
                    onClick={(e) => handleApprove(e, item)}
                    disabled={isApproving || approvingId !== null}
                    className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all flex items-center justify-center"
                  >
                    {isApproving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
