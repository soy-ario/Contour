import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { ClientStatus, Platform, ConnectionStatus } from "@prisma/client";
import { cn, formatCurrency, formatNumber, formatPercent, formatDate, formatRelativeDate } from "@/lib/utils";
import { Check, ChevronRight, Globe, User, Mail, Clock, Eye, Users as UsersIcon, Heart, MessageSquare, Share2, BarChart3, Plus, FileEdit, ArrowUpRight, UserPlus, Settings } from "lucide-react";
import { InstagramIcon, FacebookIcon, LinkedinIcon, TiktokIcon } from "@/components/shared/social-icons";
import InternalNotes from "@/components/features/admin/internal-notes";

export const dynamic = "force-dynamic";

interface OverviewPageProps {
  params: Promise<{ id: string }>;
}

// ─── Onboarding Progress ───────────────────────────────────────────────
function OnboardingProgressSection({ status }: { status: ClientStatus }) {
  const statusOrder: ClientStatus[] = ["LEAD", "DISCOVERY", "PROPOSAL_SENT", "CONTRACT_SIGNED", "SETUP", "DASHBOARD_READY", "ACTIVE"];
  const currentIndex = statusOrder.indexOf(status);
  const isPausedOrArchived = status === "PAUSED" || status === "ARCHIVED";

  const steps = [
    { label: "Lead" },
    { label: "Discovery" },
    { label: "Proposal Sent" },
    { label: "Contract Signed" },
    { label: "Social Link" },
    { label: "Products Added" },
    { label: "Dashboard Ready" },
    { label: "Active" },
  ];

  const completedCount = isPausedOrArchived
    ? steps.length
    : Math.max(0, Math.min(currentIndex, steps.length));

  const isAllComplete = completedCount >= steps.length;

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-7">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-[#111827]">Onboarding Progress</h2>
          {isAllComplete ? (
            <p className="text-xs font-semibold text-[#16A34A] mt-1">All steps completed</p>
          ) : (
            <p className="text-xs font-semibold text-[#6B7280] mt-1">
              Step {completedCount} of {steps.length} — {steps[completedCount]?.label}
            </p>
          )}
        </div>
        <button className="text-xs font-semibold border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          View Onboarding Details &gt;
        </button>
      </div>

      <div className="overflow-x-auto -mx-7 px-7">
        <div className="relative min-w-[680px]">
          <div className="absolute left-0 right-0 top-[14px] h-[2px] bg-[#ECECF4] rounded-full z-0" />
          <div
            className="absolute left-0 top-[14px] h-[2px] bg-[#F2485A] rounded-full transition-all duration-500 z-0"
            style={{ width: `${Math.max(0, completedCount) / (steps.length - 1) * 100}%` }}
          />

          <div className="flex items-start justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx < completedCount;
              const isCurrent = idx === completedCount;

              return (
                <div key={idx} className="flex flex-col items-center relative z-10">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isCompleted || (isAllComplete && isCurrent)
                        ? "bg-[#F2485A] border-[#F2485A]"
                        : isCurrent
                        ? "bg-white border-[#F2485A]"
                        : "bg-white border-[#ECECF4]"
                    )}
                  >
                    {isCompleted || (isAllComplete && isCurrent) ? (
                      <Check className="w-3.5 h-3.5 text-[#111827] stroke-[3]" />
                    ) : (
                      <span className={cn("text-[11px] font-bold", isCurrent ? "text-[#F2485A]" : "text-[#9CA3AF]")}>
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold mt-2.5 text-center whitespace-nowrap",
                      isCompleted || (isAllComplete && isCurrent) ? "text-[#111827]" : isCurrent ? "text-[#F2485A]" : "text-[#9CA3AF]"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sparkline ─────────────────────────────────────────────────────────
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min === 0 ? 1 : max - min;
  const w = 56; const h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`);
  return (
    <svg width={w} height={h} className="overflow-visible shrink-0">
      <polyline fill="none" stroke="#F2485A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points.join(" ")} />
    </svg>
  );
}

// ─── KPI Row ───────────────────────────────────────────────────────────
function KPIRow({ metrics }: {
  metrics: {
    views: { value: number; delta: number; sparkline: number[] };
    reach: { value: number; delta: number; sparkline: number[] };
    engagement: { value: number; delta: number; sparkline: number[] };
    followers: { value: number; delta: number; sparkline: number[] };
  };
}) {
  const items = [
    { label: "Total Monthly Views", value: metrics.views, icon: Eye },
    { label: "Estimated Monthly Reach", value: metrics.reach, icon: UsersIcon },
    { label: "Avg Engagement Rate", value: metrics.engagement, icon: Heart, isPercent: true },
    { label: "Net Followers Gained", value: metrics.followers, icon: UserPlus },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((item) => {
        const Icon = item.icon;
        const isUp = item.value.delta > 0;
        const displayValue = item.isPercent ? formatPercent(item.value.value) : formatNumber(item.value.value);

        return (
          <div key={item.label} className="bg-white border border-[#ECECF4] rounded-[20px] p-5 h-[150px] flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#F2F8D7] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#6B7280]" />
                </div>
                <span className="text-xs font-medium text-gray-500 truncate">{item.label}</span>
              </div>
              <Sparkline data={item.value.sparkline} />
            </div>
            <div>
              <div className="text-[32px] font-extrabold text-[#111827] leading-none tracking-tight">
                {displayValue}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={cn("text-[13px] font-semibold", isUp ? "text-[#16A34A]" : "text-rose-500")}>
                  {isUp ? "↑" : "↓"} {Math.abs(item.value.delta).toFixed(1)}%
                </span>
                <span className="text-[13px] text-[#6B7280]">vs last month</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Profile Details ───────────────────────────────────────────────────
function PaymentStatusBadge({ status }: { status: string }) {
  const dotColor = status === "PAID" ? "#16A34A" : status === "OVERDUE" ? "#EF4444" : "#F59E0B";
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: dotColor }}>
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
      {status === "PAID" ? "Paid" : status === "OVERDUE" ? "Overdue" : "Pending"}
    </span>
  );
}

interface ClientProfileData {
  id: string;
  contactName: string;
  contactEmail: string;
  industry: string | null;
  monthlyRetainer: unknown;
  contractStart: Date | null;
  contractEnd: Date | null;
  paymentStatus: string;
}

function ProfileDetails({ client }: { client: ClientProfileData }) {
  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-7">
      <h2 className="text-xl font-bold text-[#111827] mb-6">Client Profile Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Business Details */}
        <div className="space-y-5 flex flex-col">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-[#F2485A]" />
            <h3 className="text-xs font-semibold text-[#6B7280] tracking-[0.08em] uppercase">Business Details</h3>
          </div>
          <div className="flex-1 space-y-4">
            <DetailRow icon={User} sublabel="Primary Contact" value={client.contactName} />
            <DetailRow icon={Mail} sublabel="Email" value={client.contactEmail} />
            {client.industry && <DetailRow icon={Globe} sublabel="Industry" value={client.industry} />}
          </div>
          <button className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 border border-gray-200 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors self-start">
            <FileEdit className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        </div>

        {/* Financial & Contract */}
        <div className="space-y-5 flex flex-col md:border-l md:border-[#ECECF4] md:pl-8">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full bg-[#F2485A]" />
            <h3 className="text-xs font-semibold text-[#6B7280] tracking-[0.08em] uppercase">Financial & Contract</h3>
          </div>
          <div className="flex-1 space-y-0">
            <FinanceRow label="Monthly Retainer" value={formatCurrency(Number(client.monthlyRetainer))} bold />
            <FinanceRow label="Contract Start" value={client.contractStart ? formatDate(client.contractStart, "MMM d, yyyy") : "—"} />
            <FinanceRow label="Contract End" value={client.contractEnd ? formatDate(client.contractEnd, "MMM d, yyyy") : "—"} />
            <FinanceRow label="Payment Status" value={<PaymentStatusBadge status={client.paymentStatus} />} />
            <FinanceRow label="Last Payment" value="—" />
            <FinanceRow label="Next Invoice" value="—" />
          </div>
          <Link
            href={`/admin/clients/${client.id}/settings`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F2485A] hover:text-[#D93D4E] transition-colors self-end"
          >
            View Billing
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, sublabel, value }: { icon: React.ComponentType<{ className?: string }>; sublabel: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#F6F7FB] flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
      </div>
      <div className="min-w-0">
        <span className="text-xs font-medium text-[#9CA3AF] block">{sublabel}</span>
        <span className="text-[15px] font-semibold text-[#111827]">{value}</span>
      </div>
    </div>
  );
}

function FinanceRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#ECECF4] last:border-b-0">
      <span className="text-[15px] text-[#6B7280]">{label}</span>
      <span className={cn("text-[15px]", bold ? "font-bold text-[#111827]" : "font-semibold text-[#111827]")}>{value}</span>
    </div>
  );
}

// ─── Social Connections ────────────────────────────────────────────────
function SocialConnections({ socialAccounts }: { socialAccounts: Array<{ platform: Platform; status: ConnectionStatus; accountName: string | null; lastSyncAt: Date | null }> }) {
  const platforms: Array<{ key: Platform; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = [
    { key: "INSTAGRAM", label: "Instagram", icon: InstagramIcon },
    { key: "FACEBOOK", label: "Facebook", icon: FacebookIcon },
    { key: "TIKTOK", label: "TikTok", icon: TiktokIcon },
    { key: "LINKEDIN", label: "LinkedIn", icon: LinkedinIcon },
  ];

  const connectionMap = new Map(socialAccounts.map((a) => [a.platform, a]));

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-7">
      <h2 className="text-2xl font-bold text-[#111827] mb-1">Connected Social Channels</h2>
      <p className="text-[15px] text-[#6B7280] mb-6 leading-relaxed">
        Active API sync streams used to pull automated data views.
      </p>

      <div className="space-y-1">
        {platforms.map(({ key, label, icon: Icon }) => {
          const match = connectionMap.get(key);

          return (
            <div key={key} className="flex items-center justify-between py-3.5 border-b border-[#ECECF4] last:border-b-0">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 shrink-0" />
                <div>
                  <span className="text-[15px] font-semibold text-[#111827]">{label}</span>
                  {match?.accountName && (
                    <span className="text-xs text-[#6B7280] block">@{match.accountName}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className={cn(
                    "text-xs font-semibold",
                    match?.status === "CONNECTED" ? "text-[#16A34A]" : "text-[#9CA3AF]"
                  )}>
                    {match?.status === "CONNECTED" ? "Connected" : match?.status === "DISCONNECTED" ? "Inactive" : match?.status || "Inactive"}
                  </span>
                  {match?.lastSyncAt && (
                    <span className="text-xs text-[#9CA3AF] block">Synced {formatDate(match.lastSyncAt, "MMM dd")}</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <button className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 border border-gray-200 px-3.5 py-2 rounded-lg hover:bg-gray-50 transition-colors mt-4">
        <Settings className="w-3.5 h-3.5" />
        Manage Connections
      </button>
    </div>
  );
}

// ─── Recent Activity ───────────────────────────────────────────────────
function RecentActivity({ items, clientId }: { items: ActivityItem[]; clientId: string }) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    content_approved: Check,
    content_rejected: FileEdit,
    content_review: MessageSquare,
    content_posted: Share2,
    client_updated: BarChart3,
    note_added: Plus,
    sync_completed: Clock,
  };

  if (items.length === 0) {
    return (
      <div className="bg-white border border-[#ECECF4] rounded-[24px] p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#111827]">Recent Activity</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="w-12 h-12 text-[#D1D5DB] mb-3" />
          <p className="text-[15px] font-medium text-[#6B7280]">No recent activity yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#ECECF4] rounded-[24px] p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#111827]">Recent Activity</h2>
        <Link
          href={`/admin/clients/${clientId}/analytics`}
          className="text-xs font-semibold text-[#F2485A] hover:text-[#D93D4E] transition-colors flex items-center gap-1"
        >
          View All
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-1">
        {items.slice(0, 8).map((item) => {
          const Icon = iconMap[item.type] || Clock;

          return (
            <div key={item.id} className="flex items-center gap-3 py-3.5 border-b border-[#ECECF4] last:border-b-0">
              <div className="w-8 h-8 rounded-full bg-[#F6F7FB] flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-[#111827] leading-snug">{item.description}</p>
                <span className="text-xs text-gray-400">
                  {item.actorName ? `Approved by ${item.actorName} • ${formatDate(item.timestamp, "MMM d, yyyy 'at' h:mm a")}` : formatRelativeDate(item.timestamp)}
                </span>
              </div>
              {item.badge && item.badge.label === "Approved" ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 bg-[#EFEEFC] text-[#16A34A]">
                  {item.badge.label}
                </span>
              ) : item.badge ? (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.badge.color + "15", color: item.badge.color }}
                >
                  {item.badge.label}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ActivityItem {
  id: string;
  type: "content_approved" | "content_rejected" | "content_review" | "content_posted" | "client_updated" | "note_added" | "sync_completed";
  description: string;
  timestamp: Date;
  actorName?: string;
  badge?: { label: string; color: string };
}

// ─── Main Page ─────────────────────────────────────────────────────────
export default async function ClientOverviewPage({ params }: OverviewPageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      socialAccounts: true,
      internalNotes: {
        include: { creator: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { contents: true, products: true, requests: true } },
    },
  });

  if (!client) notFound();

  // ── Analytics ──
  const startOfThisMonth = new Date();
  startOfThisMonth.setDate(1);
  startOfThisMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  startOfLastMonth.setHours(0, 0, 0, 0);

  const [thisMonthSnapshots, lastMonthSnapshots] = await Promise.all([
    prisma.analyticsSnapshot.findMany({ where: { clientId: id, periodStart: { gte: startOfThisMonth } } }),
    prisma.analyticsSnapshot.findMany({ where: { clientId: id, periodStart: { gte: startOfLastMonth, lt: startOfThisMonth } } }),
  ]);

  const viewsTM = thisMonthSnapshots.reduce((a, s) => a + Number(s.totalViews), 0);
  const reachTM = thisMonthSnapshots.reduce((a, s) => a + Number(s.totalReach), 0);
  const engTM = thisMonthSnapshots.length > 0
    ? thisMonthSnapshots.reduce((a, s) => a + Number(s.avgEngagementRate || 0), 0) / thisMonthSnapshots.length
    : 0;
  const follTM = thisMonthSnapshots.reduce((a, s) => a + s.followerGrowth, 0);

  const viewsLM = lastMonthSnapshots.reduce((a, s) => a + Number(s.totalViews), 0);
  const reachLM = lastMonthSnapshots.reduce((a, s) => a + Number(s.totalReach), 0);
  const engLM = lastMonthSnapshots.length > 0
    ? lastMonthSnapshots.reduce((a, s) => a + Number(s.avgEngagementRate || 0), 0) / lastMonthSnapshots.length
    : 0;
  const follLM = lastMonthSnapshots.reduce((a, s) => a + s.followerGrowth, 0);

  const delta = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

  const allSnapshots = [...thisMonthSnapshots].sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime());

  const metrics = {
    views: { value: viewsTM, delta: delta(viewsTM, viewsLM), sparkline: allSnapshots.map(s => Number(s.totalViews)) },
    reach: { value: reachTM, delta: delta(reachTM, reachLM), sparkline: allSnapshots.map(s => Number(s.totalReach)) },
    engagement: { value: engTM, delta: delta(engTM, engLM), sparkline: allSnapshots.map(s => Number(s.avgEngagementRate || 0)) },
    followers: { value: follTM, delta: delta(follTM, follLM), sparkline: allSnapshots.map(s => s.followerGrowth) },
  };

  // ── Recent Activity ──
  const approvalEvents = await prisma.approvalEvent.findMany({
    where: { content: { clientId: id } },
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { content: { select: { title: true } }, actor: { select: { name: true } } },
  });

  const recentActivity: ActivityItem[] = approvalEvents.map((e) => {
    let badge: { label: string; color: string };
    switch (e.action) {
      case "APPROVED": badge = { label: "Approved", color: "#16A34A" }; break;
      case "REJECTED": badge = { label: "Rejected", color: "#EF4444" }; break;
      case "CHANGES_REQUESTED": badge = { label: "Changes", color: "#F59E0B" }; break;
      default: badge = { label: "Review", color: "#6B7280" };
    }
    return {
      id: e.id,
      type: (e.action === "APPROVED" ? "content_approved" : "content_review") as ActivityItem["type"],
      description: `"${e.content.title}" was approved`,
      timestamp: e.createdAt,
      actorName: e.actor?.name,
      badge,
    };
  });

  return (
    <div className="py-8 px-8 mx-auto" style={{ maxWidth: 1440 }}>
      <div className="space-y-6">
        <OnboardingProgressSection
          status={client.status}
        />

        <KPIRow metrics={metrics} />

        {/* Profile (7 cols) + Social (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ProfileDetails client={client} />
          </div>
          <div className="lg:col-span-5">
            <SocialConnections socialAccounts={client.socialAccounts} />
          </div>
        </div>

        {/* Recent Activity (6 cols) + Internal Notes (6 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <RecentActivity items={recentActivity} clientId={id} />
          </div>
          <div className="lg:col-span-6">
            <InternalNotes clientId={client.id} initialNotes={client.internalNotes} />
          </div>
        </div>
      </div>
    </div>
  );
}
