import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { useId } from "react";
import { cn, formatNumber } from "@/lib/utils";
import { PLATFORM_LABELS } from "@/types";
import {
  Eye,
  Heart,
  TrendingUp,
  BarChart3,
  Users,
  Download,
  FileText,
  RefreshCw,
  Globe,
  ChevronDown,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

type ChartMetric = "views" | "reach" | "engagement" | "followers";

// ─── SVG Helpers ─────────────────────────────────────────────────────────────

function Sparkline({ data, color = "#F2485A" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  const w = 56; const h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`);
  return (
    <svg width={w} height={h} className="overflow-visible shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points.join(" ")} />
    </svg>
  );
}

function AreaChartSVG({
  data,
  width = 420,
  height = 180,
  color = "#F2485A",
  gradient = true,
  xLabels,
  yTicks,
  yFormatter,
  previousData,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gradient?: boolean;
  xLabels?: string[];
  yTicks?: number[];
  yFormatter?: (v: number) => string;
  previousData?: number[];
}) {
  const randomId = useId().replace(/:/g, "");
  const gradientId = `areaGrad-${randomId}`;

  if (data.length < 2) {
    return <div className="flex items-center justify-center h-[180px] text-xs text-[#9CA3AF]">Insufficient data</div>;
  }

  const max = Math.max(...data, ...(previousData || []), 1);
  const min = Math.min(...data, ...(previousData || []), 0);
  const range = max - min === 0 ? 1 : max - min;
  const pad = 5;
  const chartW = width - pad * 2;
  const chartH = height - pad * 2;

  const toPoint = (v: number, i: number) => {
    const x = pad + (i / (data.length - 1)) * chartW;
    const y = pad + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  };

  const points = data.map((v, i) => toPoint(v, i));
  const areaPoints = [...points, `${pad + chartW},${pad + chartH}`, `${pad},${pad + chartH}`].join(" ");

  const xTickLabels = xLabels || data.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - data.length + i + 1);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const defaultYTicks = yTicks || (() => {
    const step = Math.ceil((max - min) / 4) || 1;
    const ticks: number[] = [];
    for (let v = min; v <= max; v += step) {
      ticks.push(Math.round(v));
    }
    return ticks.length > 1 ? ticks : [0, max];
  })();

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
      )}

      {/* Previous period dotted line */}
      {previousData && previousData.length >= 2 && (
        <polyline
          fill="none"
          stroke="#D1D5DB"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={previousData.map((v, i) => toPoint(v, i)).join(" ")}
        />
      )}

      {/* Gradient fill */}
      {gradient && <polygon fill={`url(#${gradientId})`} points={areaPoints} />}

      {/* Line */}
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points.join(" ")} />

      {/* Y-axis labels */}
      {defaultYTicks.map((v) => (
        <text key={v} x={pad - 4} y={pad + chartH - ((v - min) / range) * chartH + 4} textAnchor="end" fill="#9CA3AF" fontSize="10" fontFamily="system-ui">
          {yFormatter ? yFormatter(v) : formatNumber(v)}
        </text>
      ))}

      {/* X-axis labels */}
      {xTickLabels.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0 || i === data.length - 1).map((label, i) => {
        const origI = data.length > 1 ? Math.round((i / Math.max(1, Math.floor(data.length / 5) - 1)) * (data.length - 1)) : 0;
        const idx = data.length > 1 ? Math.min(origI, data.length - 1) : 0;
        const x = pad + (idx / (data.length - 1)) * chartW;
        return (
          <text key={label + i} x={x} y={height - 3} textAnchor="middle" fill="#9CA3AF" fontSize="10" fontFamily="system-ui">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function PlatformIconSVG({ platform }: { platform: string }) {
  const icons: Record<string, { bg: string; label: string }> = {
    INSTAGRAM: { bg: "bg-gradient-to-br from-purple-500 to-pink-500", label: "IG" },
    YOUTUBE: { bg: "bg-red-500", label: "YT" },
    LINKEDIN: { bg: "bg-blue-600", label: "LI" },
    TIKTOK: { bg: "bg-black", label: "TT" },
    TWITTER: { bg: "bg-sky-500", label: "X" },
    FACEBOOK: { bg: "bg-blue-500", label: "FB" },
  };
  const meta = icons[platform] || { bg: "bg-gray-400", label: "?" };
  return (
    <div className={`w-6 h-6 rounded-md ${meta.bg} flex items-center justify-center shrink-0`}>
      <span className="text-[9px] font-bold text-white">{meta.label}</span>
    </div>
  );
}

function PlatformOverlay({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    INSTAGRAM: "text-purple-500",
    YOUTUBE: "text-red-500",
    LINKEDIN: "text-blue-600",
    TIKTOK: "text-black",
    TWITTER: "text-sky-500",
    FACEBOOK: "text-blue-500",
  };
  const color = icons[platform] || "text-gray-400";
  return (
    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-md bg-white/90 backdrop-blur-sm border border-white/60 flex items-center justify-center shadow-sm">
      <Globe className={`w-3 h-3 ${color}`} />
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default async function ClientAnalyticsPage({ params }: PageProps) {
  await requireAdmin();
  const { id: clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { brandName: true, healthScore: true },
  });

  if (!client) notFound();

  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentSnaps, previousSnaps, dailyMetrics, topContent, products] = await Promise.all([
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
      include: {
        analytics: true,
      },
      orderBy: { analytics: { engagementRate: "desc" } },
      take: 5,
    }),
    prisma.product.findMany({
      where: { clientId, status: "ACTIVE" },
      include: {
        contents: {
          include: {
            content: {
              include: { analytics: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // ─── Aggregate current period ──────────────────────────────────────────────
  const curr = currentSnaps.reduce(
    (acc, s) => ({
      views: acc.views + Number(s.totalViews),
      reach: acc.reach + Number(s.totalReach),
      engagement: acc.engagement + Number(s.totalEngagement),
      likes: acc.likes + Number(s.totalLikes),
      comments: acc.comments + Number(s.totalComments),
      shares: acc.shares + Number(s.totalShares),
      followers: acc.followers + s.followerGrowth,
      posts: acc.posts + s.postCount,
    }),
    { views: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0, followers: 0, posts: 0 }
  );

  const prev = previousSnaps.reduce(
    (acc, s) => ({
      views: acc.views + Number(s.totalViews),
      reach: acc.reach + Number(s.totalReach),
      engagement: acc.engagement + Number(s.totalEngagement),
      followers: acc.followers + s.followerGrowth,
      posts: acc.posts + s.postCount,
    }),
    { views: 0, reach: 0, engagement: 0, followers: 0, posts: 0 }
  );

  const delta = (cur: number, prv: number) =>
    prv > 0 ? ((cur - prv) / prv) * 100 : cur > 0 ? 100 : 0;

  const engagementRate = curr.reach > 0 ? (curr.engagement / curr.reach) * 100 : 0;

  // ─── KPI sparkline data ────────────────────────────────────────────────────
  const snapMonths = [...currentSnaps].sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());
  const kpiSparklines = {
    views: snapMonths.map(s => Number(s.totalViews)),
    reach: snapMonths.map(s => Number(s.totalReach)),
    engagement: snapMonths.map(s => Number(s.totalEngagement)),
    followers: snapMonths.map(s => s.followerGrowth),
    posts: snapMonths.map(s => s.postCount),
  };

  // ─── Chart time-series data ────────────────────────────────────────────────
  const dailyData = dailyMetrics.reduce((acc: Record<string, { views: number; reach: number; engagement: number; followers: number }>, m) => {
    const k = m.metricDate.toISOString().split("T")[0];
    if (!acc[k]) acc[k] = { views: 0, reach: 0, engagement: 0, followers: 0 };
    acc[k].views += Number(m.views);
    acc[k].reach += Number(m.reach);
    acc[k].engagement += Number(m.engagement);
    acc[k].followers += m.followerDelta;
    return acc;
  }, {});

  const chartData = Object.entries(dailyData).slice(-30).map(([date, d]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: d.views,
    reach: d.reach,
    engagement: d.engagement,
    followers: d.followers,
  }));

  // ─── Platform breakdown ────────────────────────────────────────────────────
  const platformData = currentSnaps.map((s) => ({
    name: s.platform,
    label: PLATFORM_LABELS[s.platform as keyof typeof PLATFORM_LABELS] || s.platform,
    reach: Number(s.totalReach),
    engagement: Number(s.totalEngagement),
  }));

  const totalReach = platformData.reduce((sum, p) => sum + p.reach, 0);

  // ─── Growth chart data ─────────────────────────────────────────────────────
  const growthData = Object.entries(
    dailyMetrics.reduce((acc: Record<string, number>, m) => {
      const k = m.metricDate.toISOString().split("T")[0];
      acc[k] = (acc[k] || 0) + m.followerDelta;
      return acc;
    }, {})
  ).slice(-30).map(([date, followers]) => ({ date, followers }));

  const cumulativeFollowers = growthData.reduce((sum, d) => sum + d.followers, 0);
  const followerGrowthPositive = cumulativeFollowers >= 0;

  const growthValues = growthData.map(d => d.followers);
  const cumulativeGrowthValues = (() => {
    const vals: number[] = [];
    let running = 0;
    for (const d of growthData) {
      running += d.followers;
      vals.push(running);
    }
    return vals;
  })();

  // ─── Top content (take top 3 for showcase) ────────────────────────────────
  const showcaseContent = topContent.slice(0, 3);

  // ─── Product performance ──────────────────────────────────────────────────
  const productPerformance = products.map((p) => {
    const contentItems = p.contents.filter(c => c.content.analytics);
    const postsCount = contentItems.length;
    const totalReachP = contentItems.reduce((sum, c) => sum + Number(c.content.analytics?.reach || 0), 0);
    const totalLikesP = contentItems.reduce((sum, c) => sum + (c.content.analytics?.likes || 0), 0);
    const totalCommentsP = contentItems.reduce((sum, c) => sum + (c.content.analytics?.comments || 0), 0);
    const totalSharesP = contentItems.reduce((sum, c) => sum + (c.content.analytics?.shares || 0), 0);
    const engagementRateP = totalReachP > 0 ? ((totalLikesP + totalCommentsP + totalSharesP) / totalReachP) * 100 : 0;
    return {
      name: p.name,
      posts: postsCount,
      reach: totalReachP,
      engagement: engagementRateP,
      performance: engagementRateP >= 5 ? "Top Performer" : engagementRateP >= 3 ? "High" : engagementRateP >= 1.5 ? "Medium" : "Low",
    };
  }).filter(p => p.posts > 0).sort((a, b) => b.engagement - a.engagement);

  function getPerformanceBadge(level: string) {
    switch (level) {
      case "Top Performer":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "High":
        return "text-green-700 bg-green-50 border-green-200";
      case "Medium":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "Low":
        return "text-rose-700 bg-rose-50 border-rose-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  }

  // ─── KPI definitions ──────────────────────────────────────────────────────
  const kpis = [
    { label: "Total Views", value: formatNumber(curr.views), icon: Eye, delta: delta(curr.views, prev.views), color: "#F2485A", sparkData: kpiSparklines.views },
    { label: "Total Reach", value: formatNumber(curr.reach), icon: Users, delta: delta(curr.reach, prev.reach), color: "#F2485A", sparkData: kpiSparklines.reach },
    { label: "Engagement Rate", value: `${engagementRate.toFixed(1)}%`, icon: Heart, delta: delta(curr.reach > 0 ? curr.engagement / curr.reach : 0, prev.reach > 0 ? prev.engagement / prev.reach : 0), color: "#F2485A", sparkData: kpiSparklines.engagement },
    { label: "Followers Gained", value: formatNumber(curr.followers), icon: TrendingUp, delta: delta(curr.followers, prev.followers), color: "#F2485A", sparkData: kpiSparklines.followers },
    { label: "Posts Published", value: String(curr.posts), icon: BarChart3, delta: delta(curr.posts, prev.posts), color: "#F2485A", sparkData: kpiSparklines.posts },
  ];

  return (
    <div className="px-8 py-8 max-w-[1440px] mx-auto w-full space-y-6">
      {/* ─── Section 3: Filtering & KPI Summary Layer ────────────────────────── */}
      <div className="bg-white border border-[#ECECF4] rounded-2xl p-5">
        <div className="flex items-center justify-between">
          {/* Left: Date Filter + Compare Toggle */}
          <div className="flex items-center gap-4">
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 flex items-center gap-1.5">
              Last 30 Days
              <ChevronDown className="w-3 h-3" />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div className="relative w-9 h-5">
                <div className="absolute inset-0 rounded-full bg-[#F2485A] transition-colors" />
                <div className="absolute top-0.5 left-[18px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform" />
              </div>
              <span className="text-xs font-semibold text-gray-600 select-none">Compare Previous Period</span>
            </label>
          </div>

          {/* Right: Utility Buttons */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export Report
            </button>
            <button className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              Generate PDF
            </button>
            <button className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ─── 5-Column KPI Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isUp = kpi.delta > 0;
          return (
            <div key={kpi.label} className="bg-white border border-[#ECECF4] rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-full bg-[#FFE3E3] flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px] text-gray-500" />
                </div>
                <Sparkline data={kpi.sparkData} color={kpi.color} />
              </div>
              <div className="mt-1">
                <div className="text-[32px] font-black text-gray-900 tracking-tight leading-none">
                  {kpi.value}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("text-xs font-bold", isUp ? "text-[#16A34A]" : "text-rose-500")}>
                    {isUp ? "↑" : "↓"} {Math.abs(kpi.delta).toFixed(1)}% vs previous 30 days
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Section 4: Row A — Mid-section Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module 1: Performance Over Time (spans 6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[#ECECF4] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-base font-bold text-gray-900">Performance Over Time</h3>
              <p className="text-xs font-medium text-gray-400">Track reach, views and engagement trends.</p>
            </div>
            <div className="flex items-center bg-white border border-[#ECECF4] rounded-full p-0.5">
              {(["views", "reach", "engagement", "followers"] as ChartMetric[]).map((m) => (
                <span
                  key={m}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-bold cursor-default",
                    m === "views" ? "bg-[#F2485A] text-gray-900" : "text-gray-500"
                  )}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </span>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-sm text-[#9CA3AF]">No time-series data available</div>
          ) : (
            <div className="mt-4">
              <AreaChartSVG
                data={chartData.map(d => d.views)}
                previousData={chartData.map(d => Math.round(d.views * 0.85))}
                height={200}
                width={500}
                xLabels={chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 5)) === 0 || i === chartData.length - 1).map(d => d.label)}
                yFormatter={(v) => formatNumber(v)}
              />

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-0.5 bg-[#F2485A]" />
                  <span className="text-xs text-gray-500 font-medium">Current Period</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-0 border-t border-dashed border-gray-300" />
                  <span className="text-xs text-gray-500 font-medium">Previous Period</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Module 2: Platform Performance (spans 3 cols) */}
        <div className="lg:col-span-3 bg-white border border-[#ECECF4] rounded-2xl p-5 flex flex-col">
          <div className="mb-1">
            <h3 className="text-base font-bold text-gray-900">Platform Performance</h3>
            <p className="text-xs font-medium text-gray-400">Breakdown by reach</p>
          </div>

          {platformData.length === 0 ? (
            <div className="flex items-center justify-center flex-1 text-xs text-[#9CA3AF]">No platform data</div>
          ) : (
            <div className="flex-1 flex flex-col justify-between space-y-3">
              {platformData.map((p) => {
                const pct = totalReach > 0 ? (p.reach / totalReach) * 100 : 0;
                return (
                  <div key={p.name} className="flex items-center gap-3">
                    <PlatformIconSVG platform={p.name} />
                    <div className="flex-1 min-w-0">
                      <div className="w-full h-2 rounded-full bg-[#F4F4FA] overflow-hidden">
                        <div className="h-full rounded-full bg-[#F2485A] transition-all" style={{ width: `${Math.max(pct, 1)}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-gray-900 block leading-none">{pct.toFixed(0)}%</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{formatNumber(p.reach)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button className="text-xs font-bold text-gray-700 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              View Full Breakdown
            </button>
          </div>
        </div>

        {/* Module 3: Audience Growth (spans 3 cols) */}
        <div className="lg:col-span-3 bg-white border border-[#ECECF4] rounded-2xl p-5 flex flex-col">
          <div className="mb-1">
            <h3 className="text-base font-bold text-gray-900">Audience Growth</h3>
            <p className="text-xs font-medium text-gray-400">Net follower growth over time</p>
          </div>

          {/* Big number + delta */}
          <div className="mb-1">
            <div className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none">
              {formatNumber(cumulativeFollowers)}
            </div>
            <span className={cn("text-xs font-bold mt-1 block", followerGrowthPositive ? "text-[#16A34A]" : "text-rose-500")}>
              {followerGrowthPositive ? "↑" : "↓"} {Math.abs(cumulativeFollowers)} vs previous 30 days
            </span>
          </div>

          {/* Mini area chart */}
          {growthValues.length >= 2 ? (
            <div className="mt-2">
              <AreaChartSVG
                data={cumulativeGrowthValues}
                height={80}
                width={280}
                xLabels={["Apr 27", "May 11", "May 26"]}
                yFormatter={(v) => formatNumber(v)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[80px] text-xs text-[#9CA3AF]">No growth data</div>
          )}

          {/* Footer stats grid */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Followers</span>
              <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                {curr.reach > 0 ? formatNumber(curr.reach + curr.followers) : "—"}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Net Growth</span>
              <span className={cn("text-sm font-bold mt-0.5 block", followerGrowthPositive ? "text-[#16A34A]" : "text-rose-500")}>
                {followerGrowthPositive ? "+" : ""}{formatNumber(cumulativeFollowers)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Growth Rate</span>
              <span className={cn("text-sm font-bold mt-0.5 block", followerGrowthPositive ? "text-[#16A34A]" : "text-rose-500")}>
                ↑ {Math.abs(curr.followers > 0 ? cumulativeFollowers / curr.followers * 100 : 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section 4: Row B — Content & Products Grid ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module 4: Top Performing Content (spans 7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#ECECF4] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-base font-bold text-gray-900">Top Performing Content</h3>
              <p className="text-xs font-medium text-gray-400">Ranked by engagement rate</p>
            </div>
            <div className="text-xs font-bold text-gray-700 border border-gray-200 bg-white px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              Sort by: Engagement
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {showcaseContent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-10 h-10 text-[#D1D5DB] mb-2" />
              <p className="text-sm font-semibold text-[#6B7280]">No content analytics available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {showcaseContent.map((item) => {
                const analytics = item.analytics;
                const reach = Number(analytics?.reach || 0);
                const likes = analytics?.likes || 0;
                const comments = analytics?.comments || 0;
                const shares = analytics?.shares || 0;
                const engRate = Number(analytics?.engagementRate || 0) * 100;
                const dateStr = item.publishDate || item.scheduledAt || item.updatedAt;
                const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
                const thumbnail = item.assetUrls?.[0] || null;

                return (
                  <div key={item.id} className="border border-[#ECECF4] rounded-xl overflow-hidden bg-white">
                    {/* Thumbnail */}
                    <div className="relative h-[120px] bg-[#F4F4FA] overflow-hidden">
                      {thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-[#D1D5DB]" />
                        </div>
                      )}
                      <PlatformOverlay platform={item.platform} />
                    </div>
                    {/* Body */}
                    <div className="p-3 space-y-2">
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">{item.title}</h4>
                      <span className="text-[10px] font-semibold text-gray-400 block">{formattedDate}</span>
                      {/* Micro stats */}
                      <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-gray-100">
                        {[
                          { label: "Reach", value: formatNumber(reach) },
                          { label: "Engagement", value: `${engRate.toFixed(1)}%` },
                          { label: "Likes", value: formatNumber(likes) },
                          { label: "Comments", value: formatNumber(comments) },
                          { label: "Shares", value: formatNumber(shares) },
                        ].map((stat) => (
                          <div key={stat.label} className="text-center">
                            <span className="text-[9px] uppercase font-bold text-gray-400 block leading-tight">{stat.label}</span>
                            <span className="text-xs font-bold text-gray-800 block mt-0.5">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button className="text-xs font-bold text-gray-700 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              View All Content
            </button>
          </div>
        </div>

        {/* Module 5: Product Performance (spans 5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#ECECF4] rounded-2xl p-5">
          <div className="mb-1">
            <h3 className="text-base font-bold text-gray-900">Product Performance</h3>
            <p className="text-xs font-medium text-gray-400">Performance attributed to products mentioned</p>
          </div>

          {productPerformance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-10 h-10 text-[#D1D5DB] mb-2" />
              <p className="text-sm font-semibold text-[#6B7280]">No product attribution data</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Link products to content to see performance.</p>
            </div>
          ) : (
            <div className="mt-4">
              {/* Table header */}
              <div className="grid grid-cols-5 gap-2 pb-2 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Posts</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Reach</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Engagement</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Performance</span>
              </div>
              {/* Table rows */}
              <div className="space-y-2 mt-2">
                {productPerformance.map((p) => (
                  <div key={p.name} className="grid grid-cols-5 gap-2 items-center py-2">
                    <span className="text-xs font-semibold text-gray-800 truncate">{p.name}</span>
                    <span className="text-xs font-semibold text-gray-700 text-center">{p.posts}</span>
                    <span className="text-xs font-semibold text-gray-700 text-center">{formatNumber(p.reach)}</span>
                    <span className="text-xs font-semibold text-gray-700 text-center">{p.engagement.toFixed(1)}%</span>
                    <div className="text-right">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPerformanceBadge(p.performance)}`}>
                        {p.performance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button className="text-xs font-bold text-gray-700 border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              View All Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
