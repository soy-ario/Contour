"use client";

import * as React from "react";
import { cn, formatNumber } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Eye,
  TrendingUp,
  Heart,
  Users,
  BarChart3,
  Download,
  ChevronDown,
  Info,
  MoreHorizontal,
  Globe,
  Check,
} from "lucide-react";
import { PlatformSpecificMetricsSection } from "@/components/shared/platform-specific-metrics";

export type MetricKey = "views" | "reach" | "engagement" | "followers";

interface SerializedSnapshot {
  id: string;
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
  followerGrowth: number;
  postCount: number;
  videoViews: number;
  watchTimeSeconds: number;
  avgEngagementRate: number;
  avgCtr: number;
  profileVisits: number;
  websiteClicks: number;
  pageLikes: number;
  profileViews: number;
  subscribers: number;
}

interface SerializedDailyMetric {
  id: string;
  platform: string;
  metricDate: string;
  views: number;
  reach: number;
  impressions: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  followerDelta: number;
  videoViews: number;
  profileVisits: number;
  websiteClicks: number;
  pageLikes: number;
  profileViews: number;
  subscribers: number;
}

interface TopContentItem {
  id: string;
  title: string;
  views: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reactions: number;
  reposts: number;
  replies: number;
  clicks: number;
  videoViews: number;
  watchTimeSecs: number;
  avgWatchPct: number | null;
  ctr: number | null;
  thumbnail: string | null;
  platform: string;
  contentType: string;
  publishedDate: string;
}

interface ClientAnalyticsProps {
  snapshots: SerializedSnapshot[];
  dailyMetrics: SerializedDailyMetric[];
  topContent: TopContentItem[];
  currentStart: string;
  currentEnd: string;
  prevStart: string;
  prevEnd: string;
  previousLabel: string;
}

/* ═══════════════════════════════════════════════
   SPARKLINE
   ═══════════════════════════════════════════════ */

function Sparkline({ data, color = "#82D616" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const w = 56;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   DONUT CHART (SVG)
   ═══════════════════════════════════════════════ */

function DonutChart({
  segments,
  size = 80,
  strokeWidth = 8,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  const segmentsWithOffset: { value: number; color: string; len: number; offset: number }[] = [];
  let currentOffset = 0;
  for (const seg of segments) {
    const pct = seg.value / total;
    const len = pct * circ;
    segmentsWithOffset.push({
      ...seg,
      len,
      offset: currentOffset,
    });
    currentOffset += len;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segmentsWithOffset.map((seg, i) => {
        const dash = `${seg.len} ${circ - seg.len}`;
        const o = -seg.offset;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={dash}
            strokeDashoffset={o}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   PLATFORM BADGE
   ═══════════════════════════════════════════════ */

const PLATFORM_META: Record<string, { bg: string; label: string }> = {
  INSTAGRAM: { bg: "bg-gradient-to-br from-purple-500 to-pink-500", label: "IG" },
  YOUTUBE: { bg: "bg-red-500", label: "YT" },
  LINKEDIN: { bg: "bg-blue-600", label: "LI" },
  TIKTOK: { bg: "bg-black", label: "TT" },
  X: { bg: "bg-zinc-800", label: "X" },
  FACEBOOK: { bg: "bg-blue-500", label: "FB" },
};

function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORM_META[platform] || { bg: "bg-gray-400", label: "?" };
  return (
    <div className={`w-5 h-5 rounded ${meta.bg} flex items-center justify-center shrink-0`}>
      <span className="text-[8px] font-bold text-white">{meta.label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CONTENT TYPE BADGE
   ═══════════════════════════════════════════════ */

const CTYPE_COLORS: Record<string, string> = {
  REEL: "bg-purple-50 text-purple-700 border-purple-200",
  POST: "bg-blue-50 text-blue-700 border-blue-200",
  STORY: "bg-orange-50 text-orange-700 border-orange-200",
  VIDEO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CAROUSEL: "bg-pink-50 text-pink-700 border-pink-200",
};

function ContentTypeBadge({ type }: { type: string }) {
  const cls = CTYPE_COLORS[type] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls}`}>
      {type.charAt(0) + type.slice(1).toLowerCase()}
    </span>
  );
}

const METRIC_LABELS: Record<MetricKey, string> = {
  views: "Views",
  reach: "Reach",
  engagement: "Engagement",
  followers: "Followers",
};

const METRIC_ICONS: Record<MetricKey, React.ReactNode> = {
  views: <Eye className="w-[18px] h-[18px]" />,
  reach: <Users className="w-[18px] h-[18px]" />,
  engagement: <Heart className="w-[18px] h-[18px]" />,
  followers: <TrendingUp className="w-[18px] h-[18px]" />,
};

function formatYAxis(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
}

function MetricChartCard({
  metric,
  chartData,
  prevChartData,
}: {
  metric: MetricKey;
  chartData: { date: string; label: string; views: number; reach: number; engagement: number; followers: number }[];
  prevChartData: { date: string; label: string; views: number; reach: number; engagement: number; followers: number }[];
}) {
  const mappedChartData = chartData.map((d) => ({
    label: d.label,
    current: d[metric],
    previous: prevChartData.find((p) => p.label === d.label)?.[metric] ?? null,
  }));

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F2F8D7] flex items-center justify-center shrink-0 text-gray-500">
            {METRIC_ICONS[metric]}
          </div>
          <span className="text-sm font-bold text-[#111827]">{METRIC_LABELS[metric]}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#82D616]" />
            <span className="text-[9px] text-[#6B7280]">Current</span>
          </div>
          {prevChartData.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0 border-t border-dashed border-[#9CA3AF]" />
              <span className="text-[9px] text-[#6B7280]">Previous</span>
            </div>
          )}
        </div>
      </div>
      <div className="h-[180px]">
        {mappedChartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-[#9CA3AF]">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mappedChartData} margin={{ top: 2, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#9CA3AF", fontSize: 9 }}
                axisLine={{ stroke: "#F3F4F6" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={formatYAxis}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  color: "#111827",
                  fontSize: 11,
                  padding: "6px 10px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
                cursor={{ stroke: "#D1D5DB", strokeDasharray: "3 3" }}
              />
              {prevChartData.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="previous"
                  stroke="#9CA3AF"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  connectNulls
                />
              )}
              <Line
                type="monotone"
                dataKey="current"
                stroke="#82D616"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "#82D616" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

const PLATFORM_OPTIONS = [
  { value: "all", label: "All Platforms" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "X", label: "X (Twitter)" },
  { value: "FACEBOOK", label: "Facebook" },
];

function PlatformSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = PLATFORM_OPTIONS.find((o) => o.value === value) || PLATFORM_OPTIONS[0];
  const Icon = selected.value === "all" ? Globe : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors"
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{selected.label}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-20 py-1">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                opt.value === value
                  ? "font-semibold text-[#111827] bg-[#F9FAFB]"
                  : "text-[#6B7280] hover:bg-[#F9FAFB]"
              )}
            >
              <span className="flex-1">{opt.label}</span>
              {opt.value === value && <Check className="w-3.5 h-3.5 text-[#82D616]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const BREAKDOWN_METRICS: { key: MetricKey; label: string }[] = [
  { key: "views", label: "Views" },
  { key: "reach", label: "Reach" },
  { key: "engagement", label: "Engagement" },
  { key: "followers", label: "Followers" },
];

export default function ClientAnalytics({
  snapshots,
  dailyMetrics,
  topContent,
  currentStart,
  currentEnd,
  prevStart,
  prevEnd,
  previousLabel,
}: ClientAnalyticsProps) {
  const [platformFilter, setPlatformFilter] = React.useState("all");
  const [breakdownMetric, setBreakdownMetric] = React.useState<MetricKey>("views");

  // Dynamic calculations based on platformFilter state
  const {
    currCore,
    prevCore,
    chartData,
    prevChartData,
    filteredTopContent,
    platformSpecificMetrics,
    sparklines,
  } = React.useMemo(() => {
    // 1. Platform filters
    const platformSnapshots =
      platformFilter === "all"
        ? snapshots
        : snapshots.filter((s) => s.platform === platformFilter);

    const platformDaily =
      platformFilter === "all"
        ? dailyMetrics
        : dailyMetrics.filter((m) => m.platform === platformFilter);

    const platformContent =
      platformFilter === "all"
        ? topContent
        : topContent.filter((c) => c.platform === platformFilter);

    // 2. Separate current and previous period snapshots
    const currSnaps = platformSnapshots.filter(
      (s) => s.periodStart >= currentStart && s.periodStart <= currentEnd
    );
    const prevSnaps = platformSnapshots.filter(
      (s) => s.periodStart >= prevStart && s.periodStart <= prevEnd
    );

    // 3. Separate current and previous period daily metrics
    const currDaily = platformDaily.filter(
      (m) => m.metricDate >= currentStart && m.metricDate <= currentEnd
    );
    const prevDaily = platformDaily.filter(
      (m) => m.metricDate >= prevStart && m.metricDate <= prevEnd
    );

    // 4. Aggregate core KPI totals
    const currCore = currSnaps.reduce(
      (acc, s) => {
        acc.views += s.totalViews;
        acc.reach += s.totalReach;
        acc.engagement += s.totalEngagement;
        acc.followers += s.followerGrowth;
        return acc;
      },
      { views: 0, reach: 0, engagement: 0, followers: 0 }
    );

    const prevCore = prevSnaps.reduce(
      (acc, s) => {
        acc.views += s.totalViews;
        acc.reach += s.totalReach;
        acc.engagement += s.totalEngagement;
        acc.followers += s.followerGrowth;
        return acc;
      },
      { views: 0, reach: 0, engagement: 0, followers: 0 }
    );

    // 5. Aggregate platform-specific metrics for current period
    const platformSpecific = currSnaps.reduce(
      (acc, s) => {
        acc.profileVisits += s.profileVisits;
        acc.websiteClicks += s.websiteClicks;
        acc.pageLikes += s.pageLikes;
        acc.profileViews += s.profileViews;
        acc.subscribers += s.subscribers;
        acc.videoViews += s.videoViews;
        acc.watchTimeSeconds += s.watchTimeSeconds;
        return acc;
      },
      {
        profileVisits: 0,
        websiteClicks: 0,
        pageLikes: 0,
        profileViews: 0,
        subscribers: 0,
        videoViews: 0,
        watchTimeSeconds: 0,
      }
    );

    let totalClicks = 0;
    let totalReactions = 0;
    let totalReposts = 0;
    let totalReplies = 0;
    let sumCtr = 0;
    let countCtr = 0;

    platformContent.forEach((c) => {
      totalClicks += c.clicks;
      totalReactions += c.reactions;
      totalReposts += c.reposts;
      totalReplies += c.replies;
      if (c.ctr !== null) {
        sumCtr += c.ctr;
        countCtr++;
      }
    });

    const avgCtr = countCtr > 0 ? (sumCtr / countCtr) * 100 : 0;

    // 6. Build Sparkline data from snapshots sorted chronologically
    const sortedCurrSnaps = [...currSnaps].sort((a, b) =>
      a.periodStart.localeCompare(b.periodStart)
    );
    const sparklines = {
      views: sortedCurrSnaps.map((s) => s.totalViews),
      reach: sortedCurrSnaps.map((s) => s.totalReach),
      engagement: sortedCurrSnaps.map((s) => s.totalEngagement),
      followers: sortedCurrSnaps.map((s) => s.followerGrowth),
      engagementRate: sortedCurrSnaps.map((s) =>
        s.totalReach > 0 ? (s.totalEngagement / s.totalReach) * 100 : 0
      ),
    };

    if (sparklines.views.length === 0) {
      sparklines.views = [0, 0];
      sparklines.reach = [0, 0];
      sparklines.engagement = [0, 0];
      sparklines.followers = [0, 0];
      sparklines.engagementRate = [0, 0];
    }

    // 7. Format Daily Chart data (Group by date)
    const groupByDate = (list: typeof dailyMetrics) => {
      const map: Record<
        string,
        { views: number; reach: number; engagement: number; followers: number }
      > = {};
      list.forEach((m) => {
        const d = m.metricDate.split("T")[0];
        if (!map[d]) map[d] = { views: 0, reach: 0, engagement: 0, followers: 0 };
        map[d].views += m.views;
        map[d].reach += m.reach;
        map[d].engagement += m.engagement;
        map[d].followers += m.followerDelta;
      });
      return Object.entries(map)
        .map(([date, val]) => ({
          date,
          label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          views: val.views,
          reach: val.reach,
          engagement: val.engagement,
          followers: val.followers,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    };

    const formattedChart = groupByDate(currDaily);
    const formattedPrevChart = groupByDate(prevDaily);

    return {
      currCore,
      prevCore,
      chartData: formattedChart,
      prevChartData: formattedPrevChart,
      filteredTopContent: platformContent.sort((a, b) => b.engagementRate - a.engagementRate),
      platformSpecificMetrics: {
        ...platformSpecific,
        clicks: totalClicks,
        reactions: totalReactions,
        reposts: totalReposts,
        replies: totalReplies,
        ctr: avgCtr,
      },
      sparklines,
    };
  }, [
    snapshots,
    dailyMetrics,
    topContent,
    platformFilter,
    currentStart,
    currentEnd,
    prevStart,
    prevEnd,
  ]);

  // Dynamic values for breakdown sidebar
  const bdMetricData = React.useMemo(() => {
    const total = currCore[breakdownMetric];
    const totalPrev = prevCore[breakdownMetric];
    const delta = totalPrev > 0 ? ((total - totalPrev) / totalPrev) * 100 : total > 0 ? 100 : 0;
    const days = chartData.length || 1;

    let bestDay: { value: number; date: string } | null = null;
    let worstDay: { value: number; date: string } | null = null;

    if (chartData.length > 0) {
      const sorted = [...chartData].sort((a, b) => b[breakdownMetric] - a[breakdownMetric]);
      bestDay = { value: sorted[0][breakdownMetric], date: sorted[0].date };
      worstDay = {
        value: sorted[sorted.length - 1][breakdownMetric],
        date: sorted[sorted.length - 1].date,
      };
    }

    return {
      total,
      totalPrev,
      delta,
      dailyAverage: Math.round(total / days),
      bestDay,
      worstDay,
    };
  }, [currCore, prevCore, breakdownMetric, chartData]);

  const calcDelta = (curr: number, prev: number) => {
    return prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;
  };

  const currentEngagementRate =
    currCore.reach > 0 ? (currCore.engagement / currCore.reach) * 100 : 0;
  const prevEngagementRate =
    prevCore.reach > 0 ? (prevCore.engagement / prevCore.reach) * 100 : 0;

  const kpis = [
    {
      label: "Total Views",
      value: formatNumber(currCore.views),
      delta: calcDelta(currCore.views, prevCore.views),
      sparkline: sparklines.views,
      icon: <Eye className="w-[18px] h-[18px]" />,
    },
    {
      label: "Total Reach",
      value: formatNumber(currCore.reach),
      delta: calcDelta(currCore.reach, prevCore.reach),
      sparkline: sparklines.reach,
      icon: <Users className="w-[18px] h-[18px]" />,
    },
    {
      label: "Engagement",
      value: formatNumber(currCore.engagement),
      delta: calcDelta(currCore.engagement, prevCore.engagement),
      sparkline: sparklines.engagement,
      icon: <Heart className="w-[18px] h-[18px]" />,
    },
    {
      label: "Followers Gained",
      value: formatNumber(currCore.followers),
      delta: calcDelta(currCore.followers, prevCore.followers),
      sparkline: sparklines.followers,
      icon: <TrendingUp className="w-[18px] h-[18px]" />,
    },
    {
      label: "Engagement Rate",
      value: `${currentEngagementRate.toFixed(1)}%`,
      delta: calcDelta(currentEngagementRate, prevEngagementRate),
      sparkline: sparklines.engagementRate,
      icon: <BarChart3 className="w-[18px] h-[18px]" />,
    },
  ];

  return (
    <div className="py-8 px-8 mx-auto" style={{ maxWidth: 1440 }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">Analytics</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Detailed performance insights for your social channels.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PlatformSelect value={platformFilter} onChange={setPlatformFilter} />
            <button className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => {
            const isUp = kpi.delta >= 0;
            return (
              <div
                key={kpi.label}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[#F2F8D7] flex items-center justify-center shrink-0 text-gray-500">
                      {kpi.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-400">{kpi.label}</span>
                  </div>
                  <Sparkline data={kpi.sparkline} color="#82D616" />
                </div>
                <div className="text-[32px] font-black text-[#111827] tracking-tight leading-none">
                  {kpi.value}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className={cn("text-xs font-bold", isUp ? "text-[#16A34A]" : "text-rose-500")}
                  >
                    {isUp ? "↑" : "↓"} {Math.abs(kpi.delta).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-400">vs {previousLabel}</span>
                </div>
              </div>
            );
          })}
        </div>

        <PlatformSpecificMetricsSection
          platformFilter={platformFilter}
          platformSpecificMetrics={platformSpecificMetrics}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
            {(["views", "engagement", "reach", "followers"] as MetricKey[]).map((metric) => (
              <MetricChartCard
                key={metric}
                metric={metric}
                chartData={chartData}
                prevChartData={prevChartData}
              />
            ))}
          </div>

          {/* Breakdown Sidebar */}
          <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111827]">Breakdown</h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-0.5">
                {BREAKDOWN_METRICS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setBreakdownMetric(m.key)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-semibold rounded-md transition-all whitespace-nowrap",
                      breakdownMetric === m.key
                        ? "bg-[#82D616] text-white"
                        : "text-[#6B7280] hover:text-[#111827]"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <span className="text-xs font-medium text-[#6B7280]">
                  Total {METRIC_LABELS[breakdownMetric]}
                </span>
                <div className="text-2xl font-extrabold text-[#111827] mt-0.5">
                  {bdMetricData.total.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      "text-xs font-bold px-1.5 py-0.5 rounded",
                      bdMetricData.delta >= 0 ? "text-[#16A34A] bg-[#DCFCE7]" : "text-rose-500 bg-rose-50"
                    )}
                  >
                    {bdMetricData.delta >= 0 ? "↑" : "↓"} {Math.abs(bdMetricData.delta).toFixed(0)}%
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    vs {previousLabel} ({formatNumber(bdMetricData.totalPrev)})
                  </span>
                </div>
              </div>
              <div className="border-t border-[#F3F4F6]" />
              <div>
                <span className="text-xs font-medium text-[#6B7280]">Daily Average</span>
                <div className="text-2xl font-extrabold text-[#111827] mt-0.5">
                  {bdMetricData.dailyAverage.toLocaleString()}
                </div>
                <span
                  className={cn(
                    "text-xs font-bold mt-1 inline-block",
                    bdMetricData.delta >= 0 ? "text-[#16A34A]" : "text-rose-500"
                  )}
                >
                  {bdMetricData.delta >= 0 ? "↑" : "↓"} {Math.abs(bdMetricData.delta).toFixed(0)}%
                </span>
              </div>
              <div className="border-t border-[#F3F4F6]" />
              <div>
                <span className="text-xs font-medium text-[#6B7280]">Best Day</span>
                <div className="text-2xl font-extrabold text-[#111827] mt-0.5">
                  {bdMetricData.bestDay ? formatNumber(bdMetricData.bestDay.value) : "—"}
                </div>
                {bdMetricData.bestDay && (
                  <span className="text-xs text-[#6B7280] mt-0.5 block">
                    {new Date(bdMetricData.bestDay.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
              <div className="border-t border-[#F3F4F6]" />
              <div>
                <span className="text-xs font-medium text-[#6B7280]">Worst Day</span>
                <div className="text-2xl font-extrabold text-[#111827] mt-0.5">
                  {bdMetricData.worstDay ? formatNumber(bdMetricData.worstDay.value) : "—"}
                </div>
                {bdMetricData.worstDay && (
                  <span className="text-xs text-[#6B7280] mt-0.5 block">
                    {new Date(bdMetricData.worstDay.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content & Audience Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Content */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111827]">Top Performing Content</h3>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <button className="text-xs font-semibold text-[#82D616] hover:text-[#6BB012] transition-colors">
                View All
              </button>
            </div>

            {filteredTopContent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Eye className="w-10 h-10 text-[#D1D5DB] mb-2" />
                <p className="text-sm font-semibold text-[#6B7280]">
                  No content analytics available yet.
                </p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Content will appear here once published with analytics.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F3F4F6]">
                      {["Content", "Views", "Eng. Rate", "Likes", "Comments", "Shares", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-[11px] font-semibold text-[#6B7280] pb-3 pr-3 last:pr-0 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopContent.slice(0, 5).map((item) => (
                      <tr key={item.id} className="border-b border-[#F3F4F6]/60 last:border-b-0">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-[36px] h-[36px] rounded-lg bg-[#F4F4FA] overflow-hidden shrink-0 relative">
                              {item.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.thumbnail}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Eye className="w-3.5 h-3.5 text-[#D1D5DB]" />
                                </div>
                              )}
                              <PlatformBadge platform={item.platform} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#111827] truncate leading-snug">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <ContentTypeBadge type={item.contentType} />
                                {item.publishedDate && (
                                  <span className="text-[10px] text-[#9CA3AF]">
                                    {new Date(item.publishedDate).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-sm font-bold text-[#111827] whitespace-nowrap">
                          {formatNumber(item.views)}
                        </td>
                        <td className="py-3 pr-3 text-sm font-bold text-[#111827] whitespace-nowrap">
                          {item.engagementRate.toFixed(1)}%
                        </td>
                        <td className="py-3 pr-3 text-sm font-bold text-[#111827] whitespace-nowrap">
                          {formatNumber(item.likes)}
                        </td>
                        <td className="py-3 pr-3 text-sm font-bold text-[#111827] whitespace-nowrap">
                          {item.comments}
                        </td>
                        <td className="py-3 pr-3 text-sm font-bold text-[#111827] whitespace-nowrap">
                          {formatNumber(item.shares)}
                        </td>
                        <td className="py-3 pr-0">
                          <button className="p-1 hover:bg-[#F9FAFB] rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4 text-[#9CA3AF]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audience Insights */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <h3 className="text-base font-bold text-[#111827]">Audience Insights</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Gender */}
              <div className="bg-[#F9FAFB] rounded-xl p-4 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#6B7280] mb-3">Gender</span>
                <DonutChart
                  segments={[
                    { value: 62.4, color: "#82D616" },
                    { value: 37.6, color: "#60A5FA" },
                  ]}
                />
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#82D616]" />
                    <span className="text-[10px] text-[#6B7280]">Male</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                    <span className="text-[10px] text-[#6B7280]">Female</span>
                  </div>
                </div>
              </div>

              {/* Age */}
              <div className="bg-[#F9FAFB] rounded-xl p-4">
                <span className="text-xs font-semibold text-[#6B7280] mb-3 block">Age Range</span>
                <div className="space-y-2.5">
                  {[
                    { label: "18-24", value: 12.8 },
                    { label: "25-34", value: 38.6 },
                    { label: "35-44", value: 27.3 },
                    { label: "45-54", value: 14.2 },
                    { label: "55+", value: 7.1 },
                  ].map((age) => (
                    <div key={age.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-[#6B7280]">{age.label}</span>
                        <span className="text-[10px] font-bold text-[#111827]">{age.value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#82D616]"
                          style={{ width: `${age.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div className="bg-[#F9FAFB] rounded-xl p-4">
                <span className="text-xs font-semibold text-[#6B7280] mb-3 block">
                  Top Locations
                </span>
                <div className="space-y-2.5">
                  {[
                    { rank: 1, country: "United States", pct: 32.4 },
                    { rank: 2, country: "Germany", pct: 8.7 },
                    { rank: 3, country: "United Kingdom", pct: 6.1 },
                  ].map((loc) => (
                    <div key={loc.rank} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#9CA3AF] w-3">{loc.rank}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-[#111827] truncate">
                            {loc.country}
                          </span>
                          <span className="text-[11px] font-bold text-[#111827]">{loc.pct}%</span>
                        </div>
                        <div className="w-full h-1 bg-[#E5E7EB] rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#82D616]"
                            style={{ width: `${loc.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device */}
              <div className="bg-[#F9FAFB] rounded-xl p-4 flex flex-col items-center">
                <span className="text-xs font-semibold text-[#6B7280] mb-3">Device</span>
                <DonutChart
                  segments={[
                    { value: 78.2, color: "#82D616" },
                    { value: 18.6, color: "#60A5FA" },
                    { value: 3.2, color: "#D1D5DB" },
                  ]}
                />
                <div className="flex flex-col gap-1.5 mt-3 w-full">
                  {[
                    { label: "Mobile", value: "78.2%", color: "#82D616" },
                    { label: "Desktop", value: "18.6%", color: "#60A5FA" },
                    { label: "Tablet", value: "3.2%", color: "#D1D5DB" },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-[10px] text-[#6B7280]">{d.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#111827]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
