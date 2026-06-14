"use client";

import * as React from "react";
import type { Platform, ContentStatus, ContentType } from "@prisma/client";
import { cn, formatDate } from "@/lib/utils";
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS, CONTENT_STATUS_LABELS } from "@/types";
import { PlatformIcon } from "@/components/shared/social-icons";
import {
  MoreHorizontal,
  BarChart3,
  FileText,
} from "lucide-react";

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

interface ContentListViewProps {
  data: ContentItem[];
  loading?: boolean;
  onViewDetails: (contentId: string) => void;
  onEdit?: (contentId: string) => void;
  onSubmitApproval?: (contentId: string) => void;
  onApprove?: (contentId: string) => void;
  onSchedule?: (contentId: string) => void;
  onDelete?: (contentId: string) => void;
  isAdmin?: boolean;
}

// ─── Status Styles ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  POSTED: { dot: "bg-[#16A34A]", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "Published" },
  SCHEDULED: { dot: "bg-[#2563EB]", bg: "bg-blue-50 text-blue-700 border-blue-200", text: "Scheduled" },
  APPROVED: { dot: "bg-[#2563EB]", bg: "bg-blue-50 text-blue-700 border-blue-200", text: "Approved" },
  DRAFT: { dot: "bg-[#F59E0B]", bg: "bg-amber-50 text-amber-700 border-amber-200", text: "Draft" },
  IDEA: { dot: "bg-[#F59E0B]", bg: "bg-amber-50 text-amber-700 border-amber-200", text: "Idea" },
  CLIENT_APPROVAL_PENDING: { dot: "bg-[#EC4899]", bg: "bg-pink-50 text-pink-700 border-pink-200", text: "Needs Review" },
  REJECTED: { dot: "bg-[#EF4444]", bg: "bg-red-50 text-red-700 border-red-200", text: "Rejected" },
};

function StatusPill({ status }: { status: ContentStatus }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold ${style.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.text}
    </span>
  );
}

// ─── Content Type Colors ─────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  REEL: { bg: "bg-purple-50", text: "text-purple-700", icon: "▶" },
  POST: { bg: "bg-blue-50", text: "text-blue-700", icon: "□" },
  STORY: { bg: "bg-orange-50", text: "text-orange-700", icon: "◎" },
  VIDEO: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "▶" },
  CAROUSEL: { bg: "bg-pink-50", text: "text-pink-700", icon: "▤" },
  THREAD: { bg: "bg-indigo-50", text: "text-indigo-700", icon: "≡" },
  SHORT: { bg: "bg-amber-50", text: "text-amber-700", icon: "▶" },
  LIVE: { bg: "bg-red-50", text: "text-red-700", icon: "●" },
};

// ─── Platform icon only (no text) ───────────────────────────────────────────

// ─── Number formatting ──────────────────────────────────────────────────────

function fmtShort(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Pagination ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

export default function ContentListView({
  data,
  loading = false,
  onViewDetails,
  onEdit,
  onSubmitApproval,
  onApprove,
  onSchedule,
  onDelete,
  isAdmin = true,
}: ContentListViewProps) {
  const [page, setPage] = React.useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pagedData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when data changes
  React.useEffect(() => { setPage(0); }, [data.length]);

  if (loading) {
    return (
      <div className="bg-white border border-[#ECECF4] rounded-[20px] overflow-hidden">
        <div className="h-14 bg-[#FAFAFC] border-b border-[#ECECF4] flex items-center px-5 gap-6">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-3 bg-gray-200 rounded" style={{ width: i === 0 ? 280 : i === 8 ? 100 : 80 }} />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 border-b border-[#F1F5F9] flex items-center px-5 gap-6 last:border-b-0">
            <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
            <div className="w-40 h-4 bg-gray-100 rounded" />
            <div className="w-8 h-8 bg-gray-100 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#ECECF4] rounded-[20px] overflow-hidden">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-[#F4F4FA] flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-[#9CA3AF]" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No content items found</h3>
          <p className="text-sm text-[#6B7280] mt-1">Create your first content item to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[20px] overflow-hidden">
      {/* ─── Table ──────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="h-14 bg-[#FAFAFC] border-b border-[#ECECF4]">
              <th className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-left px-5 py-0 w-[280px]">Content</th>
              <th className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-center px-4 py-0 w-[80px]">Platform</th>
              <th className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-left px-4 py-0 w-[110px]">Type</th>
              <th className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-left px-4 py-0 w-[150px]">Campaign</th>
              <th className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-left px-4 py-0 w-[130px]">Status</th>
              <th className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-left px-4 py-0 w-[150px]">Published / Scheduled</th>
              <th className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-right px-4 py-0 w-[110px]">Engagement</th>
              <th className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-right px-4 py-0 w-[90px]">Reach</th>
              <th className="text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider text-center px-4 py-0 w-[100px]">Actions</th>
            </tr>
          </thead>
          {/* Body */}
          <tbody>
            {pagedData.map((item, idx) => {
              const thumbnail = item.assetUrls?.[0] || null;
              const typeStyle = TYPE_STYLES[item.contentType] || TYPE_STYLES.POST;
              const hasPendingAction = item.status === "DRAFT" || item.status === "IDEA";
              const hasApproveAction = item.status === "CLIENT_APPROVAL_PENDING";
              const dateVal = item.publishDate || item.scheduledAt;
              const dateObj = dateVal ? new Date(dateVal) : null;
              const totalEngagements = item.likes + item.comments + item.shares;
              const engagementPct = item.engagementRate * 100;

              return (
                <tr
                  key={item.id}
                  className={cn(
                    "h-20 border-b border-[#F1F5F9] hover:bg-[#FAFAFC] transition-colors cursor-pointer",
                    idx === pagedData.length - 1 && "border-b-0"
                  )}
                  onClick={() => onViewDetails(item.id)}
                >
                  {/* Content */}
                  <td className="px-5 py-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-[#F4F4FA] overflow-hidden shrink-0 border border-[#ECECF4]">
                        {thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${typeStyle.bg}`}>
                            <FileText className={`w-5 h-5 ${typeStyle.text}`} />
                          </div>
                        )}
                      </div>
                      {/* Title + metadata */}
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-[#111827] block truncate">
                          {item.title}
                        </span>
                        {item.hashtags && item.hashtags.length > 0 && (
                          <span className="text-[11px] text-[#9CA3AF] block mt-0.5 truncate">
                            #{item.hashtags.slice(0, 3).join("  #")}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Platform */}
                  <td className="px-4 py-0 text-center">
                    <PlatformIcon platform={item.platform} className="w-5 h-5 mx-auto text-[#6B7280]" />
                  </td>

                  {/* Type */}
                  <td className="px-4 py-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md ${typeStyle.bg} flex items-center justify-center`}>
                        <span className={`text-[10px] font-bold ${typeStyle.text}`}>{typeStyle.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-[#6B7280]">
                        {CONTENT_TYPE_LABELS[item.contentType] || item.contentType}
                      </span>
                    </div>
                  </td>

                  {/* Campaign */}
                  <td className="px-4 py-0">
                    <span className="text-sm font-medium text-[#6B7280]">
                      {item.topic || "—"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-0">
                    <StatusPill status={item.status} />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-0">
                    {dateObj ? (
                      <div>
                        <span className="text-sm font-semibold text-[#111827] block leading-tight">
                          {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <span className="text-[12px] text-[#9CA3AF] block mt-0.5">
                          {dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-[#9CA3AF]">Unscheduled</span>
                    )}
                  </td>

                  {/* Engagement */}
                  <td className="px-4 py-0 text-right">
                    <span className="text-sm font-semibold text-[#111827] block leading-tight">
                      {engagementPct > 0 ? `${engagementPct.toFixed(1)}%` : "—"}
                    </span>
                    {totalEngagements > 0 && (
                      <span className="text-[12px] text-[#9CA3AF] block mt-0.5">
                        {fmtShort(totalEngagements)}
                      </span>
                    )}
                  </td>

                  {/* Reach */}
                  <td className="px-4 py-0 text-right">
                    <span className="text-sm font-semibold text-[#111827]">
                      {item.reach > 0 ? fmtShort(item.reach) : "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-0 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewDetails(item.id); }}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F4F4FA] transition-all"
                        title="View analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F4F4FA] transition-all"
                        title="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <div className="h-14 bg-white border-t border-[#ECECF4] flex items-center justify-between px-5">
        <span className="text-xs text-[#6B7280]">
          Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, data.length)} of {data.length} content items
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold text-[#6B7280] hover:bg-[#F4F4FA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            &lt;
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pageNum = i;
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all",
                  page === pageNum ? "bg-[#C5F135] text-[#111827]" : "text-[#6B7280] hover:bg-[#F4F4FA]"
                )}
              >
                {pageNum + 1}
              </button>
            );
          })}
          {totalPages > 5 && (
            <>
              <span className="w-8 h-8 flex items-center justify-center text-xs text-[#9CA3AF]">...</span>
              <button
                onClick={() => setPage(totalPages - 1)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all",
                  page === totalPages - 1 ? "bg-[#C5F135] text-[#111827]" : "text-[#6B7280] hover:bg-[#F4F4FA]"
                )}
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold text-[#6B7280] hover:bg-[#F4F4FA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
