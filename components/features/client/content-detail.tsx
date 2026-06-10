"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Platform, ContentStatus, ContentType, ApprovalAction } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/status-badge";
import { PlatformIcon } from "@/components/shared/social-icons";
import {
  Calendar,
  CircleDollarSign,
  Clock,
  Copy,
  Check,
  Send,
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
    toast.success(`${field === "caption" ? "Caption" : "Script"} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await approveContentAction(content.id, actionComment);
      if (res.success && res.data) {
        toast.success("Content approved successfully!");
        router.refresh();
        // Since we refresh, let's update local status too
        setContent((prev) => ({ ...prev, status: "APPROVED" }));
        setActionComment("");
      } else {
        toast.error(res.error || "Failed to approve content");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!actionComment.trim()) {
      toast.error("Feedback/Reason comment is required for requesting changes");
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
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!actionComment.trim()) {
      toast.error("Feedback/Reason comment is required for rejection");
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
    } catch (err) {
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
        // Force refresh comments list or fetch page data again
        // Here we can append to state if needed, or rely on router.refresh()
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to add comment");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = content.status === "CLIENT_APPROVAL_PENDING";

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/client/content"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to content list
        </Link>
      </div>

      {/* Header Info */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PlatformIcon platform={content.platform} className="size-5 text-foreground" />
            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded">
              {CONTENT_TYPE_LABELS[content.contentType]}
            </span>
            <StatusBadge status={content.status} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {content.title}
          </h1>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Columns (Content details) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Asset Gallery */}
          {content.assetUrls.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Asset Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin">
                  {content.assetUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-40 h-40 rounded-xl overflow-hidden border border-border bg-muted shrink-0 group/asset"
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
              </CardContent>
            </Card>
          )}

          {/* Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 border border-border rounded-xl">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Topic / Concept</span>
              <span className="text-sm font-semibold text-foreground mt-1 block">
                {content.topic || "General"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Ad Spend Allocated</span>
              <span className="text-sm font-semibold text-foreground mt-1 block flex items-center gap-1">
                <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                {content.adSpend ? formatCurrency(content.adSpend) : "$0.00"}
              </span>
            </div>
          </div>

          {/* Caption */}
          {content.caption && (
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Caption / Copy</CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => copyToClipboard(content.caption, "caption")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedField === "caption" ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed select-text">
                  {content.caption}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Video Script */}
          {content.script && (
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Video Script / Notes</CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => copyToClipboard(content.script, "script")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedField === "script" ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono whitespace-pre-wrap leading-relaxed select-text bg-muted/40 p-3 rounded-lg border border-border">
                  {content.script}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Hashtags */}
          {content.hashtags.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hashtags</span>
              <div className="flex flex-wrap gap-1.5">
                {content.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-medium"
                  >
                    #{tag.replace("#", "")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Promoting Products */}
          {content.products.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Promoting Products</span>
              <div className="space-y-1.5">
                {content.products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Package className="size-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-foreground truncate">{p.name}</span>
                    </div>
                    {p.price && (
                      <span className="font-bold text-muted-foreground">${Number(p.price).toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Actions and Chat) */}
        <div className="space-y-6">
          {/* Approval Action Card */}
          <Card className={cn("border", isPending ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card")}>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Approval Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPending ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">
                      Feedback or Note (optional for approvals, required for rejections/changes):
                    </label>
                    <Textarea
                      placeholder="Add any additional comments here..."
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      className="bg-background border-border text-sm placeholder:text-muted-foreground/60 min-h-[90px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                    >
                      <CheckCircle className="size-4" /> Approve Content
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={handleRequestChanges}
                        disabled={submitting}
                        variant="outline"
                        className="border-border hover:bg-muted text-xs font-semibold h-9 flex items-center justify-center gap-1"
                      >
                        <Clock className="size-3.5" /> Request Changes
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={submitting}
                        variant="destructive"
                        className="text-xs font-semibold h-9 flex items-center justify-center gap-1"
                      >
                        <XCircle className="size-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>Status:</span>
                    <StatusBadge status={content.status} />
                  </div>
                  {content.scheduledAt && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      Scheduled for: {new Date(content.scheduledAt).toLocaleString()}
                    </div>
                  )}
                  {content.publishDate && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      Publish date: {new Date(content.publishDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discussion Feed */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border pb-3 flex flex-row items-center gap-2 space-y-0">
              <MessageSquare className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Discussion Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Textarea
                  placeholder="Post comment to thread..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="bg-muted/40 border-border text-sm placeholder:text-muted-foreground/60 min-h-[50px] flex-1 py-2"
                />
                <Button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="bg-primary hover:bg-primary/95 text-xs font-semibold h-[50px] px-3 shrink-0"
                >
                  Post
                </Button>
              </form>

              {/* Feed Timeline */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
                {content.approvalEvents.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No comments or activity yet.</p>
                ) : (
                  content.approvalEvents.map((evt) => {
                    const isComment = evt.action === "COMMENTED";
                    const actorName = evt.actor?.name || evt.actor?.username || "System";
                    
                    return (
                      <div
                        key={evt.id}
                        className={cn(
                          "p-3 rounded-lg border text-xs leading-relaxed",
                          isComment
                            ? "bg-muted/40 border-border"
                            : "bg-background border-border/60"
                        )}
                      >
                        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                          <span className="font-bold text-foreground">{actorName}</span>
                          <span className="text-[10px]">{formatDate(evt.createdAt, "MMM dd, h:mm a")}</span>
                        </div>
                        
                        {!isComment && (
                          <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border mb-1.5">
                            {evt.action.replace(/_/g, " ")}
                          </span>
                        )}

                        {evt.comment && <p className="text-foreground">{evt.comment}</p>}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
