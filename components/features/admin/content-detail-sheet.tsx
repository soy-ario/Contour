"use client";

import * as React from "react";
import type { Platform, ContentStatus, ContentType, ApprovalAction } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/shared/status-badge";
import { PlatformIcon } from "@/components/shared/social-icons";
import {
  Calendar,
  CircleDollarSign,
  Clock,
  Copy,
  Check,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  Package,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { CONTENT_TYPE_LABELS } from "@/types";

interface Product {
  id: string;
  name: string;
  category: string | null;
  price: number | string | null;
}

interface ApprovalEvent {
  id: string;
  action: ApprovalAction;
  comment: string | null;
  createdAt: string | Date;
  actor: {
    name: string | null;
    username: string;
    image: string | null;
  } | null;
}

interface StatusLog {
  id: string;
  fromStatus: ContentStatus | null;
  toStatus: ContentStatus;
  createdAt: string | Date;
  note: string | null;
  changer: {
    name: string | null;
    username: string;
  } | null;
}

interface ContentDetail {
  id: string;
  clientId: string;
  title: string;
  topic: string | null;
  platform: Platform;
  contentType: ContentType;
  status: ContentStatus;
  caption: string | null;
  script: string | null;
  hashtags: string[];
  assetUrls: string[];
  scheduledAt: string | null;
  publishDate: string | null;
  adSpend: number | null;
  notes: string | null;
  products: Product[];
  approvalEvents: ApprovalEvent[];
  statusLogs: StatusLog[];
  client: {
    id: string;
    brandName: string;
    logoUrl: string | null;
  };
  creator: {
    id: string;
    username: string;
  } | null;
}

interface ContentDetailSheetProps {
  contentId: string | null;
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (contentId: string) => void;
  onStateChanged?: () => void;
  isAdmin?: boolean;
}

function DetailBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-[#FAFAFD] border border-[#ECECF4] rounded-xl p-4", className)}>
      {children}
    </div>
  );
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] uppercase tracking-wider font-bold text-[#9CA3AF] block mb-1.5">{children}</span>;
}

function SectionTitle({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }> | null; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon ? <Icon className="w-3.5 h-3.5 text-[#9CA3AF]" /> : null}
      <span className="text-[10px] uppercase tracking-wider font-bold text-[#9CA3AF]">{children}</span>
    </div>
  );
}

export default function ContentDetailSheet({
  contentId,
  clientId,
  open,
  onOpenChange,
  onEdit,
  onStateChanged,
  isAdmin = true,
}: ContentDetailSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [content, setContent] = React.useState<ContentDetail | null>(null);

  const [scheduleDate, setScheduleDate] = React.useState("");
  const [showScheduleInput, setShowScheduleInput] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");
  const [notesText, setNotesText] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<"caption" | "script" | null>(null);

  const fetchContentDetail = React.useCallback(async () => {
    if (!contentId || !clientId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/content/${contentId}`);
      const result = await response.json();
      if (response.ok && result.success) {
        setContent(result.data);
        setNotesText(result.data.notes || "");
      } else {
        toast.error("Failed to load content details");
      }
    } catch {
      toast.error("An error occurred loading content details");
    } finally {
      setLoading(false);
    }
  }, [contentId, clientId]);

  React.useEffect(() => {
    if (open && contentId) {
      const timer = setTimeout(() => {
        setShowScheduleInput(false);
        setScheduleDate("");
        setCommentText("");
        fetchContentDetail();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, contentId, fetchContentDetail]);

  const copyToClipboard = (text: string | null, field: "caption" | "script") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field === "caption" ? "Caption" : "Script"} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAction = async (actionPath: string, body?: Record<string, unknown> | null, successMsg = "Operation completed") => {
    if (!contentId || !clientId) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/content/${contentId}/${actionPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(successMsg);
        fetchContentDetail();
        if (onStateChanged) onStateChanged();
      } else {
        toast.error(result.error?.message || result.error || "Operation failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!contentId || !clientId) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/content/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Notes updated successfully");
        fetchContentDetail();
      } else {
        toast.error(result.error?.message || result.error || "Failed to update notes");
      }
    } catch {
      toast.error("Network error saving notes");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await handleAction("comment", { comment: commentText }, "Comment added");
    setCommentText("");
  };

  const isDraft = content?.status === "DRAFT";
  const isPending = content?.status === "CLIENT_APPROVAL_PENDING";
  const isApproved = content?.status === "APPROVED";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto bg-white text-[#111827] p-0 flex flex-col h-full scrollbar-thin">
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-t-transparent border-[#C5F135] rounded-full animate-spin" />
          </div>
        ) : !content ? (
          <div className="flex-1 flex items-center justify-center p-6 text-[#9CA3AF] h-full">
            No content details available.
          </div>
        ) : (
          <>
            <SheetHeader className="p-6 pb-4 border-b border-[#ECECF4] bg-[#FAFAFD]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={content.platform} className="w-4 h-4 shrink-0 text-[#6B7280]" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B7280] bg-white border border-[#ECECF4] px-2 py-0.5 rounded">
                    {CONTENT_TYPE_LABELS[content.contentType]}
                  </span>
                </div>
                <StatusBadge status={content.status} size="sm" />
              </div>
              <SheetTitle className="text-lg font-bold text-[#111827] mt-2 leading-snug">
                {content.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-[#6B7280]">
                Created by @{content.creator?.username || "system"} &middot; Client:{" "}
                <span className="text-[#111827] font-semibold">{content.client.brandName}</span>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 p-6 space-y-5 overflow-y-auto">
              {/* Asset Gallery */}
              {content.assetUrls.length > 0 && (
                <div>
                  <SectionTitle icon={null}>Asset Gallery</SectionTitle>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {content.assetUrls.map((url, i) => (
                      <div
                        key={i}
                        className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#ECECF4] bg-[#FAFAFD] shrink-0 group/asset"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Asset ${i + 1}`}
                          className="w-full h-full object-cover group-hover/asset:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Topic & Budget */}
              <DetailBlock>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <DetailLabel>Topic / Concept</DetailLabel>
                    <span className="text-sm font-semibold text-[#111827] block">
                      {content.topic || "General"}
                    </span>
                  </div>
                  <div>
                    <DetailLabel>Ad Spend Allocated</DetailLabel>
                    <span className="text-sm font-semibold text-[#111827] block flex items-center gap-1.5">
                      <CircleDollarSign className="w-3.5 h-3.5 text-[#6B7280]" />
                      {content.adSpend ? formatCurrency(content.adSpend) : "$0.00"}
                    </span>
                  </div>
                </div>
              </DetailBlock>

              {/* Schedule Info */}
              {(content.scheduledAt || content.publishDate) && (
                <DetailBlock>
                  <div className="grid grid-cols-2 gap-4">
                    {content.scheduledAt && (
                      <div>
                        <DetailLabel><Calendar className="w-3 h-3 inline mr-1" />Scheduled For</DetailLabel>
                        <span className="text-sm font-semibold text-[#111827] block">
                          {formatDate(content.scheduledAt, "MMM dd, yyyy h:mm a")}
                        </span>
                      </div>
                    )}
                    {content.publishDate && (
                      <div>
                        <DetailLabel><Clock className="w-3 h-3 inline mr-1" />Published At</DetailLabel>
                        <span className="text-sm font-semibold text-[#111827] block">
                          {formatDate(content.publishDate, "MMM dd, yyyy h:mm a")}
                        </span>
                      </div>
                    )}
                  </div>
                </DetailBlock>
              )}

              {/* Caption */}
              {content.caption && (
                <DetailBlock>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#9CA3AF]">Caption / Description</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copyToClipboard(content.caption, "caption")}
                      className="text-[#9CA3AF] hover:text-[#111827] h-7 w-7"
                    >
                      {copiedField === "caption" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed select-text">
                    {content.caption}
                  </p>
                </DetailBlock>
              )}

              {/* Script */}
              {content.script && (
                <DetailBlock>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#9CA3AF]">Video Script / Notes</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copyToClipboard(content.script, "script")}
                      className="text-[#9CA3AF] hover:text-[#111827] h-7 w-7"
                    >
                      {copiedField === "script" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <div className="bg-white border border-[#ECECF4] rounded-lg p-3">
                    <p className="text-sm text-[#374151] font-mono whitespace-pre-wrap leading-relaxed select-text">
                      {content.script}
                    </p>
                  </div>
                </DetailBlock>
              )}

              {/* Hashtags */}
              {content.hashtags.length > 0 && (
                <div>
                  <SectionTitle icon={null}>Hashtags</SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {content.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs text-[#6B7280] bg-[#FAFAFD] border border-[#ECECF4] px-2.5 py-0.5 rounded-full font-medium"
                      >
                        #{tag.replace("#", "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {content.products.length > 0 && (
                <div>
                  <SectionTitle icon={Package}>Promoting Products</SectionTitle>
                  <div className="space-y-1.5">
                    {content.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-[#ECECF4] bg-[#FAFAFD] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                          <span className="font-semibold text-[#111827] truncate">{p.name}</span>
                        </div>
                        {p.price && (
                          <span className="font-semibold text-[#6B7280]">${Number(p.price).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes */}
              {isAdmin && (
                <DetailBlock>
                  <SectionTitle icon={null}>Internal Admin Notes</SectionTitle>
                  <Textarea
                    placeholder="Enter notes visible only to the agency team..."
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    className="border-[#ECECF4] bg-white text-sm placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#C5F135] min-h-[80px] rounded-xl"
                  />
                  <div className="flex justify-end pt-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={submitting}
                      className="bg-[#1E1E2E] hover:bg-[#0E0E1E] text-xs font-semibold text-white h-8 rounded-xl flex items-center gap-1.5 px-3"
                    >
                      <Save className="w-3 h-3" />
                      Save Notes
                    </Button>
                  </div>
                </DetailBlock>
              )}

              {/* Discussion Feed */}
              <div className="pt-3 border-t border-[#ECECF4] space-y-3">
                <SectionTitle icon={MessageSquare}>Discussion Feed</SectionTitle>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    placeholder="Ask a question or add feedback..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="border-[#ECECF4] bg-white text-sm placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#C5F135] rounded-xl flex-1 h-10"
                  />
                  <Button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="bg-[#1E1E2E] hover:bg-[#0E0E1E] text-xs font-semibold text-white rounded-xl shrink-0 h-10 px-4"
                  >
                    Post
                  </Button>
                </form>

                <div className="space-y-2.5">
                  {content.approvalEvents.map((evt) => {
                    const isComment = evt.action === "COMMENTED";
                    const actorName = evt.actor?.name || evt.actor?.username || "System";

                    return (
                      <div
                        key={evt.id}
                        className={cn(
                          "p-3 rounded-lg border text-xs leading-relaxed",
                          isComment
                            ? "bg-[#FAFAFD] border-[#ECECF4]"
                            : "bg-white border-[#ECECF4]"
                        )}
                      >
                        <div className="flex items-center justify-between text-[#9CA3AF] mb-1.5">
                          <span className="font-bold text-[#111827]">{actorName}</span>
                          <span className="text-[10px]">{formatDate(evt.createdAt, "MMM dd, h:mm a")}</span>
                        </div>

                        {!isComment && (
                          <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white border border-[#ECECF4] text-[#6B7280] mb-1.5">
                            {evt.action.replace(/_/g, " ")}
                          </span>
                        )}

                        {evt.comment && <p className="text-[#374151]">{evt.comment}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-[#FAFAFD] border-t border-[#ECECF4] flex flex-col gap-3 shrink-0">
              {isDraft && isAdmin && (
                <Button
                  onClick={() => handleAction("submit", undefined, "Submitted for Client Approval")}
                  disabled={submitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm h-10 flex items-center justify-center gap-1.5 rounded-xl"
                >
                  <Send className="w-4 h-4" /> Submit for Client Approval
                </Button>
              )}

              {isPending && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      const reason = prompt("Please provide feedback for this request:");
                      if (reason) handleAction("request-changes", { comment: reason }, "Changes requested");
                    }}
                    disabled={submitting}
                    variant="outline"
                    className="border-[#ECECF4] hover:bg-[#FAFAFD] text-xs font-semibold text-[#6B7280] hover:text-[#111827] h-10 flex items-center justify-center gap-1 rounded-xl"
                  >
                    <XCircle className="w-4 h-4 text-rose-400" /> Request Changes
                  </Button>
                  <Button
                    onClick={() => {
                      const comment = prompt("Add an optional approval comment (or click OK to approve):");
                      handleAction("approve", comment ? { comment } : undefined, "Approved successfully");
                    }}
                    disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-10 flex items-center justify-center gap-1 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Content
                  </Button>
                </div>
              )}

              {isApproved && isAdmin && (
                <div className="flex flex-col gap-2">
                  {!showScheduleInput ? (
                    <Button
                      onClick={() => setShowScheduleInput(true)}
                      className="w-full bg-[#1E1E2E] hover:bg-[#0E0E1E] text-white font-bold text-sm h-10 flex items-center justify-center gap-1.5 rounded-xl"
                    >
                      <Calendar className="w-4 h-4" /> Schedule Post Date
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="border-[#ECECF4] bg-white text-sm focus-visible:ring-1 focus-visible:ring-[#C5F135] rounded-xl flex-1 h-10"
                      />
                      <Button
                        onClick={() => handleAction("schedule", { scheduledDate: scheduleDate }, "Content scheduled")}
                        disabled={submitting || !scheduleDate}
                        className="bg-[#1E1E2E] hover:bg-[#0E0E1E] text-white font-bold text-xs h-10 px-4 shrink-0 rounded-xl"
                      >
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {onEdit && (isDraft || content.status === "CLIENT_APPROVAL_PENDING") && isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(content.id);
                  }}
                  className="w-full border-[#ECECF4] hover:bg-[#FAFAFD] text-[#6B7280] hover:text-[#111827] font-semibold text-xs h-9 rounded-xl"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Content Details
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
