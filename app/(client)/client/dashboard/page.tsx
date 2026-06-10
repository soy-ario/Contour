import Link from "next/link";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/shared/stat-card";
import StatusBadge from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  const user = await requireClient();
  const clientId = user.clientId;

  const [client, snapshots, upcomingContent, pendingContent, productCount] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: {
        brandName: true,
        monthlyBudget: true,
      },
    }),
    prisma.analyticsSnapshot.findMany({
      where: { clientId },
      orderBy: { periodStart: "desc" },
      take: 6,
    }),
    prisma.content.findMany({
      where: {
        clientId,
        status: { in: ["APPROVED", "SCHEDULED", "CLIENT_APPROVAL_PENDING"] },
      },
      orderBy: [{ scheduledAt: "asc" }, { publishDate: "asc" }],
      take: 6,
    }),
    prisma.content.count({
      where: {
        clientId,
        status: "CLIENT_APPROVAL_PENDING",
      },
    }),
    prisma.product.count({
      where: {
        clientId,
        status: "ACTIVE",
      },
    }),
  ]);

  const totals = snapshots.reduce(
    (sum, snapshot) => ({
      views: sum.views + Number(snapshot.totalViews),
      reach: sum.reach + Number(snapshot.totalReach),
      engagement: sum.engagement + Number(snapshot.totalEngagement),
      impressions: sum.impressions + Number(snapshot.totalImpressions),
    }),
    { views: 0, reach: 0, engagement: 0, impressions: 0 }
  );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const adSpend = await prisma.content.aggregate({
    where: {
      clientId,
      publishDate: { gte: monthStart },
    },
    _sum: { adSpend: true },
  });

  const budgetUsed = Number(adSpend._sum.adSpend || 0);
  const monthlyBudget = Number(client?.monthlyBudget || 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {client?.brandName ?? "Client"} Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Campaign performance, approvals, upcoming content, and promoted products.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Views" value={formatNumber(totals.views)} />
        <StatCard label="Reach" value={formatNumber(totals.reach)} />
        <StatCard label="Engagement" value={formatNumber(totals.engagement)} />
        <StatCard label="Pending Approvals" value={pendingContent} />
        <StatCard label="Impressions" value={formatNumber(totals.impressions)} />
        <StatCard label="Active Products" value={productCount} />
        <StatCard label="Budget Used" value={formatCurrency(budgetUsed)} />
        <StatCard label="Budget Remaining" value={formatCurrency(Math.max(0, monthlyBudget - budgetUsed))} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">Upcoming Content</CardTitle>
            <Button variant="outline" size="sm" render={<Link href="/client/content" />}>
              Review Content
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingContent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming content is scheduled yet.</p>
            ) : (
              upcomingContent.map((content) => (
                <Link
                  key={content.id}
                  href={`/client/content/${content.id}`}
                  className="flex items-center justify-between gap-4 rounded-md border border-border/60 p-3 hover:bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{content.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {content.platform} · {content.contentType}
                    </p>
                  </div>
                  <StatusBadge status={content.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Performance Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Analytics will appear after social sync runs.</p>
            ) : (
              snapshots.map((snapshot) => (
                <div key={snapshot.id} className="flex items-center justify-between gap-4 rounded-md border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{snapshot.platform}</p>
                    <p className="text-xs text-muted-foreground">
                      {snapshot.periodStart.toLocaleDateString()} - {snapshot.periodEnd.toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatNumber(Number(snapshot.totalReach))} reach</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
