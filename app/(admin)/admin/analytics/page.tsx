import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PageShell from "@/components/layout/page-shell";
import StatCard from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const user = await requireAdmin();
  const [snapshots, topContent] = await Promise.all([
    prisma.analyticsSnapshot.findMany({
      orderBy: { periodStart: "desc" },
      take: 20,
      include: { client: { select: { brandName: true } } },
    }),
    prisma.content.findMany({
      where: { analytics: { isNot: null } },
      orderBy: { analytics: { reach: "desc" } },
      take: 8,
      include: {
        client: { select: { brandName: true } },
        analytics: true,
      },
    }),
  ]);

  const totals = snapshots.reduce(
    (sum, snapshot) => ({
      views: sum.views + Number(snapshot.totalViews),
      reach: sum.reach + Number(snapshot.totalReach),
      impressions: sum.impressions + Number(snapshot.totalImpressions),
      engagement: sum.engagement + Number(snapshot.totalEngagement),
    }),
    { views: 0, reach: 0, impressions: 0, engagement: 0 }
  );

  return (
    <PageShell
      title="Analytics"
      breadcrumbs={[{ label: "Analytics", href: "/admin/analytics" }]}
      user={{ name: user.name || "Admin", email: user.email, username: user.username }}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Views" value={formatNumber(totals.views)} />
          <StatCard label="Reach" value={formatNumber(totals.reach)} />
          <StatCard label="Impressions" value={formatNumber(totals.impressions)} />
          <StatCard label="Engagement" value={formatNumber(totals.engagement)} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Platform Snapshots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No analytics snapshots have synced yet.</p>
              ) : (
                snapshots.map((snapshot) => (
                  <div key={snapshot.id} className="flex items-center justify-between gap-4 rounded-md border border-border/60 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{snapshot.client.brandName}</p>
                      <p className="text-xs text-muted-foreground">{snapshot.platform}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatNumber(Number(snapshot.totalReach))} reach</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Top Performing Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topContent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Content analytics will appear after sync.</p>
              ) : (
                topContent.map((content) => (
                  <div key={content.id} className="flex items-center justify-between gap-4 rounded-md border border-border/60 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{content.title}</p>
                      <p className="text-xs text-muted-foreground">{content.client.brandName}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{formatNumber(Number(content.analytics?.reach ?? 0))} reach</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
