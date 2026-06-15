"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQueryState } from "nuqs";
import type { Platform } from "@prisma/client";
import PageShell from "@/components/layout/page-shell";
import StatCard from "@/components/shared/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber, formatDate } from "@/lib/utils";
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from "@/types";
import { PlatformIcon } from "@/components/shared/social-icons";
import {
  Eye,
  Radio,
  Monitor,
  MousePointer2,
  Download,
  BarChart3,
  FileText,
  Calendar,
  Layers,
} from "lucide-react";

interface ClientOption {
  id: string;
  brandName: string;
}

interface SnapshotItem {
  id: string;
  clientId: string;
  clientBrandName: string;
  platform: string;
  periodStart: string;
  periodEnd: string;
  totalViews: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  followerCountStart: number | null;
  followerCountEnd: number | null;
  followerGrowth: number;
  avgEngagementRate: number | null;
  postCount: number;
  storyCount: number;
  reelCount: number;
}

interface TopContentItem {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  clientBrandName: string;
  clientId: string;
  assetUrls: string[];
  views: number;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
}

interface ProductPerformanceItem {
  id: string;
  name: string;
  clientId: string;
  postCount: number;
  reach: number;
  views: number;
  engagement: number;
}

interface AnalyticsPageContentProps {
  clients: ClientOption[];
  snapshots: SnapshotItem[];
  topContent: TopContentItem[];
  products: ProductPerformanceItem[];
  user: {
    name: string;
    email: string;
    username: string;
  };
}

type SortMetric = "reach" | "engagement" | "views" | "shares";
type ChartMetric = "views" | "reach" | "impressions" | "engagement";

const KPI_CONFIG: { key: ChartMetric; label: string; icon: React.ReactNode }[] = [
  { key: "views", label: "Views", icon: <Eye className="w-[18px] h-[18px] text-[#5B7A1A]" /> },
  { key: "reach", label: "Reach", icon: <Radio className="w-[18px] h-[18px] text-[#5B7A1A]" /> },
  {
    key: "impressions",
    label: "Impressions",
    icon: <Monitor className="w-[18px] h-[18px] text-[#5B7A1A]" />,
  },
  {
    key: "engagement",
    label: "Engagement",
    icon: <MousePointer2 className="w-[18px] h-[18px] text-[#5B7A1A]" />,
  },
];

const CHART_METRIC_LABELS: Record<ChartMetric, string> = {
  views: "Views",
  reach: "Reach",
  impressions: "Impressions",
  engagement: "Engagement",
};

function getMetricTotal(items: SnapshotItem[], key: ChartMetric): number {
  const fieldMap: Record<ChartMetric, keyof SnapshotItem> = {
    views: "totalViews",
    reach: "totalReach",
    impressions: "totalImpressions",
    engagement: "totalEngagement",
  };
  return items.reduce((sum, s) => sum + (s[fieldMap[key]] as number), 0);
}

function computeComparison(
  current: number,
  previous: number
): { delta: number; label: string } | undefined {
  if (previous === 0) {
    return current > 0 ? { delta: 100, label: "New this period" } : undefined;
  }
  const delta = ((current - previous) / previous) * 100;
  return { delta: Math.round(delta * 10) / 10, label: "vs previous period" };
}

function getSortMetricValue(item: TopContentItem, metric: SortMetric): number {
  if (metric === "engagement") {
    return item.likes + item.comments + item.shares + item.saves;
  }
  if (metric === "views") return item.views;
  if (metric === "reach") return item.reach;
  return item.shares;
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  REEL: "bg-purple-50 text-purple-700 border-purple-200",
  POST: "bg-blue-50 text-blue-700 border-blue-200",
  STORY: "bg-orange-50 text-orange-700 border-orange-200",
  VIDEO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CAROUSEL: "bg-pink-50 text-pink-700 border-pink-200",
  THREAD: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHORT: "bg-amber-50 text-amber-700 border-amber-200",
  LIVE: "bg-red-50 text-red-700 border-red-200",
};

export default function AnalyticsPageContent({
  clients,
  snapshots: allSnapshots,
  topContent: allTopContent,
  products,
  user,
}: AnalyticsPageContentProps) {
  const [filterClient, setFilterClient] = useQueryState("filterClient", { defaultValue: "all" });
  const [filterPlatform, setFilterPlatform] = React.useState<string>("all");
  const [chartMetric, setChartMetric] = React.useState<ChartMetric>("views");
  const [sortMetric, setSortMetric] = React.useState<SortMetric>("reach");
  const [dateRange] = React.useState<{ start: string; end: string } | null>(null);

  const filteredSnapshots = React.useMemo(() => {
    let data = allSnapshots;
    if (filterClient !== "all") {
      data = data.filter((s) => s.clientId === filterClient);
    }
    if (filterPlatform !== "all") {
      data = data.filter((s) => s.platform === filterPlatform);
    }
    if (data.length === 0) return [];

    const dates = data.map((s) => ({
      start: new Date(s.periodStart).getTime(),
      end: new Date(s.periodEnd).getTime(),
    }));
    const globalMin = new Date(Math.min(...dates.map((d) => d.start)));
    const globalMax = new Date(Math.max(...dates.map((d) => d.end)));

    const range = dateRange || {
      start: formatDate(globalMin, "yyyy-MM-dd"),
      end: formatDate(globalMax, "yyyy-MM-dd"),
    };

    const rangeStart = new Date(range.start).getTime();
    const rangeEnd = new Date(range.end).getTime();

    return data.filter((s) => {
      const sStart = new Date(s.periodStart).getTime();
      const sEnd = new Date(s.periodEnd).getTime();
      return sStart >= rangeStart && sEnd <= rangeEnd;
    });
  }, [allSnapshots, filterClient, filterPlatform, dateRange]);

  const filteredTopContent = React.useMemo(() => {
    let data = allTopContent;
    if (filterClient !== "all") {
      data = data.filter((c) => c.clientId === filterClient);
    }
    if (filterPlatform !== "all") {
      data = data.filter((c) => c.platform === filterPlatform);
    }
    return data;
  }, [allTopContent, filterClient, filterPlatform]);

  const previousPeriodSnapshots = React.useMemo(() => {
    if (filteredSnapshots.length === 0) return [];
    const dates = filteredSnapshots.map((s) => ({
      start: new Date(s.periodStart),
      end: new Date(s.periodEnd),
    }));
    const earliest = new Date(Math.min(...dates.map((d) => d.start.getTime())));
    const latest = new Date(Math.max(...dates.map((d) => d.end.getTime())));
    const rangeMs = latest.getTime() - earliest.getTime();
    const prevEnd = new Date(earliest.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - rangeMs);

    return allSnapshots.filter((s) => {
      const sStart = new Date(s.periodStart).getTime();
      const sEnd = new Date(s.periodEnd).getTime();
      if (filterClient !== "all" && s.clientId !== filterClient) return false;
      if (filterPlatform !== "all" && s.platform !== filterPlatform) return false;
      return sStart >= prevStart.getTime() && sEnd <= prevEnd.getTime();
    });
  }, [allSnapshots, filteredSnapshots, filterClient, filterPlatform]);

  const kpiData = React.useMemo(() => {
    return KPI_CONFIG.map((cfg) => {
      const currentTotal = getMetricTotal(filteredSnapshots, cfg.key);
      const prevTotal = getMetricTotal(previousPeriodSnapshots, cfg.key);
      const comparison = computeComparison(currentTotal, prevTotal);
      return {
        ...cfg,
        value: formatNumber(currentTotal),
        delta: comparison?.delta,
        deltaLabel: comparison?.label || "vs previous period",
      };
    });
  }, [filteredSnapshots, previousPeriodSnapshots]);

  const platformBreakdown = React.useMemo(() => {
    const map = new Map<string, { views: number; reach: number; engagement: number }>();
    filteredSnapshots.forEach((s) => {
      const existing = map.get(s.platform) || { views: 0, reach: 0, engagement: 0 };
      existing.views += s.totalViews;
      existing.reach += s.totalReach;
      existing.engagement += s.totalEngagement;
      map.set(s.platform, existing);
    });
    const totalReach = Array.from(map.values()).reduce((sum, p) => sum + p.reach, 0);
    return Array.from(map.entries())
      .map(([platform, data]) => ({
        platform,
        label: PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] || platform,
        views: data.views,
        reach: data.reach,
        engagement: data.engagement,
        pct: totalReach > 0 ? (data.reach / totalReach) * 100 : 0,
      }))
      .sort((a, b) => b.reach - a.reach);
  }, [filteredSnapshots]);

  const chartData = React.useMemo(() => {
    const map = new Map<
      string,
      { date: string; views: number; reach: number; impressions: number; engagement: number }
    >();
    filteredSnapshots.forEach((s) => {
      const key = formatDate(s.periodStart, "MMM dd");
      const existing = map.get(key) || {
        date: key,
        views: 0,
        reach: 0,
        impressions: 0,
        engagement: 0,
      };
      existing.views += s.totalViews;
      existing.reach += s.totalReach;
      existing.impressions += s.totalImpressions;
      existing.engagement += s.totalEngagement;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => {
      const parseDate = (d: string) => {
        const [month, day] = d.split(" ");
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        return months.indexOf(month) * 31 + parseInt(day);
      };
      return parseDate(a.date) - parseDate(b.date);
    });
  }, [filteredSnapshots]);

  const sortedTopContent = React.useMemo(() => {
    return [...filteredTopContent]
      .sort((a, b) => getSortMetricValue(b, sortMetric) - getSortMetricValue(a, sortMetric))
      .slice(0, 5);
  }, [filteredTopContent, sortMetric]);

  const contentTypeBreakdown = React.useMemo(() => {
    const map = new Map<string, { reach: number }>();
    filteredTopContent.forEach((c) => {
      const existing = map.get(c.contentType) || { reach: 0 };
      existing.reach += c.reach;
      map.set(c.contentType, existing);
    });
    const totalReach = Array.from(map.values()).reduce((sum, val) => sum + val.reach, 0);
    return Array.from(map.entries())
      .map(([contentType, data]) => ({
        contentType,
        label: CONTENT_TYPE_LABELS[contentType as keyof typeof CONTENT_TYPE_LABELS] || contentType,
        reach: data.reach,
        pct: totalReach > 0 ? (data.reach / totalReach) * 100 : 0,
      }))
      .sort((a, b) => b.reach - a.reach);
  }, [filteredTopContent]);

  const filteredProducts = React.useMemo(() => {
    let data = products || [];
    if (filterClient !== "all") {
      data = data.filter((p) => p.clientId === filterClient);
    }
    const sorted = [...data].sort((a, b) => b.reach - a.reach).slice(0, 5);
    const totalReach = sorted.reduce((sum, p) => sum + p.reach, 0);
    return sorted.map((p) => ({
      ...p,
      pct: totalReach > 0 ? (p.reach / totalReach) * 100 : 0,
    }));
  }, [products, filterClient]);

  const clientComparisonData = React.useMemo(() => {
    const map = new Map<string, { brandName: string; reach: number }>();
    filteredSnapshots.forEach((s) => {
      const existing = map.get(s.clientId) || { brandName: s.clientBrandName, reach: 0 };
      existing.reach += s.totalReach;
      map.set(s.clientId, existing);
    });
    const sorted = Array.from(map.values()).sort((a, b) => b.reach - a.reach).slice(0, 5);
    const totalReach = sorted.reduce((sum, c) => sum + c.reach, 0);
    return sorted.map((c) => ({
      ...c,
      pct: totalReach > 0 ? (c.reach / totalReach) * 100 : 0,
    }));
  }, [filteredSnapshots]);

  const handleExport = () => {
    const rows = [
      [
        "Client",
        "Platform",
        "Period Start",
        "Period End",
        "Views",
        "Reach",
        "Impressions",
        "Engagement",
      ],
    ];
    filteredSnapshots.forEach((s) => {
      rows.push([
        s.clientBrandName,
        PLATFORM_LABELS[s.platform as keyof typeof PLATFORM_LABELS] || s.platform,
        formatDate(s.periodStart, "yyyy-MM-dd"),
        formatDate(s.periodEnd, "yyyy-MM-dd"),
        String(s.totalViews),
        String(s.totalReach),
        String(s.totalImpressions),
        String(s.totalEngagement),
      ]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-export-${formatDate(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const breadcrumbs = [{ label: "Analytics", href: "/admin/analytics" }];

  return (
    <PageShell title="Analytics" breadcrumbs={breadcrumbs} user={user}>
      <div className="max-w-[1440px] mx-auto space-y-5">
        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Client Filter */}
          <Select value={filterClient} onValueChange={(val) => setFilterClient(val)}>
            <SelectTrigger className="w-[220px] h-10 rounded-xl border border-[#ECECF4] text-sm text-[#111827] bg-white focus:ring-[#C5F135] px-3.5">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.brandName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <Select value={filterPlatform} onValueChange={(val) => setFilterPlatform(val || "all")}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl border border-[#ECECF4] text-sm text-[#111827] bg-white focus:ring-[#C5F135] px-3.5">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="FACEBOOK">Facebook</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
              <SelectItem value="YOUTUBE">YouTube</SelectItem>
              <SelectItem value="TIKTOK">TikTok</SelectItem>
              <SelectItem value="X">X (Twitter)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-[#ECECF4] bg-white text-sm text-[#6B7280] w-[240px]">
            <Calendar className="w-4 h-4 shrink-0 text-[#9CA3AF]" />
            <span className="truncate">
              {dateRange
                ? `${formatDate(dateRange.start, "MMM d")} - ${formatDate(
                    dateRange.end,
                    "MMM d, yyyy"
                  )}`
                : filteredSnapshots.length > 0
                ? `${formatDate(
                    filteredSnapshots[filteredSnapshots.length - 1].periodStart,
                    "MMM d"
                  )} - ${formatDate(filteredSnapshots[0].periodEnd, "MMM d, yyyy")}`
                : "No date range"}
            </span>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-sm font-medium text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F4FA] transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-5">
          {kpiData.map((kpi) => (
            <StatCard
              key={kpi.key}
              label={kpi.label}
              value={kpi.value}
              icon={kpi.icon}
              delta={kpi.delta}
              deltaLabel={kpi.deltaLabel}
              className="h-[130px]"
            />
          ))}
        </div>

        {/* Analytics Highlights */}
        <div className="grid grid-cols-2 gap-5">
          {/* Platform Performance / Comparison */}
          <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
            <h3 className="text-base font-bold text-[#111827]">Platform Performance Comparison</h3>
            <p className="text-[13px] text-[#6B7280] mt-0.5 mb-4">
              Detailed reach breakdowns and platform comparative metrics.
            </p>
            {platformBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <BarChart3 className="w-8 h-8 text-[#D1D5DB] mb-2" />
                <p className="text-sm font-semibold text-[#6B7280]">No analytics snapshots yet</p>
                <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                  Connect social platforms to see performance data.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {platformBreakdown.map((p) => (
                  <div key={p.platform} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <PlatformIcon
                          platform={p.platform as Platform}
                          className="w-4 h-4 shrink-0"
                        />
                        <span className="font-semibold text-[#111827]">{p.label}</span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        Views: <span className="font-bold text-[#111827]">{formatNumber(p.views)}</span> | Reach:{" "}
                        <span className="font-bold text-[#111827]">{formatNumber(p.reach)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 rounded-full bg-[#F4F4FA] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#C5F135] transition-all duration-500"
                          style={{ width: `${Math.max(p.pct, 1)}%` }}
                        />
                      </div>
                      <span className="text-[13px] font-semibold text-[#111827] w-10 text-right">
                        {p.pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Performing Content */}
          <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
            <div className="flex items-center justify-between mb-0.5">
              <h3 className="text-base font-bold text-[#111827]">Top Performing Content</h3>
              <Select
                value={sortMetric}
                onValueChange={(val) => val && setSortMetric(val as SortMetric)}
              >
                <SelectTrigger className="w-[130px] h-8 rounded-lg border border-[#ECECF4] text-xs text-[#6B7280] bg-white px-2.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#ECECF4] text-[#111827] rounded-xl">
                  <SelectItem value="reach">By Reach</SelectItem>
                  <SelectItem value="engagement">By Engagement</SelectItem>
                  <SelectItem value="views">By Views</SelectItem>
                  <SelectItem value="shares">By Shares</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[13px] text-[#6B7280] mb-4">
              Sorted by {CHART_METRIC_LABELS[sortMetric as ChartMetric] || sortMetric}
            </p>
            {sortedTopContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="w-8 h-8 text-[#D1D5DB] mb-2" />
                <p className="text-sm font-semibold text-[#6B7280]">No content synced yet</p>
                <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                  Content analytics will appear after platform sync.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedTopContent.map((item) => {
                  const maxVal = sortedTopContent.reduce(
                    (max, c) => Math.max(max, getSortMetricValue(c, sortMetric)),
                    0
                  );
                  const metricVal = getSortMetricValue(item, sortMetric);
                  const pct = maxVal > 0 ? (metricVal / maxVal) * 100 : 0;
                  const typeColor =
                    CONTENT_TYPE_COLORS[item.contentType] || "bg-[#F5F5F5] text-[#6B6B80]";
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg ${
                          typeColor.split(" ")[0]
                        } flex items-center justify-center shrink-0`}
                      >
                        <FileText className={`w-3.5 h-3.5 ${typeColor.split(" ")[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#111827] truncate">
                            {item.title}
                          </span>
                          <PlatformIcon
                            platform={item.platform as Platform}
                            className="w-3 h-3 shrink-0 text-[#9CA3AF]"
                          />
                        </div>
                        <span className="text-[11px] text-[#6B7280]">{item.clientBrandName}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-semibold text-[#111827]">
                          {sortMetric === "engagement"
                            ? `${(item.engagementRate * 100).toFixed(1)}%`
                            : formatNumber(metricVal)}
                        </p>
                        <div className="w-16 h-1 rounded-full bg-[#F4F4FA] mt-0.5 ml-auto">
                          <div
                            className="h-full rounded-full bg-[#C5F135]"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Performance Over Time */}
        <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
          <div className="flex items-center justify-between mb-0.5">
            <div>
              <h3 className="text-base font-bold text-[#111827]">Performance Over Time</h3>
              <p className="text-[13px] text-[#6B7280] mt-0.5">Track key metrics over time</p>
            </div>
            <div className="flex items-center rounded-lg border border-[#ECECF4] p-0.5 bg-white">
              {(["views", "reach", "impressions", "engagement"] as ChartMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMetric(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    chartMetric === m
                      ? "bg-[#C5F135] text-[#111827]"
                      : "text-[#9CA3AF] hover:text-[#6B7280]"
                  }`}
                >
                  {CHART_METRIC_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-sm text-[#9CA3AF]">
                No time-series data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F5" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={{ stroke: "#ECECF4" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => formatNumber(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #ECECF4",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                      fontSize: "13px",
                    }}
                    labelStyle={{ fontWeight: 600, color: "#111827", marginBottom: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={chartMetric}
                    stroke="#C5F135"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#C5F135", stroke: "#fff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Product performance & content type breakdown */}
        <div className="grid grid-cols-2 gap-5">
          {/* Content Type Breakdown */}
          <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
            <h3 className="text-base font-bold text-[#111827]">Content Type Breakdown</h3>
            <p className="text-[13px] text-[#6B7280] mt-0.5 mb-4">
              Performance by content format (by reach)
            </p>
            {contentTypeBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[160px] text-sm text-[#9CA3AF] border border-dashed border-[#ECECF4] rounded-xl">
                No content items found
              </div>
            ) : (
              <div className="space-y-3">
                {contentTypeBreakdown.map((ct) => (
                  <div key={ct.contentType} className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-[#6B7280] w-20 truncate">
                      {ct.label}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-[#F4F4FA] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C5F135] transition-all duration-500"
                        style={{ width: `${Math.max(ct.pct, 1)}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-semibold text-[#111827] w-14 text-right">
                      {ct.pct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Rollup details */}
          <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
            <h3 className="text-base font-bold text-[#111827] flex items-center gap-1.5">
              <Layers className="w-[18px] h-[18px] text-[#5B7A1A]" />
              Product Attribution Rollup
            </h3>
            <p className="text-[13px] text-[#6B7280] mt-0.5 mb-4">
              Client product campaign performance summaries
            </p>
            {filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-[160px] text-sm text-[#9CA3AF] border border-dashed border-[#ECECF4] rounded-xl">
                No product attributions found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between text-[13px]">
                      <span className="font-bold text-[#111827] truncate w-36" title={p.name}>
                        {p.name}
                      </span>
                      <span className="text-gray-400 text-xs">
                        Views: <span className="font-bold text-[#111827]">{formatNumber(p.views)}</span> | Reach:{" "}
                        <span className="font-bold text-[#111827]">{formatNumber(p.reach)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[#F4F4FA] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#C5F135] transition-all duration-500"
                          style={{ width: `${Math.max(p.pct, 1)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#9CA3AF] w-24 text-right shrink-0">
                        {p.postCount} posts tagged
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client Comparison — only visible when All Clients selected */}
        {filterClient === "all" && (
          <div className="bg-white border border-[#ECECF4] rounded-[20px] p-5">
            <h3 className="text-base font-bold text-[#111827]">Client Comparison</h3>
            <p className="text-[13px] text-[#6B7280] mt-0.5 mb-4">
              Performance across all clients (by reach)
            </p>
            {clientComparisonData.length === 0 ? (
              <div className="flex items-center justify-center h-[120px] text-sm text-[#9CA3AF] border border-dashed border-[#ECECF4] rounded-xl">
                No client snapshots found
              </div>
            ) : (
              <div className="space-y-3">
                {clientComparisonData.map((c) => (
                  <div key={c.brandName} className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-[#6B7280] w-28 truncate">
                      {c.brandName}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-[#F4F4FA] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C5F135] transition-all duration-500"
                        style={{ width: `${Math.max(c.pct, 1)}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-semibold text-[#111827] w-24 text-right">
                      {formatNumber(c.reach)} reach
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
