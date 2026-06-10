import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageShell from "@/components/layout/page-shell";
import StatCard from "@/components/shared/stat-card";
import StatusBadge from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

  const activeClients = clients.filter((client) => client.status === "ACTIVE").length;
  const onboardingClients = clients.filter(
    (client) => !["ACTIVE", "PAUSED", "ARCHIVED"].includes(client.status)
  ).length;
  const pausedClients = clients.filter((client) => client.status === "PAUSED").length;
  const monthlyRevenue = clients.reduce((sum, client) => sum + Number(client.monthlyRetainer), 0);
  const outstanding = clients
    .filter((client) => client.paymentStatus !== "PAID")
    .reduce((sum, client) => sum + Number(client.monthlyRetainer), 0);

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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total Clients" value={clients.length} />
          <StatCard label="Active Clients" value={activeClients} />
          <StatCard label="Onboarding" value={onboardingClients} />
          <StatCard label="Paused" value={pausedClients} />
          <StatCard label="Monthly Revenue" value={formatCurrency(monthlyRevenue)} />
          <StatCard label="Outstanding" value={formatCurrency(outstanding)} />
          <StatCard label="Content Items" value={formatNumber(contentCount)} />
          <StatCard label="Pending Approvals" value={pendingApprovals} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Client Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between gap-4 rounded-md border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.brandName}</p>
                    <StatusBadge status={client.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {client.healthScore ?? 0}/100
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Recent Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestContent.map((content) => (
                <div key={content.id} className="flex items-center justify-between gap-4 rounded-md border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{content.title}</p>
                    <p className="text-xs text-muted-foreground">{content.client.brandName}</p>
                  </div>
                  <StatusBadge status={content.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
