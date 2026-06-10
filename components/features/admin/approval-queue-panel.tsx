"use client";

import * as React from "react";
import type { Platform, ContentType } from "@prisma/client";
import { PlatformIcon } from "@/components/shared/social-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
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

  // Sort oldest first
  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const d1 = new Date(a.updatedAt).getTime();
      const d2 = new Date(b.updatedAt).getTime();
      return d1 - d2;
    });
  }, [items]);

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
    } catch (err) {
      toast.error("A network error occurred. Please try again.", { id: toastId });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Card className="bg-card border-border/60 shadow-lg flex flex-col h-full rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border/40 py-4 px-5 shrink-0 bg-zinc-950/20">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" /> Content Approval Queue
        </CardTitle>
        <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
          Items pending client sign-off (sorted oldest first).
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 flex-1 overflow-y-auto min-h-[300px] scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-10 h-full">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500 h-full">
            <Inbox className="w-8 h-8 text-zinc-600 mb-2 shrink-0" />
            <span className="text-xs font-semibold">Queue is clear!</span>
            <span className="text-[10px] text-zinc-600 mt-1 max-w-[180px]">No content items currently awaiting approval.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => {
              const isApproving = approvingId === item.id;
              
              return (
                <div
                  key={item.id}
                  onClick={() => onView(item.id)}
                  className="p-3 bg-zinc-950/30 hover:bg-zinc-950/60 border border-border/50 hover:border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <PlatformIcon platform={item.platform} className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase leading-none mb-1">
                        {item.clientBrandName}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                        Pending since {formatDate(item.updatedAt, "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 self-end sm:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onView(item.id)}
                      className="h-7 w-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      size="icon-sm"
                      onClick={(e) => handleApprove(e, item)}
                      disabled={isApproving || approvingId !== null}
                      className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-zinc-950 transition-colors flex items-center justify-center"
                      title="Quick Approve"
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
      </CardContent>
    </Card>
  );
}
