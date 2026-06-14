"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import type { Platform, ContentStatus, ContentType } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ContentListView from "@/components/features/admin/content-list-view";
import ContentCalendarView from "@/components/features/admin/content-calendar-view";
import ContentDetailSheet from "@/components/features/admin/content-detail-sheet";
import CreateContentSheet from "@/components/features/admin/create-content-sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  List,
  CalendarDays,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  FileEdit,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { PLATFORM_LABELS, CONTENT_STATUS_LABELS } from "@/types";

interface ContentItem {
  id: string;
  title: string;
  topic: string;
  platform: Platform;
  contentType: ContentType;
  status: ContentStatus;
  hashtags: string[];
  scheduledAt: string | null;
  publishDate: string | null;
  adSpend: number | null;
  clientBrandName?: string;
  clientId: string;
  assetUrls: string[];
  updatedAt: string;
  views: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

interface StatusSummary {
  total: number;
  published: number;
  publishedPct: number;
  scheduled: number;
  scheduledPct: number;
  drafts: number;
  draftsPct: number;
  needsReview: number;
  needsReviewPct: number;
}

interface ClientOption {
  id: string;
  brandName: string;
}

interface ContentPageContentProps {
  initialContents: ContentItem[];
  statusSummary?: StatusSummary;
  clientId?: string | null;
  clients?: ClientOption[];
  pendingContents?: ContentItem[];
  user: {
    name: string;
    email: string;
    username: string;
  };
}

const STATUS_SUMMARY_CARDS = [
  { key: "total", label: "Total Content", icon: FileText, value: (s: StatusSummary) => s.total, subtext: (s: StatusSummary) => `↑ ${s.published + s.scheduled} active` },
  { key: "published", label: "Published", icon: CheckCircle2, value: (s: StatusSummary) => s.published, subtext: (s: StatusSummary) => `${s.publishedPct.toFixed(1)}% of total` },
  { key: "scheduled", label: "Scheduled", icon: Clock, value: (s: StatusSummary) => s.scheduled, subtext: (s: StatusSummary) => `${s.scheduledPct.toFixed(1)}% of total` },
  { key: "drafts", label: "Drafts", icon: FileEdit, value: (s: StatusSummary) => s.drafts, subtext: (s: StatusSummary) => `${s.draftsPct.toFixed(1)}% of total` },
  { key: "needsReview", label: "Needs Review", icon: AlertCircle, value: (s: StatusSummary) => s.needsReview, subtext: (s: StatusSummary) => `${s.needsReviewPct.toFixed(1)}% of total` },
];

export default function ContentPageContent({
  initialContents,
  statusSummary,
  clientId = null,
  clients = [],
  pendingContents = [],
  user,
}: ContentPageContentProps) {
  const router = useRouter();

  const [view, setView] = useQueryState("view", { defaultValue: "list" });
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [filterClient, setFilterClient] = useQueryState("filterClient", { defaultValue: "all" });
  const [filterPlatform, setFilterPlatform] = useQueryState("filterPlatform", { defaultValue: "all" });
  const [filterStatus, setFilterStatus] = useQueryState("filterStatus", { defaultValue: "all" });
  const [filterType, setFilterType] = useQueryState("filterType", { defaultValue: "all" });

  const activeClientId = clientId || (filterClient !== "all" ? filterClient : null);
  const summary: StatusSummary = statusSummary || {
    total: initialContents.length,
    published: initialContents.filter(c => c.status === "POSTED").length,
    publishedPct: 0,
    scheduled: initialContents.filter(c => c.status === "SCHEDULED" || c.status === "APPROVED").length,
    scheduledPct: 0,
    drafts: initialContents.filter(c => c.status === "DRAFT" || c.status === "IDEA").length,
    draftsPct: 0,
    needsReview: initialContents.filter(c => c.status === "CLIENT_APPROVAL_PENDING").length,
    needsReviewPct: 0,
  };

  const [selectedContentId, setSelectedContentId] = React.useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [createSheetOpen, setCreateSheetOpen] = React.useState(false);
  const [editContentId, setEditContentId] = React.useState<string | null>(null);

  const handleViewDetails = (id: string) => {
    setSelectedContentId(id);
    setIsDetailOpen(true);
  };

  const handleEditContent = (id: string) => {
    setEditContentId(id);
    setCreateSheetOpen(true);
  };

  const handleCreateContent = () => {
    setEditContentId(null);
    setCreateSheetOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content item? This action is permanent.")) {
      return;
    }
    const toastId = toast.loading("Deleting content...");
    try {
      const targetContent = initialContents.find((c) => c.id === id);
      if (!targetContent) return;

      const response = await fetch(`/api/clients/${targetContent.clientId}/content/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Content deleted successfully!", { id: toastId });
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to delete content", { id: toastId });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  const handleApprove = async (id: string) => {
    const targetContent = initialContents.find((c) => c.id === id);
    if (!targetContent) return;

    const toastId = toast.loading("Approving content...");
    try {
      const response = await fetch(`/api/clients/${targetContent.clientId}/content/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: "Approved from content list" }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Content approved successfully!", { id: toastId });
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to approve content", { id: toastId });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  const handleSubmitApproval = async (id: string) => {
    const targetContent = initialContents.find((c) => c.id === id);
    if (!targetContent) return;

    const toastId = toast.loading("Submitting content for approval...");
    try {
      const response = await fetch(`/api/clients/${targetContent.clientId}/content/${id}/submit`, {
        method: "POST",
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Content submitted successfully!", { id: toastId });
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to submit content", { id: toastId });
      }
    } catch {
      toast.error("Network error. Please try again.", { id: toastId });
    }
  };

  return (
    <>
      {/* ─── Page Canvas ─────────────────────────────────────────────────── */}
      <div className="bg-[#F6F7FB] min-h-0">
        <div className="mx-auto w-full max-w-[1600px] px-6 py-5 space-y-4">

          {/* ─── Top Toolbar ──────────────────────────────────────────────── */}
          <div className="h-[72px] bg-white border border-[#ECECF4] rounded-[20px] px-6 flex items-center justify-between">
            {/* Left: Filters */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-[320px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                <input
                  placeholder="Search titles, concepts, hashtags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-[14px] border border-[#E5E7EB] text-sm text-[#111827] placeholder:text-[#9CA3AF] bg-white focus:outline-none focus:ring-2 focus:ring-[#C5F135]/40 focus:border-transparent transition-all"
                />
              </div>

              {/* Client Filter (global mode) */}
              {!clientId && (
                <Select value={filterClient} onValueChange={(val) => setFilterClient(val)}>
                  <SelectTrigger className="w-[180px] h-11 rounded-[14px] border border-[#E5E7EB] text-sm text-[#111827] bg-white focus:ring-[#C5F135]/40 px-3.5">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.brandName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Platform Filter */}
              <Select value={filterPlatform} onValueChange={(val) => setFilterPlatform(val)}>
                <SelectTrigger className="w-[220px] h-11 rounded-[14px] border border-[#E5E7EB] text-sm text-[#111827] bg-white focus:ring-[#C5F135]/40 px-3.5">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
                  <SelectItem value="all">All Platforms</SelectItem>
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Content Type Filter */}
              <Select value={filterType} onValueChange={(val) => setFilterType(val)}>
                <SelectTrigger className="w-[220px] h-11 rounded-[14px] border border-[#E5E7EB] text-sm text-[#111827] bg-white focus:ring-[#C5F135]/40 px-3.5">
                  <SelectValue placeholder="All Content Types" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
                  <SelectItem value="all">All Content Types</SelectItem>
                  {["REEL", "POST", "STORY", "VIDEO", "CAROUSEL", "THREAD", "SHORT", "LIVE"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val)}>
                <SelectTrigger className="w-[180px] h-11 rounded-[14px] border border-[#E5E7EB] text-sm text-[#111827] bg-white focus:ring-[#C5F135]/40 px-3.5">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(CONTENT_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Right: View Switcher + Create */}
            <div className="flex items-center gap-3">
              {/* View Switcher */}
              <div className="w-[140px] h-10 rounded-lg border border-[#ECECF4] p-0.5 bg-white flex items-center">
                <button
                  onClick={() => setView("list")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-full rounded-md text-xs font-medium transition-all",
                    view === "list" ? "bg-[#F2F8D7] text-[#111827]" : "text-[#9CA3AF] hover:text-[#6B7280]"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  List
                </button>
                <button
                  onClick={() => setView("calendar")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-full rounded-md text-xs font-medium transition-all",
                    view === "calendar" ? "bg-[#F2F8D7] text-[#111827]" : "text-[#9CA3AF] hover:text-[#6B7280]"
                  )}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Calendar
                </button>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateContent}
                className="h-11 px-5 rounded-[14px] bg-[#C5F135] hover:bg-[#B8E620] active:bg-[#8FBF00] text-[#111827] text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Content
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ─── Status Summary Row ────────────────────────────────────────── */}
          <div className="grid grid-cols-5 gap-4">
            {STATUS_SUMMARY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="bg-white border border-[#ECECF4] rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#F2F8D7] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-xs font-medium text-gray-500 truncate">{card.label}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[32px] font-black text-[#111827] leading-none tracking-tight mt-1">
                      {card.value(summary)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-xs font-bold text-[#16A34A]">
                        {card.subtext(summary)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Content Table / Calendar ─────────────────────────────────── */}
          {view === "list" ? (
            <ContentListView
              data={initialContents}
              onViewDetails={handleViewDetails}
              onEdit={handleEditContent}
              onSubmitApproval={handleSubmitApproval}
              onApprove={handleApprove}
              onDelete={handleDelete}
              onSchedule={handleViewDetails}
            />
          ) : (
            <ContentCalendarView
              data={initialContents}
              onViewDetails={handleViewDetails}
              onCreateContent={handleCreateContent}
            />
          )}
        </div>
      </div>

      {/* ─── Sheets ───────────────────────────────────────────────────────── */}
      <ContentDetailSheet
        contentId={selectedContentId}
        clientId={
          selectedContentId
            ? initialContents.find((c) => c.id === selectedContentId)?.clientId || clientId
            : clientId
        }
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleEditContent}
        onStateChanged={handleSuccess}
      />

      <CreateContentSheet
        clientId={clientId || activeClientId}
        contentIdToEdit={editContentId}
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
