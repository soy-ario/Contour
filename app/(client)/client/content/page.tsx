import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import ClientContent from "@/components/features/client/client-content";

export const dynamic = "force-dynamic";

function num(v: unknown): number {
  if (v == null) return 0;
  return Number(v);
}

function delta(cur: number, prv: number): number {
  return prv > 0 ? ((cur - prv) / prv) * 100 : cur > 0 ? 100 : 0;
}

export interface ContentKpi {
  label: string;
  value: string;
  delta: number;
}

export interface ContentApprovalItem {
  id: string;
  platform: string;
  title: string;
  description: string;
  dueDate: string;
  submittedBy: string;
  thumbnail: string | null;
  contentType: string;
}

export interface ContentTimelineItem {
  id: string;
  platform: string;
  title: string;
  date: string;
  contentType: string;
}

export interface ContentTimelineColumn {
  status: string;
  label: string;
  count: number;
  items: ContentTimelineItem[];
}

export interface ContentCalendarEvent {
  id: string;
  platform: string;
  title: string;
  status: string;
  day: number;
  month: number;
  year: number;
  contentType: string;
  adSpend: number;
  views: number;
  reach: number;
  engagementRate: number;
}

export interface ContentPerformanceRow {
  id: string;
  title: string;
  contentType: string;
  platform: string;
  publishedDate: string;
  reach: number;
  engagementRate: number;
  engagements: number;
  label: string;
  up: boolean;
  thumbnail: string | null;
  adSpend: number;
}

export interface ContentPageData {
  kpis: ContentKpi[];
  approvals: ContentApprovalItem[];
  approvalCount: number;
  timeline: ContentTimelineColumn[];
  timelineTotal: number;
  calendarEvents: ContentCalendarEvent[];
  defaultMonth: number;
  defaultYear: number;
  performanceRows: ContentPerformanceRow[];
  pendingLabel: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "#E1306C",
  FACEBOOK: "#1877F2",
  LINKEDIN: "#0A66C2",
  TIKTOK: "#000000",
  YOUTUBE: "#FF0000",
  X: "#000000",
};

const PLATFORM_LIGHT: Record<string, string> = {
  INSTAGRAM: "#FCE4EC",
  FACEBOOK: "#E3F2FD",
  LINKEDIN: "#E3F2FD",
  TIKTOK: "#F5F5F5",
  YOUTUBE: "#FFEBEE",
  X: "#F5F5F5",
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  REEL: "Reel", POST: "Post", STORY: "Story", VIDEO: "Video",
  CAROUSEL: "Carousel", THREAD: "Thread", SHORT: "Short", LIVE: "Live",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  CLIENT_APPROVAL_PENDING: "Client Approval",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  POSTED: "Published",
  REJECTED: "Changes Needed",
  ARCHIVED: "Archived",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6B7280",
  CLIENT_APPROVAL_PENDING: "#EA580C",
  APPROVED: "#16A34A",
  SCHEDULED: "#2563EB",
  POSTED: "#16A34A",
};

const STATUS_BG: Record<string, string> = {
  DRAFT: "#F3F4F6",
  CLIENT_APPROVAL_PENDING: "#FFF7ED",
  APPROVED: "#F0FDF4",
  SCHEDULED: "#EFF6FF",
  POSTED: "#F0FDF4",
};

function performanceLabel(rate: number): string {
  if (rate >= 8) return "Top Performer";
  if (rate >= 4) return "Strong";
  if (rate >= 2) return "Average";
  return "Needs Improvement";
}

function performanceLabelColor(label: string): string {
  switch (label) {
    case "Top Performer": return "text-[#166534] bg-[#DCFCE7]";
    case "Strong": return "text-[#047857] bg-[#ECFDF5]";
    case "Average": return "text-[#92400E] bg-[#FEF3C7]";
    default: return "text-[#B91C1C] bg-[#FEE2E2]";
  }
}

export default async function ClientContentPage() {
  const user = await requireClient();
  const clientId = user.clientId;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const allContent = await prisma.content.findMany({
    where: { clientId, status: { notIn: ["IDEA", "ARCHIVED"] } },
    include: {
      analytics: true,
      creator: { select: { name: true } },
      approvalEvents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  // ── KPIs ─────────────────────────────────────
  const pendingCount = allContent.filter(c => c.status === "CLIENT_APPROVAL_PENDING").length;
  const scheduledCount = allContent.filter(c => c.status === "SCHEDULED").length;
  const publishedThisMonth = allContent.filter(c => c.status === "POSTED" && c.postedAt && c.postedAt >= thisMonthStart && c.postedAt <= thisMonthEnd).length;
  const draftsCount = allContent.filter(c => c.status === "DRAFT").length;

  const lastMonthContent = await prisma.content.findMany({
    where: {
      clientId,
      status: { notIn: ["IDEA", "ARCHIVED"] },
      updatedAt: { gte: lastMonthStart, lte: lastMonthEnd },
    },
  });

  const lastPending = lastMonthContent.filter(c => c.status === "CLIENT_APPROVAL_PENDING").length;
  const lastScheduled = lastMonthContent.filter(c => c.status === "SCHEDULED").length;
  const lastPublished = lastMonthContent.filter(c => c.status === "POSTED").length;

  const kpis: ContentKpi[] = [
    { label: "Awaiting Approval", value: String(pendingCount), delta: delta(pendingCount, lastPending) },
    { label: "Scheduled", value: String(scheduledCount), delta: delta(scheduledCount, lastScheduled) },
    { label: "Published This Month", value: String(publishedThisMonth), delta: delta(publishedThisMonth, lastPublished) },
    { label: "Drafts In Progress", value: String(draftsCount), delta: draftsCount > 0 ? 0 : 0 },
  ];

  // ── APPROVALS ─────────────────────────────────
  const approvals = allContent
    .filter(c => c.status === "CLIENT_APPROVAL_PENDING")
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      platform: c.platform,
      title: c.title,
      description: c.caption?.slice(0, 120) ?? "",
      dueDate: c.scheduledAt ? c.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
      submittedBy: c.creator?.name || "Contour Team",
      thumbnail: c.assetUrls?.[0] ?? null,
      contentType: c.contentType,
    }));

  // ── TIMELINE ──────────────────────────────────
  const columns: { status: string; label: string }[] = [
    { status: "DRAFT", label: "Draft" },
    { status: "CLIENT_APPROVAL_PENDING", label: "Awaiting Approval" },
    { status: "APPROVED", label: "Approved" },
    { status: "SCHEDULED", label: "Scheduled" },
    { status: "POSTED", label: "Published" },
  ];

  const timeline: ContentTimelineColumn[] = columns.map(col => {
    const items = allContent.filter(c => c.status === col.status).slice(0, 2).map(c => ({
      id: c.id,
      platform: c.platform,
      title: c.title,
      date: c.scheduledAt?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) || c.postedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) || "",
      contentType: c.contentType,
    }));
    return {
      status: col.status,
      label: col.label,
      count: allContent.filter(c => c.status === col.status).length,
      items,
    };
  });

  const timelineTotal = allContent.length;

  // ── CALENDAR ──────────────────────────────────
  const defaultMonth = now.getMonth();
  const defaultYear = now.getFullYear();

  const calendarEvents: ContentCalendarEvent[] = allContent.map(c => {
    const d = c.scheduledAt || c.publishDate || c.createdAt;
    return {
      id: c.id,
      platform: c.platform,
      title: c.title,
      status: c.status,
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      contentType: c.contentType,
      adSpend: num(c.adSpend),
      views: num(c.analytics?.views),
      reach: num(c.analytics?.reach),
      engagementRate: num(c.analytics?.engagementRate) * 100,
    };
  });

  // ── PERFORMANCE ───────────────────────────────
  const posted = allContent
    .filter(c => c.status === "POSTED" && c.analytics)
    .map(c => {
      const a = c.analytics!;
      const rate = num(a.engagementRate) * 100;
      return {
        id: c.id,
        title: c.title,
        contentType: c.contentType,
        platform: c.platform,
        publishedDate: c.postedAt?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) || "",
        reach: num(a.reach),
        engagementRate: rate,
        engagements: num(a.likes) + num(a.comments) + num(a.shares),
        label: performanceLabel(rate),
        up: rate >= 2,
        thumbnail: c.assetUrls?.[0] ?? null,
        adSpend: num(c.adSpend),
      };
    });

  const pageData: ContentPageData = {
    kpis,
    approvals,
    approvalCount: pendingCount,
    timeline,
    timelineTotal,
    calendarEvents,
    defaultMonth,
    defaultYear,
    performanceRows: posted,
    pendingLabel: "vs last month",
  };

  return <ClientContent data={pageData} />;
}
