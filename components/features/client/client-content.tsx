"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Clock, CalendarDays, ChevronLeft, ChevronRight, Eye, TrendingUp, Users,
  AlertCircle, CheckCircle2, MoreHorizontal, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  InstagramIcon, FacebookIcon, LinkedinIcon, YoutubeIcon, TiktokIcon, TwitterIcon,
} from "@/components/shared/social-icons";
import type { ContentPageData } from "@/app/(client)/client/content/page";

/* ─── DATA HELPERS ─────────────────────────── */

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  INSTAGRAM: InstagramIcon, FACEBOOK: FacebookIcon, LINKEDIN: LinkedinIcon,
  YOUTUBE: YoutubeIcon, TIKTOK: TiktokIcon, X: TwitterIcon,
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  CLIENT_APPROVAL_PENDING: "Pending Approval",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  POSTED: "Published",
};

const PLATFORM_CALENDAR_COLORS: Record<string, { border: string; bg: string }> = {
  INSTAGRAM: { border: "border-[#E1306C]/30", bg: "bg-[#FCE4EC]" },
  FACEBOOK: { border: "border-[#1877F2]/30", bg: "bg-[#E3F2FD]" },
  LINKEDIN: { border: "border-[#0A66C2]/30", bg: "bg-[#E3F2FD]" },
  TIKTOK: { border: "border-gray-200", bg: "bg-[#F5F5F5]" },
  YOUTUBE: { border: "border-[#FF0000]/30", bg: "bg-[#FFEBEE]" },
  X: { border: "border-gray-200", bg: "bg-[#F5F5F5]" },
};

const PLATFORM_EVENT_COLORS: Record<string, string> = {
  INSTAGRAM: "#E1306C",
  FACEBOOK: "#1877F2",
  LINKEDIN: "#0A66C2",
  TIKTOK: "#000000",
  YOUTUBE: "#FF0000",
  X: "#6B7280",
};

/* ─── SUB-COMPONENTS ────────────────────────── */

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const Icon = PLATFORM_ICONS[platform];
  if (!Icon) return null;
  return <Icon className={className} />;
}

function KpiCard({ label, value, delta, icon, color }: {
  label: string; value: string; delta: number;
  icon: React.ReactNode; color: string;
}) {
  const bgMap: Record<string, string> = {
    orange: "bg-[#FFF7ED]", blue: "bg-[#EFF6FF]",
    green: "bg-[#F0FDF4]", purple: "bg-[#FAF5FF]",
  };
  const textMap: Record<string, string> = {
    orange: "text-[#EA580C]", blue: "text-[#2563EB]",
    green: "text-[#16A34A]", purple: "text-[#9333EA]",
  };
  const isUp = delta > 0;
  const isDown = delta < 0;

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-6 flex flex-col justify-between h-[120px] group hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(16,24,40,0.08)] transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", bgMap[color])}>
          {icon}
        </div>
        <span className="text-[13px] font-medium text-[#9CA3AF]">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">{value}</span>
        {delta !== 0 ? (
          <span className={cn("text-[13px] font-medium flex items-center gap-0.5", isUp ? "text-[#16A34A]" : textMap[color])}>
            {isUp ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            {Math.abs(delta).toFixed(0)}%
          </span>
        ) : (
          <span className="text-[13px] font-medium text-[#9CA3AF]">—</span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientContent({ data }: { data: ContentPageData }) {
  return (
    <div className="min-h-screen" style={{ background: "#F7F8FC" }}>
      <div className="mx-auto" style={{ maxWidth: 1440, padding: "24px 32px" }}>
        <div className="space-y-6">

          {/* ═══ HEADER ═══ */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-tight">Content</h1>
              <p className="text-[14px] font-medium text-[#6B7280] mt-1">
                Review, approve, and track your content pipeline.
              </p>
            </div>
          </div>

          {/* ═══ SECTION 1: KPI ROW ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Awaiting Approval" value={data.kpis[0]?.value ?? "0"} delta={data.kpis[0]?.delta ?? 0} color="orange" icon={<Clock className="w-[18px] h-[18px] text-[#EA580C]" />} />
            <KpiCard label="Scheduled" value={data.kpis[1]?.value ?? "0"} delta={data.kpis[1]?.delta ?? 0} color="blue" icon={<CalendarDays className="w-[18px] h-[18px] text-[#2563EB]" />} />
            <KpiCard label="Published This Month" value={data.kpis[2]?.value ?? "0"} delta={data.kpis[2]?.delta ?? 0} color="green" icon={<CheckCircle2 className="w-[18px] h-[18px] text-[#16A34A]" />} />
            <KpiCard label="Drafts In Progress" value={data.kpis[3]?.value ?? "0"} delta={data.kpis[3]?.delta ?? 0} color="purple" icon={<AlertCircle className="w-[18px] h-[18px] text-[#9333EA]" />} />
          </div>

          {/* ═══ SECTION 2: AWAITING YOUR APPROVAL ═══ */}
          <div className="bg-white border border-[#ECECF4] rounded-[24px] p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[20px] font-bold text-[#111827]">Awaiting Your Approval</h2>
                <p className="text-[14px] font-medium text-[#6B7280] mt-0.5">
                  Review and approve content to keep things moving.
                </p>
              </div>
              <Link
                href="/client/content?filter=pending"
                className="text-[14px] font-medium text-[#EA580C] hover:text-[#C2410C] transition-colors"
              >
                View All ({data.approvalCount})
              </Link>
            </div>

            {data.approvals.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-[#9CA3AF]">
                No content awaiting approval
              </div>
            ) : (
              <div>
                {data.approvals.map((item, i) => (
                  <React.Fragment key={item.id}>
                    {i > 0 && <div className="h-px bg-[#F1F5F9]" />}
                    <Link
                      href={`/client/content/${item.id}`}
                      className="flex items-center gap-4 h-[100px] px-2 hover:bg-[#FAFBFF] transition-colors rounded-xl group"
                    >
                      {/* Platform icon */}
                      <div className="w-10 h-10 rounded-xl bg-[#F4F4FA] flex items-center justify-center shrink-0">
                        <PlatformIcon platform={item.platform} className="w-5 h-5 text-[#6B7280]" />
                      </div>

                      {/* Thumbnail */}
                      <div className={cn(
                        "w-[60px] h-[60px] rounded-xl shrink-0 flex items-center justify-center text-[10px] font-medium text-[#9CA3AF] overflow-hidden",
                        item.thumbnail ? "" : "bg-[#F4F4FA]"
                      )}>
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Eye className="w-5 h-5 text-[#D1D5DB]" />
                        )}
                      </div>

                      {/* Title + Description */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[#111827] truncate">{item.title}</p>
                        <p className="text-[13px] text-[#6B7280] mt-0.5 truncate">
                          {CONTENT_TYPE_LABELS[item.contentType as keyof typeof CONTENT_TYPE_LABELS] || item.contentType} — {item.description || "No description"}
                        </p>
                      </div>

                      {/* Due */}
                      <div className="hidden lg:block shrink-0 text-right">
                        <p className="text-[11px] font-medium text-[#9CA3AF]">Due</p>
                        <p className="text-[13px] font-medium text-[#111827]">{item.dueDate}</p>
                      </div>

                      {/* Submitted By */}
                      <div className="hidden xl:block shrink-0 text-right">
                        <p className="text-[11px] font-medium text-[#9CA3AF]">Submitted By</p>
                        <p className="text-[13px] font-medium text-[#111827]">{item.submittedBy}</p>
                      </div>

                      {/* Status badge */}
                      <div className="bg-[#FFF7ED] text-[#EA580C] text-[12px] font-medium px-3 py-1 rounded-full shrink-0">
                        Pending Approval
                      </div>

                      {/* Review button */}
                      <div className="h-10 px-4 bg-white border border-[#E5E7EB] rounded-xl flex items-center gap-1.5 text-[13px] font-medium text-[#111827] shrink-0 group-hover:border-[#C5F135]/60 transition-all">
                        Review Content
                        <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      </div>
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* ═══ SECTION 3: CAMPAIGN CONTENT TIMELINE ═══ */}
          <div className="bg-white border border-[#ECECF4] rounded-[24px] p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-bold text-[#111827]">Campaign Content Timeline</h2>
                <p className="text-[14px] font-medium text-[#6B7280] mt-0.5">
                  Track content progress across the entire lifecycle.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {data.timeline.map(col => {
                const color = STATUS_COLORS[col.status] || "#6B7280";
                return (
                  <div key={col.status}>
                    {/* Column header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-[14px] font-semibold text-[#111827]">{col.label}</span>
                      <span className="text-[13px] font-medium text-[#9CA3AF] ml-auto">{col.count}</span>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2">
                      {col.items.length === 0 ? (
                        <div className="h-[100px] rounded-2xl border border-dashed border-[#ECECF4] flex items-center justify-center">
                          <span className="text-[12px] text-[#D1D5DB]">No items</span>
                        </div>
                      ) : (
                        col.items.map(item => (
                          <Link
                            key={item.id}
                            href={`/client/content/${item.id}`}
                            className="block h-[100px] bg-white border border-[#ECECF4] rounded-2xl p-3 hover:translate-y-[-2px] hover:shadow-[0_10px_30px_rgba(16,24,40,0.08)] transition-all duration-200"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <PlatformIcon platform={item.platform} className="w-4 h-4 text-[#6B7280]" />
                              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">{item.platform}</span>
                            </div>
                            <p className="text-[13px] font-semibold text-[#111827] leading-tight line-clamp-2">{item.title}</p>
                            {item.date && (
                              <p className="text-[11px] text-[#9CA3AF] mt-1">{item.date}</p>
                            )}
                          </Link>
                        ))
                      )}
                    </div>

                    {/* View all link */}
                    {col.count > 2 && (
                      <Link
                        href={`/client/content?filter=${col.status.toLowerCase()}`}
                        className="block text-center text-[12px] font-medium text-[#6B7280] mt-2 hover:text-[#111827] transition-colors"
                      >
                        View All ({col.count})
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ SECTION 4: CONTENT CALENDAR ═══ */}
          <ContentCalendarCard data={data} />

          {/* ═══ SECTION 5: PUBLISHED CONTENT PERFORMANCE ═══ */}
          <div className="bg-white border border-[#ECECF4] rounded-[24px] p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-bold text-[#111827]">Published Content Performance</h2>
                <p className="text-[14px] font-medium text-[#6B7280] mt-0.5">
                  See how your published content is performing.
                </p>
              </div>
              <Link
                href="/client/analytics"
                className="text-[14px] font-medium text-[#C5F135] hover:text-[#B0D42E] transition-colors"
              >
                View Full Report →
              </Link>
            </div>

            {data.performanceRows.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-[#9CA3AF]">
                No published content yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#ECECF4]">
                      {["Content", "Platform", "Published", "Budget", "Reach", "Engagement Rate", "Engagements", "Status", ""].map(h => (
                        <th key={h} className="text-left text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider px-3 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.performanceRows.map(row => {
                      const lc = performanceLabelColors[row.label];
                      return (
                        <tr key={row.id} className="border-b border-[#F1F5F9] h-[72px] hover:bg-[#FAFBFF] transition-colors">
                          <td className="px-3">
                            <Link href={`/client/content/${row.id}`} className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden",
                                row.thumbnail ? "" : "bg-[#F4F4FA]"
                              )}>
                                {row.thumbnail ? (
                                  <img src={row.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Eye className="w-4 h-4 text-[#D1D5DB]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[14px] font-semibold text-[#111827] truncate">{row.title}</p>
                                <p className="text-[12px] text-[#6B7280]">
                                  {CONTENT_TYPE_LABELS[row.contentType as keyof typeof CONTENT_TYPE_LABELS] || row.contentType} • 30s
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-3">
                            <PlatformIcon platform={row.platform} className="w-5 h-5 text-[#6B7280]" />
                          </td>
                          <td className="px-3 text-[13px] text-[#6B7280]">{row.publishedDate}</td>
                          <td className="px-3 text-[13px] text-[#111827] font-medium">{row.adSpend > 0 ? `$${row.adSpend.toLocaleString()}` : "—"}</td>
                          <td className="px-3 text-[14px] font-semibold text-[#111827]">{formatNumberShort(row.reach)}</td>
                          <td className="px-3">
                            <span className="text-[14px] font-semibold text-[#111827]">{row.engagementRate.toFixed(1)}%</span>
                          </td>
                          <td className="px-3 text-[14px] text-[#6B7280]">{formatNumberShort(row.engagements)}</td>
                          <td className="px-3">
                            <span className={cn(
                              "text-[12px] font-medium px-2.5 py-1 rounded-full inline-block",
                              lc
                            )}>
                              {row.label}
                            </span>
                          </td>
                          <td className="px-3">
                            <div className="flex items-center gap-2">
                              {row.up ? (
                                <ArrowUp className="w-4 h-4 text-[#16A34A]" />
                              ) : (
                                <ArrowDown className="w-4 h-4 text-[#B91C1C]" />
                              )}
                              <button className="p-1 hover:bg-[#F4F4FA] rounded-lg transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-[#9CA3AF]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CONTENT CALENDAR CARD (with toggle)
   ═══════════════════════════════════════════════ */

function ContentCalendarCard({ data }: { data: ContentPageData }) {
  const [view, setView] = React.useState<"calendar" | "list">("calendar");
  const [viewMonth, setViewMonth] = React.useState(data.defaultMonth);
  const [viewYear, setViewYear] = React.useState(data.defaultYear);
  const today = new Date();

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const filteredEvents = React.useMemo(
    () => data.calendarEvents.filter(e => e.month === viewMonth && e.year === viewYear),
    [data.calendarEvents, viewMonth, viewYear]
  );

  const sortedEvents = React.useMemo(
    () => [...filteredEvents].sort((a, b) => a.day - b.day),
    [filteredEvents]
  );

  const weekDays = React.useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];
    for (let d = 0; d < startDow; d++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
    return weeks;
  }, [viewMonth, viewYear]);

  const isCurrentMonth = viewMonth === today.getMonth() && viewYear === today.getFullYear();

  function goToPrevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function goToNextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function goToToday() {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  }

  const dayEvents = React.useCallback((day: number) => {
    return filteredEvents.filter(e => e.day === day);
  }, [filteredEvents]);

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#111827]">Content Calendar</h2>
          <p className="text-[14px] font-medium text-[#6B7280] mt-0.5">
            See your content schedule at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 rounded-xl bg-[#F5F6FA] flex items-center p-0.5">
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "h-9 px-4 rounded-[10px] text-[13px] font-medium transition-all",
                view === "calendar" ? "bg-[#EAF8D0] text-[#111827]" : "text-[#6B7280]"
              )}
            >Calendar</button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "h-9 px-4 rounded-[10px] text-[13px] font-medium transition-all",
                view === "list" ? "bg-[#EAF8D0] text-[#111827]" : "text-[#6B7280]"
              )}
            >List</button>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={goToPrevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F6FA] transition-colors text-[#6B7280]">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[16px] font-semibold text-[#111827] min-w-[140px] text-center">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button onClick={goToNextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F6FA] transition-colors text-[#6B7280]">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!isCurrentMonth && (
            <button
              onClick={goToToday}
              className="h-9 px-4 bg-[#F5F6FA] rounded-[10px] text-[13px] font-medium text-[#111827] hover:bg-[#EAF8D0] transition-all"
            >Today</button>
          )}
        </div>
      </div>

      {view === "calendar" ? (
        <div className="grid grid-cols-7 gap-px bg-[#ECECF4] rounded-xl overflow-hidden">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="bg-[#FAFBFF] px-3 py-2 text-[12px] font-semibold text-[#6B7280]">{d}</div>
          ))}
          {weekDays.map((week, wi) =>
            week.map((day, di) => {
              const events = day ? dayEvents(day) : [];
              const isT = day === today.getDate() && isCurrentMonth;
              return (
                <div key={`${wi}-${di}`} className={cn("bg-white min-h-[100px] p-2", isT && "bg-[#F2F8D7]/30")}>
                  <span className={cn(
                    "inline-flex w-6 h-6 items-center justify-center text-[12px] font-medium rounded-full mb-1",
                    isT ? "bg-[#C5F135] text-white" : "text-[#111827]"
                  )}>
                    {day ?? ""}
                  </span>
                  {events.slice(0, 3).map(ev => {
                    const ec = PLATFORM_EVENT_COLORS[ev.platform] || "#6B7280";
                    const sl = STATUS_LABELS[ev.status] || ev.status;
                    return (
                      <Link
                        key={ev.id}
                        href={`/client/content/${ev.id}`}
                        className="block rounded-lg px-2 py-1.5 mb-1 text-[11px] leading-tight hover:opacity-80 transition-opacity"
                        style={{ borderLeft: `3px solid ${ec}`, background: `${ec}08` }}
                      >
                        <div className="flex items-center gap-1">
                          <PlatformIcon platform={ev.platform} className="w-3 h-3 shrink-0 text-[#6B7280]" />
                          <span className="font-semibold text-[#111827] truncate">{ev.title}</span>
                        </div>
                        <span className="text-[#6B7280]" style={{ fontSize: 10 }}>{sl}</span>
                      </Link>
                    );
                  })}
                  {events.length > 3 && (
                    <span className="text-[10px] font-medium text-[#6B7280] ml-1">+{events.length - 3} more</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-1 overflow-x-auto">
          {sortedEvents.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-[#9CA3AF]">No content this month</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ECECF4]">
                  {["Content", "Platform", "Status", "Day", "Type", "Budget", "Views", "Reach", "Eng. Rate"].map(h => (
                    <th key={h} className="text-left text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider px-3 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map(ev => {
                  const sl = STATUS_LABELS[ev.status] || ev.status;
                  const dateStr = new Date(viewYear, viewMonth, ev.day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <tr key={ev.id} className="border-b border-[#F1F5F9] h-[56px] hover:bg-[#FAFBFF] transition-colors">
                      <td className="px-3">
                        <Link href={`/client/content/${ev.id}`} className="flex items-center gap-3">
                          <PlatformIcon platform={ev.platform} className="w-4 h-4 text-[#6B7280] shrink-0" />
                          <span className="text-[14px] font-semibold text-[#111827] truncate max-w-[200px]">{ev.title}</span>
                        </Link>
                      </td>
                      <td className="px-3 text-[13px] text-[#6B7280]">{ev.platform.charAt(0) + ev.platform.slice(1).toLowerCase()}</td>
                      <td className="px-3">
                        <span className={cn("text-[12px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap", STATUS_COLORS_LIST[ev.status])}>{sl}</span>
                      </td>
                      <td className="px-3 text-[13px] text-[#6B7280] whitespace-nowrap">{dateStr}</td>
                      <td className="px-3 text-[13px] text-[#6B7280]">{CONTENT_TYPE_LABELS[ev.contentType] || ev.contentType}</td>
                      <td className="px-3 text-[13px] text-[#111827] font-medium">{ev.adSpend > 0 ? `$${ev.adSpend.toLocaleString()}` : "—"}</td>
                      <td className="px-3 text-[13px] text-[#111827]">{ev.views > 0 ? formatNumberShort(ev.views) : "—"}</td>
                      <td className="px-3 text-[13px] text-[#111827]">{ev.reach > 0 ? formatNumberShort(ev.reach) : "—"}</td>
                      <td className="px-3 text-[13px] text-[#111827]">{ev.engagementRate > 0 ? `${ev.engagementRate.toFixed(1)}%` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── HELPERS ────────────────────────────────── */

const CONTENT_TYPE_LABELS: Record<string, string> = {
  REEL: "Reel", POST: "Post", STORY: "Story", VIDEO: "Video",
  CAROUSEL: "Carousel", THREAD: "Thread", SHORT: "Short", LIVE: "Live",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6B7280",
  CLIENT_APPROVAL_PENDING: "#EA580C",
  APPROVED: "#16A34A",
  SCHEDULED: "#2563EB",
  POSTED: "#16A34A",
};

const STATUS_COLORS_LIST: Record<string, string> = {
  DRAFT: "text-[#6B7280] bg-[#F3F4F6]",
  CLIENT_APPROVAL_PENDING: "text-[#EA580C] bg-[#FFF7ED]",
  APPROVED: "text-[#16A34A] bg-[#F0FDF4]",
  SCHEDULED: "text-[#2563EB] bg-[#EFF6FF]",
  POSTED: "text-[#16A34A] bg-[#F0FDF4]",
};

const performanceLabelColors: Record<string, string> = {
  "Top Performer": "text-[#166534] bg-[#DCFCE7]",
  "Strong": "text-[#047857] bg-[#ECFDF5]",
  "Average": "text-[#92400E] bg-[#FEF3C7]",
  "Needs Improvement": "text-[#B91C1C] bg-[#FEE2E2]",
};

function formatNumberShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
