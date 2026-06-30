"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Platform, ContentStatus, ContentType, ApprovalAction } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/shared/status-badge";
import { InstagramIcon, FacebookIcon, LinkedinIcon, YoutubeIcon, TiktokIcon, TwitterIcon } from "@/components/shared/social-icons";
import {
  Calendar,
  CircleDollarSign,
  Clock,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  MessageSquare,
  Package,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { CONTENT_TYPE_LABELS } from "@/types";
import {
  approveContentAction,
  rejectContentAction,
  requestChangesAction,
  addCommentAction,
} from "@/lib/actions/approval.actions";

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
  createdAt: Date;
  actor: {
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
  scheduledAt: Date | null;
  publishDate: Date | null;
  adSpend: number | null;
  notes: string | null;
  products: Product[];
  approvalEvents: ApprovalEvent[];
  client: {
    id: string;
    brandName: string;
  };
}

interface ContentDetailProps {
  content: ContentDetail;
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  INSTAGRAM: InstagramIcon, FACEBOOK: FacebookIcon, LINKEDIN: LinkedinIcon,
  YOUTUBE: YoutubeIcon, TIKTOK: TiktokIcon, X: TwitterIcon,
};

export default function ContentDetailComponent({ content: initialContent }: ContentDetailProps) {
  const router = useRouter();
  const [content, setContent] = React.useState<ContentDetail>(initialContent);
  const [commentText, setCommentText] = React.useState("");
  const [actionComment, setActionComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<"caption" | "script" | null>(null);

  const copyToClipboard = (text: string | null, field: "caption" | "script") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field === "caption" ? "Caption" : "Script"} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await approveContentAction(content.id, actionComment);
      if (res.success && res.data) {
        toast.success("Content approved successfully!");
        router.refresh();
        setContent((prev) => ({ ...prev, status: "APPROVED" }));
        setActionComment("");
      } else {
        toast.error(res.error || "Failed to approve content");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!actionComment.trim()) {
      toast.error("Feedback is required for requesting changes");
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestChangesAction(content.id, actionComment);
      if (res.success && res.data) {
        toast.success("Changes requested successfully!");
        router.refresh();
        setActionComment("");
      } else {
        toast.error(res.error || "Failed to request changes");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!actionComment.trim()) {
      toast.error("Feedback is required for rejection");
      return;
    }
    setSubmitting(true);
    try {
      const res = await rejectContentAction(content.id, actionComment);
      if (res.success && res.data) {
        toast.success("Content rejected!");
        router.refresh();
        setContent((prev) => ({ ...prev, status: "REJECTED" }));
        setActionComment("");
      } else {
        toast.error(res.error || "Failed to reject content");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await addCommentAction(content.id, commentText);
      if (res.success) {
        toast.success("Comment added!");
        setCommentText("");
        router.refresh();
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to add comment");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = content.status === "CLIENT_APPROVAL_PENDING";
  const PlatformIcon = platformIcons[content.platform];

  return (
    <div className="py-8 px-8 mx-auto" style={{ maxWidth: 1200 }}>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/client/content" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to content list
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ECECF4] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              {PlatformIcon && <PlatformIcon className="w-5 h-5" />}
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] bg-[#F4F4FA] px-2 py-0.5 rounded-full">
                {CONTENT_TYPE_LABELS[content.contentType]}
              </span>
              <StatusBadge status={content.status} />
            </div>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight mt-1">{content.title}</h1>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left - Content Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* Asset Gallery */}
            {content.assetUrls.length > 0 && (
              <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-4">Asset Gallery</span>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {content.assetUrls.map((url, i) => (
                    <div key={i} className="relative w-40 h-40 rounded-xl overflow-hidden border border-[#ECECF4] bg-[#F9FAFB] shrink-0 group/asset">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Asset ${i + 1}`} className="w-full h-full object-cover group-hover/asset:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
                <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Topic / Concept</span>
                <span className="text-sm font-semibold text-[#111827] mt-1 block">{content.topic || "General"}</span>
              </div>
              <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
                <span className="text-[10px] uppercase tracking-wider text-[#6B7280] font-bold block">Ad Spend Allocated</span>
                <span className="text-sm font-semibold text-[#111827] mt-1 block flex items-center gap-1.5">
                  <CircleDollarSign className="w-4 h-4 text-emerald-500" />
                  {content.adSpend ? formatCurrency(content.adSpend) : "$0.00"}
                </span>
              </div>
            </div>

            {/* Caption */}
            {content.caption && (
              <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Caption / Copy</span>
                  <button
                    onClick={() => copyToClipboard(content.caption, "caption")}
                    className="text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    {copiedField === "caption" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm text-[#111827] whitespace-pre-wrap leading-relaxed select-text">{content.caption}</p>
              </div>
            )}

            {/* Script */}
            {content.script && (
              <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Video Script / Notes</span>
                  <button
                    onClick={() => copyToClipboard(content.script, "script")}
                    className="text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    {copiedField === "script" ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed select-text bg-[#F9FAFB] p-4 rounded-xl border border-[#ECECF4]">
                  {content.script}
                </p>
              </div>
            )}

            {/* Hashtags */}
            {content.hashtags.length > 0 && (
              <div>
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-2">Hashtags</span>
                <div className="flex flex-wrap gap-1.5">
                  {content.hashtags.map((tag, i) => (
                    <span key={i} className="text-[11px] font-semibold text-[#6B7280] bg-[#F4F4FA] px-2.5 py-1 rounded-full">
                      #{tag.replace("#", "")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Products */}
            {content.products.length > 0 && (
              <div>
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-2">Promoting Products</span>
                <div className="space-y-1.5">
                  {content.products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-[#ECECF4] bg-white">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-4 h-4 text-[#6B7280] shrink-0" />
                        <span className="text-sm font-semibold text-[#111827] truncate">{p.name}</span>
                      </div>
                      {p.price && <span className="text-sm font-bold text-[#6B7280]">${Number(p.price).toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Actions & Discussion */}
          <div className="space-y-6">
            {/* Approval Card */}
            <div className={cn("bg-white border rounded-[24px] p-6", isPending ? "border-[#F2485A]/50" : "border-[#ECECF4]")}>
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-4">Approval Actions</span>
              {isPending ? (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add feedback or a note (optional for approve, required for changes/rejection)..."
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    className="border-[#ECECF4] text-sm placeholder:text-[#9CA3AF] focus-visible:ring-[#F2485A] min-h-[90px]"
                  />
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleApprove} disabled={submitting}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10">
                      <CheckCircle className="w-4 h-4" /> Approve Content
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleRequestChanges} disabled={submitting} variant="outline"
                        className="border-[#ECECF4] hover:bg-[#F4F4FA] text-xs font-semibold h-9 rounded-xl flex items-center justify-center gap-1 text-[#111827]">
                        <Clock className="w-3.5 h-3.5" /> Request Changes
                      </Button>
                      <Button onClick={handleReject} disabled={submitting}
                        className="text-xs font-semibold h-9 rounded-xl flex items-center justify-center gap-1 bg-rose-500 hover:bg-rose-600 text-white">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[#111827]">
                    <Clock className="w-4 h-4 text-[#6B7280]" />
                    <span>Status:</span>
                    <StatusBadge status={content.status} />
                  </div>
                  {content.scheduledAt && (
                    <div className="text-xs text-[#6B7280] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Scheduled: {formatDate(content.scheduledAt, "MMM d, yyyy h:mm a")}
                    </div>
                  )}
                  {content.publishDate && (
                    <div className="text-xs text-[#6B7280] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Published: {formatDate(content.publishDate, "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Discussion Feed */}
            <div className="bg-white border border-[#ECECF4] rounded-[24px] overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[#ECECF4]">
                <MessageSquare className="w-4 h-4 text-[#6B7280]" />
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Discussion Feed</span>
              </div>
              <div className="p-6 space-y-4">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <Textarea
                    placeholder="Post comment to thread..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="border-[#ECECF4] text-sm placeholder:text-[#9CA3AF] min-h-[50px] flex-1 py-2 focus-visible:ring-[#F2485A]"
                  />
                  <Button type="submit" disabled={submitting || !commentText.trim()}
                    className="bg-[#111827] text-white hover:bg-[#1F2937] text-xs font-semibold h-[50px] px-3 shrink-0 rounded-xl">
                    Post
                  </Button>
                </form>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {content.approvalEvents.length === 0 ? (
                    <p className="text-xs text-[#6B7280] text-center py-4">No comments or activity yet.</p>
                  ) : (
                    content.approvalEvents.map((evt) => {
                      const isComment = evt.action === "COMMENTED";
                      const actorName = evt.actor?.name || evt.actor?.username || "System";
                      return (
                        <div key={evt.id} className={cn(
                          "p-3.5 rounded-xl border text-xs leading-relaxed",
                          isComment ? "bg-[#F9FAFB] border-[#ECECF4]" : "bg-white border-[#ECECF4]"
                        )}>
                          <div className="flex items-center justify-between text-[#6B7280] mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#111827]">{actorName}</span>
                              {evt.actor && <span className="text-[#9CA3AF]">·</span>}
                            </div>
                            <span className="text-[10px]">{formatDate(evt.createdAt, "MMM d, h:mm a")}</span>
                          </div>
                          {!isComment && (
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#F4F4FA] text-[#6B7280] border border-[#ECECF4] mb-1.5">
                              {evt.action.replace(/_/g, " ")}
                            </span>
                          )}
                          {evt.comment && <p className="text-[#111827]">{evt.comment}</p>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
