"use client";

import * as React from "react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  Eye, Heart, UserPlus, FileText, Package, Calendar, Users, ArrowUpRight,
  BarChart3, CheckCircle, MessageCircle, Upload, Target,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

interface ClientData {
  brandName: string; description: string | null; status: string;
  monthlyBudget: number; monthlyRetainer: number;
}

interface ContentItem {
  id: string; title: string; topic: string | null; platform: string; contentType: string; status: string;
  caption: string | null; script: string | null; assetUrls: string[]; hashtags: string[];
  scheduledAt: string | null; publishDate: string | null; adSpend: number | null;
  views: number; reach: number; likes: number; comments: number; shares: number; engagementRate: number;
}

interface ProductItem {
  id: string; name: string; category: string | null; status: string;
  postCount: number; totalReach: number; totalEngagement: number; totalViews: number;
}

interface ActivityItem {
  id: string; title: string; action: string; actor: string | null; date: string;
}

interface TrendMonth {
  month: string; views: number; reach: number; followers: number; engagementRate: number; postCount: number;
}

interface DashboardData {
  client: ClientData | null;
  thisMonth: { views: number; reach: number; engagementRate: number; followers: number; postCount: number; productCount: number; adSpend: number };
  lastMonth: { views: number; reach: number; engagementRate: number; followers: number; postCount: number };
  monthlyTrend: TrendMonth[];
  topContent: ContentItem[];
  products: ProductItem[];
  upcomingContent: ContentItem[];
  recentActivity: ActivityItem[];
  budget: { monthly: number; spent: number; retainer: number };
  pendingContent: number;
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function Sparkline70({ data, color = "#F2485A" }: { data: number[]; color?: string }) {
  const w = 70; const h = 28;
  let points: string;
  if (data.length < 2) {
    const baseY = h / 2;
    points = data.length === 1
      ? `0,${baseY} ${w},${baseY}`
      : `0,${baseY} ${w},${baseY}`;
  } else {
    const max = Math.max(...data); const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  }
  return (
    <svg width={w} height={h} className="overflow-visible shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    INSTAGRAM: "bg-pink-50 text-pink-600", FACEBOOK: "bg-blue-50 text-blue-600",
    LINKEDIN: "bg-sky-50 text-sky-600", TIKTOK: "bg-rose-50 text-rose-600",
    YOUTUBE: "bg-red-50 text-red-600", X: "bg-zinc-50 text-zinc-600",
  };
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${colors[platform] || "bg-gray-50 text-gray-600"}`}>
      {platform.charAt(0) + platform.slice(1).toLowerCase()}
    </span>
  );
}

const statusColors: Record<string, string> = {
  APPROVED: "bg-[#EFF6FF] text-[#2563EB]",
  SCHEDULED: "bg-[#EFF6FF] text-[#2563EB]",
  "CLIENT_APPROVAL_PENDING": "bg-[#FEF3C7] text-[#F59E0B]",
  POSTED: "bg-emerald-50 text-emerald-600",
  REJECTED: "bg-rose-50 text-rose-600",
  DRAFT: "bg-gray-100 text-gray-500",
  IDEA: "bg-gray-100 text-gray-500",
  ARCHIVED: "bg-gray-100 text-gray-500",
  IN_PROGRESS: "bg-[#F5F3FF] text-[#7C3AED]",
};

function StatusBadge({ status }: { status: string }) {
  const style = statusColors[status] || "bg-gray-100 text-gray-500";
  const label = status === "CLIENT_APPROVAL_PENDING" ? "Pending Approval" : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  return <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${style}`}>{label}</span>;
}

function formatNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

/* ═══════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════ */

function HeroSection({ client, budget }: { client: ClientData | null; budget: DashboardData["budget"] }) {
  const pct = budget.monthly > 0 ? Math.min(100, (budget.spent / budget.monthly) * 100) : 0;
  return (
    <div className="flex justify-between items-start w-full mb-8">
      <div className="flex flex-col justify-center min-w-0">
        <div className="space-y-1">
          <p className="text-xl font-extrabold text-gray-900 tracking-tight">Hi 👋</p>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Here&apos;s how your brand performed this month.
          </h1>
        </div>
      </div>
      <div className="flex items-stretch gap-4 shrink-0">
        <div className="bg-white border border-[#ECECF4] rounded-2xl p-4 min-w-[220px] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FFF7ED] flex items-center justify-center shrink-0">
            <Target className="w-[16px] h-[16px] text-[#EA580C]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Campaign Goal</p>
            <p className="text-sm font-medium text-gray-700 truncate">
              {client?.description || "No goal specified."}
            </p>
          </div>
        </div>
        <div className="bg-white border border-[#ECECF4] rounded-2xl p-5 min-w-[300px] flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Monthly Budget</span>
          {budget.monthly > 0 && (
            <span className="text-xs text-gray-500">
              <span className="font-bold text-gray-900">{formatCurrency(budget.spent)}</span> spent ({pct.toFixed(0)}%)
            </span>
          )}
        </div>
        <div className="text-2xl font-black text-gray-900">
          {budget.monthly > 0 ? formatCurrency(budget.monthly) : "No budget set"}
        </div>
        {budget.monthly > 0 && (
          <div className="w-full h-2 bg-gray-100 rounded-full relative">
            <div className="h-full rounded-full bg-[#F2485A] transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

/* ═══════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════ */

function KpiCard({ label, value, delta, icon: Icon, sparkline, isPercent = false }: {
  label: string; value: number; delta: number; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; sparkline: number[]; isPercent?: boolean;
}) {
  const displayValue = isPercent ? `${value.toFixed(1)}%` : formatNum(value);
  const isUp = delta > 0;
  return (
    <div className="bg-white border border-[#ECECF4] rounded-2xl p-4 flex flex-col justify-between min-h-[130px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(16,24,40,0.08)]" style={{ boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FFE3E3] flex items-center justify-center shrink-0">
            <Icon className="w-[14px] h-[14px] text-[#6B7280]" strokeWidth={1.75} />
          </div>
          <span className="text-[11px] font-semibold text-gray-500">{label}</span>
        </div>
        <Sparkline70 data={sparkline} />
      </div>
      <div>
        <div className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">{displayValue}</div>
        <div className="flex items-center gap-1">
          {delta !== 0 && (
            <span className={cn("text-[11px] font-bold", isUp ? "text-[#16A34A]" : "text-rose-500")}>
              {isUp ? "↑" : "↓"} {Math.abs(delta).toFixed(0)}%
            </span>
          )}
          <span className="text-[11px] text-gray-400">vs last month</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   KPI ROW
   ═══════════════════════════════════════════════ */

function KpiRow({ tm, lm, trend }: {
  tm: DashboardData["thisMonth"]; lm: DashboardData["lastMonth"]; trend: TrendMonth[];
}) {
  const delta = (c: number, p: number) => p > 0 ? ((c - p) / p) * 100 : c > 0 ? 100 : 0;
  const tv = (key: string) => trend.map(m => Number((m as unknown as Record<string, unknown>)[key]));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      <KpiCard label="Views" value={tm.views} delta={delta(tm.views, lm.views)} icon={Eye} sparkline={tv("views")} />
      <KpiCard label="Reach" value={tm.reach} delta={delta(tm.reach, lm.reach)} icon={Users} sparkline={tv("reach")} />
      <KpiCard label="Engagement Rate" value={tm.engagementRate} delta={delta(tm.engagementRate, lm.engagementRate)} icon={Heart} sparkline={tv("engagementRate")} isPercent />
      <KpiCard label="Followers Gained" value={tm.followers} delta={delta(tm.followers, lm.followers)} icon={UserPlus} sparkline={tv("followers")} />
      <KpiCard label="Posts Published" value={tm.postCount} delta={delta(tm.postCount, lm.postCount)} icon={FileText} sparkline={tv("postCount")} />
      <KpiCard label="Products Promoted" value={tm.productCount} delta={0} icon={Package} sparkline={[]} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PERFORMANCE CHART
   ═══════════════════════════════════════════════ */

const METRIC_PILLS = [
  { key: "views", label: "Views" },
  { key: "reach", label: "Reach" },
  { key: "followers", label: "Followers" },
  { key: "engagementRate", label: "Engagement" },
];

function PerformanceChart({ data }: { data: TrendMonth[] }) {
  const [active, setActive] = React.useState("views");

  const currentData = data.map(d => ({ month: d.month, value: Number((d as unknown as Record<string, unknown>)[active]) }));

  const formatTooltip = (v: number) => {
    if (active === "engagementRate") return `${v.toFixed(1)}%`;
    return formatNum(v);
  };

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6" style={{ boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[18px] font-semibold text-[#111827]">Performance Over Time</h3>
        </div>
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-sm text-[#6B7280]">No performance data available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6" style={{ boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[18px] font-semibold text-[#111827]">Performance Over Time</h3>
        <div className="flex items-center gap-1.5">
          {METRIC_PILLS.map(m => (
            <button key={m.key} onClick={() => setActive(m.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-[10px] text-sm font-medium transition-all duration-200",
                active === m.key ? "bg-[#F2485A] text-white" : "bg-[#F5F6FA] text-[#6B7280] hover:bg-[#EEF0F6]"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentData} margin={{ top: 5, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F2485A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F2485A" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F6" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={{ stroke: "#EEF0F6" }} tickLine={false} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v: number) => formatNum(v)} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF", border: "1px solid #ECECF4", borderRadius: "14px",
                color: "#111827", fontSize: 13, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
              cursor={{ stroke: "#EEF0F6", strokeDasharray: "3 3" }}
              formatter={(value) => {
                const v = Number(value);
                return [formatTooltip(v), active === "engagementRate" ? "Engagement Rate" : active.charAt(0).toUpperCase() + active.slice(1)];
              }}
            />
            <Area type="monotone" dataKey="value" stroke="#F2485A" strokeWidth={3} fill="url(#colorValue)" dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: "#F2485A" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TOP PERFORMING CONTENT
   ═══════════════════════════════════════════════ */

function TopContentCard({ item, rank }: { item: ContentItem; rank: number }) {
  return (
    <Link href={`/client/content/${item.id}`}
      className="block bg-white border border-[#ECECF4] rounded-[24px] overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(16,24,40,0.08)]" style={{ boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}
    >
      <div className="aspect-video w-full relative bg-gradient-to-br from-[#FFE3E3] to-[#FFE3E3]">
        {item.assetUrls.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.assetUrls[0]} alt="" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-[#6B7280]/30" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <PlatformBadge platform={item.platform} />
        </div>
        {rank === 1 && (
          <div className="absolute top-2 right-2 bg-[#F2485A] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
            #1
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[11px] font-bold text-gray-800 line-clamp-2">{item.title}</p>
        <p className="text-[9px] text-gray-400 mt-0.5 mb-2">{item.contentType}</p>
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: "Reach", value: formatNum(item.reach) },
            { label: "Engagement Rate", value: `${item.engagementRate.toFixed(1)}%` },
            { label: "Likes", value: formatNum(item.likes) },
            { label: "Shares", value: formatNum(item.shares) },
          ].map(stat => (
            <div key={stat.label} className="bg-[#F9FAFB] rounded-[8px] px-2 py-1">
              <span className="text-[9px] text-gray-400">{stat.label}</span>
              <p className="text-[11px] font-bold text-gray-800">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

function TopContentSection({ items }: { items: ContentItem[] }) {
  const displayItems = items.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[18px] font-semibold text-[#111827]">Top Performing Content</h3>
        <Link href="/client/content" className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1">
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {displayItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {displayItems.map((item, i) => (
            <TopContentCard key={item.id} item={item} rank={i + 1} />
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">No content yet</p>
          <p className="text-xs text-gray-300 mt-1">Create your first post to see performance here</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PRODUCT PERFORMANCE TABLE
   ═══════════════════════════════════════════════ */

const performanceLabels: Record<string, { label: string; style: string; icon?: string }> = {
  top: { label: "Top Performer", style: "bg-[#DCFCE7] text-[#F2485A]" },
  strong: { label: "Strong", style: "bg-[#FFE3E3] text-[#F2485A]" },
  average: { label: "Average", style: "bg-[#FEF3C7] text-[#92400E]" },
  focus: { label: "Needs Focus", style: "bg-[#FEE2E2] text-[#B91C1C]", icon: "↓" },
};

function ProductTable({ items }: { items: ProductItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6" style={{ boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}>
        <h3 className="text-[18px] font-semibold text-[#111827] mb-1">Product Performance</h3>
        <p className="text-sm text-[#6B7280]">Products will appear here once they are promoted in content.</p>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => b.totalEngagement - a.totalEngagement);
  const maxEng = Math.max(...sorted.map(p => p.totalEngagement), 1);

  const getPerformance = (pct: number, idx: number) => {
    if (idx === 0 && pct > 60) return performanceLabels.top;
    if (pct > 40) return performanceLabels.strong;
    if (pct > 15) return performanceLabels.average;
    return performanceLabels.focus;
  };

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6" style={{ boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[18px] font-semibold text-[#111827]">Product Performance</h3>
        <Link href="/client/products" className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1">
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#ECECF4]">
              {["Product", "Posts", "Reach", "Engagement Rate", "Performance"].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-[#6B7280] pb-3 pr-4 last:pr-0">{h}</th>
          ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 5).map((product, idx) => {
              const pct = product.totalEngagement > 0 ? (product.totalEngagement / maxEng) * 100 : 0;
              const perf = getPerformance(pct, idx);
              return (
                <tr key={product.id} className="border-b border-[#ECECF4]/60 last:border-b-0">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-[#FFE3E3] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">{product.name}</p>
                        {product.category && <p className="text-xs text-[#6B7280]">{product.category}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-sm font-bold text-[#111827]">{product.postCount}</td>
                  <td className="py-2 pr-4 text-sm font-bold text-[#111827]">{formatNum(product.totalReach)}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#EEF0F6] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#F2485A]" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-sm font-bold text-[#111827]">{formatNum(product.totalEngagement)}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-0.5 ${perf.style}`}>
                      {perf.icon && <span className="text-current">{perf.icon}</span>}
                      {perf.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   UPCOMING CONTENT
   ═══════════════════════════════════════════════ */

function UpcomingContentCard({ item }: { item: ContentItem }) {
  const date = item.scheduledAt || item.publishDate;
  const platform = item.platform || "INSTAGRAM";
  const platformIcon = platform.charAt(0) + platform.slice(1).toLowerCase();

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white border border-[#ECECF4] rounded-[16px] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)]" style={{ boxShadow: "0 1px 4px rgba(16,24,40,0.02)" }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0 relative">
          <Package className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
          <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-white rounded-full px-0.5 border border-gray-200 leading-tight text-gray-600">
            {platformIcon.slice(0, 2)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#111827] truncate leading-snug">{item.title}</p>
          {date && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} &bull; {new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <StatusBadge status={item.status} />
      </div>
    </div>
  );
}

function UpcomingContentSection({ items }: { items: ContentItem[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[18px] font-semibold text-[#111827]">Upcoming Content</h3>
        <Link href="/client/content" className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1">
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6 text-sm text-[#6B7280] text-center" style={{ boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}>
          No upcoming content scheduled yet.
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 5).map(item => (
            <UpcomingContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RECENT ACTIVITY
   ═══════════════════════════════════════════════ */

function getActivityIcon(action: string) {
  switch (action) {
    case "APPROVED":
    case "POSTED":
      return CheckCircle;
    case "COMMENT":
      return MessageCircle;
    case "SCHEDULED":
      return Calendar;
    case "GENERATED":
    case "EXPORT":
      return Upload;
    default:
      return FileText;
  }
}

function getActivityIconBg(action: string) {
  switch (action) {
    case "APPROVED":
    case "POSTED":
      return "bg-emerald-50 text-emerald-600";
    case "COMMENT":
      return "bg-blue-50 text-blue-600";
    case "SCHEDULED":
      return "bg-amber-50 text-amber-600";
    case "GENERATED":
    case "EXPORT":
      return "bg-purple-50 text-purple-600";
    default:
      return "bg-gray-50 text-gray-500";
  }
}

function ActivitySection({ items }: { items: ActivityItem[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[18px] font-semibold text-[#111827]">Recent Activity</h3>
        <Link href="/client/requests" className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1">
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="bg-white border border-[#ECECF4] rounded-[24px] p-5" style={{ boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}>
        {items.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-[#6B7280]">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-0">
            {items.slice(0, 6).map((item, idx) => {
              const Icon = getActivityIcon(item.action);
              const iconStyle = getActivityIconBg(item.action);

              const actionText = (a: string) => {
                switch (a) {
                  case "APPROVED": return "was approved";
                  case "REJECTED": return "was rejected";
                  case "POSTED": return "was published";
                  case "COMMENT": return "New comment on";
                  case "SCHEDULED": return "was scheduled";
                  case "GENERATED":
                  case "EXPORT": return "was generated";
                  case "UPDATED": return "was updated";
                  default: return a.toLowerCase().replace(/_/g, " ");
                }
              };

              const activityText = (a: string) => {
                if (a === "COMMENT") return `"${item.title}"`;
                if (a === "GENERATED" || a === "EXPORT") return `Report "${item.title}"`;
                return `"${item.title}"`;
              };

              return (
                <div key={item.id} className={cn(
                  "flex items-start gap-3 py-3",
                  idx < items.slice(0, 6).length - 1 && "border-b border-[#ECECF4]"
                )}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconStyle}`}>
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#111827] leading-snug">
                      {item.action === "COMMENT" ? (
                        <>
                          {actionText(item.action)} <span className="font-semibold">{item.title}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{activityText(item.action)}</span>{" "}{actionText(item.action)}
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.actor || "System"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════ */

export default function ClientDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="mx-auto px-8" style={{ maxWidth: 1440, margin: "0 auto" }}>
      <div className="space-y-8" style={{ paddingTop: 40, paddingBottom: 64 }}>
        {/* HERO */}
        <HeroSection client={data.client} budget={data.budget} />

        {/* KPI ROW */}
        <KpiRow tm={data.thisMonth} lm={data.lastMonth} trend={data.monthlyTrend} />

        {/* PERFORMANCE CHART + TOP CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <PerformanceChart data={data.monthlyTrend} />
          </div>
          <div className="lg:col-span-5">
            <TopContentSection items={data.topContent} />
          </div>
        </div>

        {/* PRODUCT PERFORMANCE + UPCOMING + ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProductTable items={data.products} />
          <UpcomingContentSection items={data.upcomingContent} />
          <ActivitySection items={data.recentActivity} />
        </div>
      </div>
    </div>
  );
}
