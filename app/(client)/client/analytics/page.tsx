import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import ClientAnalytics from "@/components/features/client/client-analytics";

export const dynamic = "force-dynamic";

export type MetricKey = "views" | "reach" | "engagement" | "followers";

export interface KpiData {
  label: string;
  value: string;
  delta: number;
  sparkline: number[];
}

export interface ChartDay {
  date: string;
  label: string;
  views: number;
  reach: number;
  engagement: number;
  followers: number;
}

export interface SingleMetricBreakdown {
  total: number;
  totalPrev: number;
  dailyAverage: number;
  bestDay: { value: number; date: string } | null;
  worstDay: { value: number; date: string } | null;
}

export interface BreakdownMetrics {
  views: SingleMetricBreakdown;
  reach: SingleMetricBreakdown;
  engagement: SingleMetricBreakdown;
  followers: SingleMetricBreakdown;
}

export interface TopContentItem {
  id: string;
  title: string;
  views: number;
  reach: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  thumbnail: string | null;
  platform: string;
  contentType: string;
  publishedDate: string;
}

export interface AudienceData {
  hasData: boolean;
}

export interface AnalyticsPageData {
  kpis: KpiData[];
  currentChartData: ChartDay[];
  previousChartData: ChartDay[];
  breakdown: BreakdownMetrics;
  topContent: TopContentItem[];
  audience: AudienceData;
  currentLabel: string;
  previousLabel: string;
}

function num(v: unknown): number {
  if (v == null) return 0;
  return Number(v);
}

function delta(cur: number, prv: number): number {
  return prv > 0 ? ((cur - prv) / prv) * 100 : cur > 0 ? 100 : 0;
}

function computeBreakdown(chartData: ChartDay[], total: number, totalPrev: number, metric: MetricKey): SingleMetricBreakdown {
  const days = chartData.length || 1;
  let bestDay: { value: number; date: string } | null = null;
  let worstDay: { value: number; date: string } | null = null;
  if (chartData.length > 0) {
    const sorted = [...chartData].sort((a, b) => b[metric] - a[metric]);
    bestDay = { value: sorted[0][metric], date: sorted[0].date };
    worstDay = { value: sorted[sorted.length - 1][metric], date: sorted[sorted.length - 1].date };
  }
  return {
    total,
    totalPrev,
    dailyAverage: Math.round(total / days),
    bestDay,
    worstDay,
  };
}

export default async function ClientAnalyticsPage() {
  const user = await requireClient();
  const clientId = user.clientId;

  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentLabel = currentStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " – " + currentEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const previousLabel = prevStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " – " + prevEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const [currentSnaps, previousSnaps, dailyMetrics, topContent] = await Promise.all([
    prisma.analyticsSnapshot.findMany({
      where: { clientId, periodStart: { gte: currentStart, lte: currentEnd } },
    }),
    prisma.analyticsSnapshot.findMany({
      where: { clientId, periodStart: { gte: prevStart, lte: prevEnd } },
    }),
    prisma.platformDailyMetric.findMany({
      where: {
        clientId,
        metricDate: {
          gte: new Date(now.getFullYear(), now.getMonth() - 2, 1),
          lte: currentEnd,
        },
      },
      orderBy: { metricDate: "asc" },
    }),
    prisma.content.findMany({
      where: {
        clientId,
        status: { in: ["POSTED", "SCHEDULED"] },
        analytics: { isNot: null },
      },
      include: { analytics: true },
      orderBy: { analytics: { engagementRate: "desc" } },
      take: 5,
    }),
  ]);

  // Aggregate current period
  const curr = currentSnaps.reduce(
    (acc, s) => ({
      views: acc.views + num(s.totalViews),
      reach: acc.reach + num(s.totalReach),
      engagement: acc.engagement + num(s.totalEngagement),
      followers: acc.followers + s.followerGrowth,
    }),
    { views: 0, reach: 0, engagement: 0, followers: 0 }
  );

  const prev = previousSnaps.reduce(
    (acc, s) => ({
      views: acc.views + num(s.totalViews),
      reach: acc.reach + num(s.totalReach),
      engagement: acc.engagement + num(s.totalEngagement),
      followers: acc.followers + s.followerGrowth,
    }),
    { views: 0, reach: 0, engagement: 0, followers: 0 }
  );

  // Sparkline data from snapshots
  const sortedSnaps = [...currentSnaps].sort(
    (a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()
  );

  const kpiSparklines = {
    views: sortedSnaps.map(s => num(s.totalViews)),
    reach: sortedSnaps.map(s => num(s.totalReach)),
    engagement: sortedSnaps.map(s => num(s.totalEngagement)),
    followers: sortedSnaps.map(s => s.followerGrowth),
    posts: sortedSnaps.map(s => s.postCount),
  };

  // Build daily chart data for current period
  const currentDailyMap = dailyMetrics
    .filter(m => m.metricDate >= currentStart && m.metricDate <= currentEnd)
    .reduce((acc: Record<string, { views: number; reach: number; engagement: number; followers: number }>, m) => {
      const k = m.metricDate.toISOString().split("T")[0];
      if (!acc[k]) acc[k] = { views: 0, reach: 0, engagement: 0, followers: 0 };
      acc[k].views += num(m.views);
      acc[k].reach += num(m.reach);
      acc[k].engagement += num(m.engagement);
      acc[k].followers += m.followerDelta;
      return acc;
    }, {});

  const chartData = Object.entries(currentDailyMap).slice(-30).map(([date, d]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: d.views,
    reach: d.reach,
    engagement: d.engagement,
    followers: d.followers,
  }));

  // Previous period daily chart data
  const prevDailyMap = dailyMetrics
    .filter(m => m.metricDate >= prevStart && m.metricDate <= prevEnd)
    .reduce((acc: Record<string, { views: number; reach: number; engagement: number; followers: number }>, m) => {
      const k = m.metricDate.toISOString().split("T")[0];
      if (!acc[k]) acc[k] = { views: 0, reach: 0, engagement: 0, followers: 0 };
      acc[k].views += num(m.views);
      acc[k].reach += num(m.reach);
      acc[k].engagement += num(m.engagement);
      acc[k].followers += m.followerDelta;
      return acc;
    }, {});

  const prevChartData = Object.entries(prevDailyMap).slice(-30).map(([date, d]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: d.views,
    reach: d.reach,
    engagement: d.engagement,
    followers: d.followers,
  }));

  // KPI data
  const engagementRate = curr.reach > 0 ? (curr.engagement / curr.reach) * 100 : 0;
  const prevEngagementRate = prev.reach > 0 ? (prev.engagement / prev.reach) * 100 : 0;

  const kpis: KpiData[] = [
    { label: "Total Views", value: formatNumber(curr.views), delta: delta(curr.views, prev.views), sparkline: kpiSparklines.views },
    { label: "Total Reach", value: formatNumber(curr.reach), delta: delta(curr.reach, prev.reach), sparkline: kpiSparklines.reach },
    { label: "Engagement", value: formatNumber(curr.engagement), delta: delta(curr.engagement, prev.engagement), sparkline: kpiSparklines.engagement },
    { label: "Followers Gained", value: formatNumber(curr.followers), delta: delta(curr.followers, prev.followers), sparkline: kpiSparklines.followers },
    { label: "Engagement Rate", value: `${engagementRate.toFixed(1)}%`, delta: delta(engagementRate, prevEngagementRate), sparkline: kpiSparklines.posts },
  ];

  // Top content
  const showcaseContent: TopContentItem[] = topContent.slice(0, 5).map(c => ({
    id: c.id,
    title: c.title,
    views: num(c.analytics?.views),
    reach: num(c.analytics?.reach),
    engagementRate: num(c.analytics?.engagementRate) * 100,
    likes: c.analytics?.likes ?? 0,
    comments: c.analytics?.comments ?? 0,
    shares: c.analytics?.shares ?? 0,
    thumbnail: c.assetUrls?.[0] ?? null,
    platform: c.platform,
    contentType: c.contentType,
    publishedDate: (c.publishDate || c.scheduledAt || c.updatedAt)?.toISOString() ?? "",
  }));

  const pageData: AnalyticsPageData = {
    kpis,
    currentChartData: chartData,
    previousChartData: prevChartData,
    breakdown: {
      views: computeBreakdown(chartData, curr.views, prev.views, "views"),
      reach: computeBreakdown(chartData, curr.reach, prev.reach, "reach"),
      engagement: computeBreakdown(chartData, curr.engagement, prev.engagement, "engagement"),
      followers: computeBreakdown(chartData, curr.followers, prev.followers, "followers"),
    },
    topContent: showcaseContent,
    audience: { hasData: false },
    currentLabel,
    previousLabel,
  };

  return <ClientAnalytics data={pageData} />;
}
