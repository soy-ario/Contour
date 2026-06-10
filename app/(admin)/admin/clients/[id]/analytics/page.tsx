import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import StatCard from "@/components/shared/stat-card";
import BarChart from "@/components/charts/bar-chart";
import AreaChart from "@/components/charts/area-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientAnalyticsPage({ params }: PageProps) {
  await requireAdmin();
  const { id: clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { brandName: true },
  });

  if (!client) notFound();

  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentSnaps, previousSnaps, dailyMetrics, topContent] = await Promise.all([
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
      include: { analytics: true },
      orderBy: { analytics: { engagementRate: "desc" } },
      take: 5,
    }),
  ]);

  // Aggregate current month
  const curr = currentSnaps.reduce(
    (acc, s) => ({
      views: acc.views + Number(s.totalViews),
      reach: acc.reach + Number(s.totalReach),
      engagement: acc.engagement + Number(s.totalEngagement),
      followers: acc.followers + s.followerGrowth,
      posts: acc.posts + s.postCount,
    }),
    { views: 0, reach: 0, engagement: 0, followers: 0, posts: 0 }
  );

  // Aggregate previous month
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

  const engagementRate =
    curr.reach > 0 ? (curr.engagement / curr.reach) * 100 : 0;

  // Platform breakdown bar chart data
  const platformData = currentSnaps.map((s) => ({
    name: s.platform,
    reach: Number(s.totalReach),
    engagement: Number(s.totalEngagement),
  }));

  // Daily follower growth area chart data
  const dailyGrowthData = dailyMetrics
    .reduce((acc: Record<string, number>, m) => {
      const date = m.metricDate.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + m.followerDelta;
      return acc;
    }, {});

  const growthChartData = Object.entries(dailyGrowthData)
    .slice(-30)
    .map(([date, followers]) => ({ date, followers }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Performance metrics for {client.brandName} — current month.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Views"
          value={formatNumber(curr.views)}
          delta={delta(curr.views, prev.views)}
          deltaLabel="vs last month"
        />
        <StatCard
          label="Total Reach"
          value={formatNumber(curr.reach)}
          delta={delta(curr.reach, prev.reach)}
          deltaLabel="vs last month"
        />
        <StatCard
          label="Engagement Rate"
          value={`${engagementRate.toFixed(1)}%`}
          delta={delta(curr.engagement / Math.max(1, curr.reach), prev.engagement / Math.max(1, prev.reach))}
          deltaLabel="vs last month"
        />
        <StatCard
          label="Followers Gained"
          value={formatNumber(curr.followers)}
          delta={delta(curr.followers, prev.followers)}
          deltaLabel="vs last month"
        />
        <StatCard
          label="Posts Published"
          value={curr.posts}
          delta={delta(curr.posts, prev.posts)}
          deltaLabel="vs last month"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Platform Breakdown — Reach</CardTitle>
          </CardHeader>
          <CardContent>
            {platformData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No platform data synced yet.
              </p>
            ) : (
              <BarChart
                data={platformData}
                bars={[
                  { key: "reach", color: "hsl(var(--primary))", label: "Reach" },
                  { key: "engagement", color: "#10b981", label: "Engagement" },
                ]}
                height={240}
              />
            )}
          </CardContent>
        </Card>

        {/* Follower Growth */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Follower Growth — 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            {growthChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No daily growth data available yet.
              </p>
            ) : (
              <AreaChart
                data={growthChartData}
                areas={[{ key: "followers", color: "#6366f1", label: "Followers" }]}
                height={240}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          {topContent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No content analytics available yet. Analytics appear after posts are synced.
            </p>
          ) : (
            <div className="space-y-3">
              {topContent.map((content) => (
                <div
                  key={content.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 rounded-md border border-border/60 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{content.title}</p>
                    <p className="text-xs text-muted-foreground">{content.platform} · {content.contentType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Views</p>
                    <p className="font-medium">{formatNumber(Number(content.analytics?.views ?? 0))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Reach</p>
                    <p className="font-medium">{formatNumber(Number(content.analytics?.reach ?? 0))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Likes</p>
                    <p className="font-medium">{formatNumber(content.analytics?.likes ?? 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">ER</p>
                    <p className="font-medium text-green-400">
                      {Number(content.analytics?.engagementRate ?? 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
