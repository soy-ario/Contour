import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageShell from "@/components/layout/page-shell";
import StatCard from "@/components/shared/stat-card";
import StatusBadge from "@/components/shared/status-badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Users, UserCheck, UserPlus, PauseCircle, DollarSign, Clock, FileText, AlertCircle, Heart, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const [clients, contentCount, pendingApprovals, latestContent] = await Promise.all([
    prisma.client.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: {
        id: true,
        brandName: true,
        status: true,
        monthlyRetainer: true,
        paymentStatus: true,
        healthScore: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.content.count(),
    prisma.content.count({ where: { status: "CLIENT_APPROVAL_PENDING" } }),
    prisma.content.findMany({
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: { client: { select: { brandName: true } } },
    }),
  ]);

  const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
  const onboardingClients = clients.filter(
    (c) => !["ACTIVE", "PAUSED", "ARCHIVED"].includes(c.status)
  ).length;
  const pausedClients = clients.filter((c) => c.status === "PAUSED").length;
  const monthlyRevenue = clients.reduce((sum, c) => sum + Number(c.monthlyRetainer), 0);
  const outstanding = clients
    .filter((c) => c.paymentStatus !== "PAID")
    .reduce((sum, c) => sum + Number(c.monthlyRetainer), 0);

  const sessionUser = {
    name: user.name || "Admin",
    email: user.email,
    username: user.username,
  };

  return (
    <PageShell
      title="Dashboard"
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }]}
      user={sessionUser}
    >
      <p className="text-sm text-[#6B7280] mb-6">Welcome back, Admin User 👋</p>

      {/* KPI Section — 4 columns x 2 rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="TOTAL CLIENTS"
          value={clients.length}
          icon={<Users className="w-[18px] h-[18px] text-[#5B7A1A]" />}
          meta="Currently active"
          trend={[10, 15, 12, 18, 22, 20, 25]}
        />
        <StatCard
          label="ACTIVE CLIENTS"
          value={activeClients}
          icon={<UserCheck className="w-[18px] h-[18px] text-[#5B7A1A]" />}
          meta="Currently active"
        />
        <StatCard
          label="ONBOARDING"
          value={onboardingClients}
          icon={<UserPlus className="w-[18px] h-[18px] text-[#5B7A1A]" />}
          meta="In progress"
        />
        <StatCard
          label="PAUSED"
          value={pausedClients}
          icon={<PauseCircle className="w-[18px] h-[18px] text-[#5B7A1A]" />}
          meta="On hold"
        />
        <StatCard
          label="MONTHLY REVENUE"
          value={formatCurrency(monthlyRevenue)}
          icon={<DollarSign className="w-[18px] h-[18px] text-[#5B7A1A]" />}
          meta="This month"
          trend={[5000, 5200, 4800, 5400, 5800, 5600, 6100]}
        />
        <StatCard
          label="OUTSTANDING"
          value={formatCurrency(outstanding)}
          icon={<Clock className="w-[18px] h-[18px] text-[#5B7A1A]" />}
          meta="Pending payments"
        />
        <StatCard
          label="CONTENT ITEMS"
          value={formatNumber(contentCount)}
          icon={<FileText className="w-[18px] h-[18px] text-[#5B7A1A]" />}
          meta="Total created"
          trend={[5, 8, 6, 12, 10, 15, 14]}
        />
        <StatCard
          label="PENDING APPROVALS"
          value={pendingApprovals}
          icon={<AlertCircle className="w-[18px] h-[18px] text-[#5B7A1A]" />}
          meta="Awaiting review"
        />
      </div>

      {/* Bottom Section — 60/40 split */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-5 mt-6">
        {/* Client Health */}
        <div className="bg-white border border-[#ECECF4] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-[#111827]" />
              <h2 className="text-base font-semibold text-[#111827] tracking-tight">Client Health</h2>
            </div>
            <Link
              href="/admin/clients"
              className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              View all clients
            </Link>
          </div>

          <div className="space-y-4">
            {clients.map((client) => {
              const score = client.healthScore ?? 0;
              const scoreColor = score >= 70 ? "#C5F135" : score >= 40 ? "#E07A2F" : "#ef4444";
              return (
                <div key={client.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#F0F8D0] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#4A6A10]">
                          {getInitials(client.brandName)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#111827]">{client.brandName}</p>
                          <StatusBadge status={client.status} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-[#111827] leading-none">{score}</span>
                      <span className="text-xs text-[#6B7280]">/100</span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-[#ECECF4] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${score}%`, backgroundColor: scoreColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-1.5 mt-4 pt-3 border-t border-[#ECECF4]">
            <AlertCircle className="w-3 h-3 text-[#6B7280] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#6B7280] leading-relaxed">
              Health score is calculated based on content performance, engagement and activity.
            </p>
          </div>
        </div>

        {/* Recent Content */}
        <div className="bg-white border border-[#ECECF4] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#111827]" />
              <h2 className="text-base font-semibold text-[#111827] tracking-tight">Recent Content</h2>
            </div>
            <Link
              href="/admin/content"
              className="text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              View all content
            </Link>
          </div>

          {latestContent.length > 0 ? (
            <div className="space-y-2">
              {latestContent.map((content) => (
                <div key={content.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[#ECECF4] hover:border-[#C5F135]/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#111827] truncate">{content.title}</p>
                    <p className="text-xs text-[#6B7280]">{content.client.brandName}</p>
                  </div>
                  <StatusBadge status={content.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-lg bg-[#F4F4FA] flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-[#6B7280]" />
              </div>
              <h3 className="text-sm font-semibold text-[#111827]">No content yet</h3>
              <p className="text-xs text-[#6B7280] mt-1 max-w-[220px]">
                Create and publish your first content item to see it here.
              </p>
              <Link
                href="/admin/content"
                className="inline-flex items-center gap-1.5 mt-4 h-9 px-5 rounded-full bg-[#C5F135] text-[#111827] text-xs font-semibold hover:bg-[#B8E52F] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Content
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
