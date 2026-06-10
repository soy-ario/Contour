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
  AlertTriangle,
  ArrowRight,
  Package,
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

  // Form states for schedule, comments, approval
  const [scheduleDate, setScheduleDate] = React.useState("");
  const [showScheduleInput, setShowScheduleInput] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");
  const [notesText, setNotesText] = React.useState("");
  const [copiedField, setCopiedField] = React.useState<"caption" | "script" | null>(null);

  // Fetch detailed content on contentId change
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto bg-zinc-950 border-l border-zinc-800 text-zinc-300 p-0 flex flex-col h-full scrollbar-thin">
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-t-transparent border-emerald-500 rounded-full animate-spin" />
          </div>
        ) : !content ? (
          <div className="flex-1 flex items-center justify-center p-6 text-zinc-500 h-full">
            No content details available.
          </div>
        ) : (
          <>
            {/* Sheet Header */}
            <SheetHeader className="p-6 pb-4 border-b border-zinc-850 bg-zinc-900/30 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PlatformIcon platform={content.platform} className="w-5 h-5 shrink-0" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded">
                    {CONTENT_TYPE_LABELS[content.contentType]}
                  </span>
                </div>
                <StatusBadge status={content.status} size="sm" />
              </div>
              <SheetTitle className="text-lg font-bold text-white mt-1 leading-snug">
                {content.title}
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-500">
                Created by @{content.creator?.username || "system"} • Client:{" "}
                <span className="text-emerald-400 font-semibold uppercase">{content.client.brandName}</span>
              </SheetDescription>
            </SheetHeader>

            {/* Content Body */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Asset Preview Carousel */}
              {content.assetUrls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Asset Gallery</span>
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin">
                    {content.assetUrls.map((url, i) => (
                      <div
                        key={i}
                        className="relative w-32 h-32 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0 group/asset"
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

              {/* Topic & Budget Details */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Topic / Concept</span>
                  <span className="text-sm font-semibold text-zinc-200 mt-1 block">
                    {content.topic || "General"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Ad Spend Allocated</span>
                  <span className="text-sm font-semibold text-emerald-400 mt-1 block flex items-center gap-1">
                    <CircleDollarSign className="w-4 h-4 shrink-0" />
                    {content.adSpend ? formatCurrency(content.adSpend) : "$0.00"}
                  </span>
                </div>
              </div>

              {/* Creative Copy & Scripts */}
              {content.caption && (
                <div className="space-y-2 bg-zinc-900/20 p-4 border border-zinc-900 rounded-xl relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Caption / Description</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copyToClipboard(content.caption, "caption")}
                      className="text-zinc-500 hover:text-white"
                    >
                      {copiedField === "caption" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed select-text">
                    {content.caption}
                  </p>
                </div>
              )}

              {content.script && (
                <div className="space-y-2 bg-zinc-900/20 p-4 border border-zinc-900 rounded-xl relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Video Script / Notes</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copyToClipboard(content.script, "script")}
                      className="text-zinc-500 hover:text-white"
                    >
                      {copiedField === "script" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed select-text text-[13px] bg-zinc-950 p-3 rounded-lg border border-zinc-850">
                    {content.script}
                  </p>
                </div>
              )}

              {/* Hashtags */}
              {content.hashtags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Hashtags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {content.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-full font-medium"
                      >
                        #{tag.replace("#", "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Products */}
              {content.products.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Promoting Products</span>
                  <div className="space-y-1.5">
                    {content.products.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-850 bg-zinc-900/20 text-xs"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <Package className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="font-semibold text-zinc-300 truncate">{p.name}</span>
                        </div>
                        {p.price && (
                          <span className="font-bold text-zinc-400">${Number(p.price).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes Editor (Visible to Admins only) */}
              {isAdmin && (
                <div className="space-y-2 bg-zinc-900/40 p-4 border border-zinc-850 rounded-xl">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Internal Admin Notes</span>
                  <Textarea
                    placeholder="Enter notes visible only to the agency team..."
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-sm placeholder:text-zinc-600 focus-visible:ring-zinc-700 min-h-[80px]"
                  />
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={submitting}
                      className="bg-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-white h-8 border border-zinc-800"
                    >
                      Save Notes
                    </Button>
                  </div>
                </div>
              )}

              {/* Collaboration Comments Thread */}
              <div className="space-y-3 pt-2 border-t border-zinc-900">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" /> Discussion Feed
                </span>

                {/* Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Input
                    placeholder="Ask a question or add feedback..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-sm focus-visible:ring-zinc-700 placeholder:text-zinc-600 flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={submitting || !commentText.trim()}
                    className="bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white border border-zinc-800 shrink-0 h-9"
                  >
                    Post
                  </Button>
                </form>

                {/* Timeline / Event Feed */}
                <div className="space-y-3 pt-2">
                  {content.approvalEvents.map((evt) => {
                    const isComment = evt.action === "COMMENTED";
                    const actorName = evt.actor?.name || evt.actor?.username || "System";
                    
                    return (
                      <div
                        key={evt.id}
                        className={cn(
                          "p-3 rounded-lg border text-xs leading-relaxed",
                          isComment
                            ? "bg-zinc-900/20 border-zinc-900"
                            : "bg-zinc-950 border-zinc-850/50"
                        )}
                      >
                        <div className="flex items-center justify-between text-zinc-500 mb-1.5">
                          <span className="font-bold text-zinc-400">{actorName}</span>
                          <span className="text-[10px]">{formatDate(evt.createdAt, "MMM dd, h:mm a")}</span>
                        </div>
                        
                        {!isComment && (
                          <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 mb-1.5">
                            {evt.action.replace(/_/g, " ")}
                          </span>
                        )}

                        {evt.comment && <p className="text-zinc-300">{evt.comment}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex flex-col gap-3 shrink-0">
              {/* Dynamic Action Buttons based on status */}
              {isDraft && isAdmin && (
                <Button
                  onClick={() => handleAction("submit", undefined, "Submitted for Client Approval")}
                  disabled={submitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-sm h-10 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
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
                    className="border-zinc-800 hover:bg-zinc-900 text-xs font-semibold text-zinc-400 hover:text-white h-10 flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Request Changes
                  </Button>
                  <Button
                    onClick={() => {
                      const comment = prompt("Add an optional approval comment (or click OK to approve):");
                      handleAction("approve", comment ? { comment } : undefined, "Approved successfully");
                    }}
                    disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs h-10 flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
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
                      className="w-full bg-blue-500 hover:bg-blue-600 text-zinc-950 font-bold text-sm h-10 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
                    >
                      <Calendar className="w-4 h-4" /> Schedule Post Date
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-zinc-700 text-zinc-200 flex-1"
                      />
                      <Button
                        onClick={() => handleAction("schedule", { scheduledDate: scheduleDate }, "Content scheduled")}
                        disabled={submitting || !scheduleDate}
                        className="bg-blue-500 hover:bg-blue-600 text-zinc-950 font-bold text-xs h-10 px-4 shrink-0 shadow-lg shadow-blue-500/10"
                      >
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Utility edit buttons */}
              {onEdit && (isDraft || content.status === "CLIENT_APPROVAL_PENDING") && isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(content.id);
                  }}
                  className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white font-semibold text-xs h-9"
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
