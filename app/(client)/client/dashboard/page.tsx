import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ClientDashboard from "@/components/features/client/client-dashboard";

export const dynamic = "force-dynamic";

function num(v: unknown): number {
  if (v == null) return 0;
  return Number(v);
}

export default async function ClientDashboardPage() {
  const user = await requireClient();
  const clientId = user.clientId;

  const [client, snapshots, contentList, productRows, upcomingRaw, pendingCount, approvalEvents] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: { brandName: true, monthlyBudget: true, monthlyRetainer: true, description: true, status: true },
    }),
    prisma.analyticsSnapshot.findMany({
      where: { clientId },
      orderBy: { periodStart: "asc" },
      select: { periodStart: true, periodEnd: true, totalViews: true, totalReach: true, totalEngagement: true, avgEngagementRate: true, followerGrowth: true, postCount: true },
    }),
    prisma.content.findMany({
      where: { clientId, status: "POSTED", analytics: { isNot: null } },
      include: { analytics: { select: { views: true, reach: true, likes: true, comments: true, shares: true, saves: true, engagementRate: true } } },
      orderBy: { postedAt: "desc" },
      take: 50,
    }),
    prisma.product.findMany({
      where: { clientId, status: "ACTIVE" },
      include: { contents: { include: { content: { include: { analytics: { select: { views: true, reach: true, likes: true, comments: true, shares: true, saves: true, engagementRate: true } } } } } } },
    }),
    prisma.content.findMany({
      where: { clientId, status: { in: ["APPROVED", "SCHEDULED", "CLIENT_APPROVAL_PENDING"] } },
      orderBy: [{ scheduledAt: "asc" }, { publishDate: "asc" }],
      take: 10,
    }),
    prisma.content.count({ where: { clientId, status: "CLIENT_APPROVAL_PENDING" } }),
    prisma.approvalEvent.findMany({
      where: { content: { clientId } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { content: { select: { title: true } }, actor: { select: { name: true } } },
    }),
  ]);

  const now = new Date();
  const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Monthly trend
  const monthGroups = new Map<string, typeof snapshots>();
  for (const s of snapshots) {
    const key = `${s.periodStart.getFullYear()}-${String(s.periodStart.getMonth() + 1).padStart(2, "0")}`;
    if (!monthGroups.has(key)) monthGroups.set(key, []);
    monthGroups.get(key)!.push(s);
  }

  const monthlyTrend = Array.from(monthGroups.entries()).map(([month, snaps]) => ({
    month: new Date(snaps[0].periodStart).toLocaleString("default", { month: "short" }),
    views: snaps.reduce((a, s) => a + num(s.totalViews), 0),
    reach: snaps.reduce((a, s) => a + num(s.totalReach), 0),
    followers: snaps.reduce((a, s) => a + s.followerGrowth, 0),
    engagementRate: snaps.length > 0 ? snaps.reduce((a, s) => a + num(s.avgEngagementRate), 0) / snaps.length : 0,
    postCount: snaps.reduce((a, s) => a + s.postCount, 0),
  }));

  const thisMonthSnaps = snapshots.filter(s => s.periodStart >= startThisMonth);
  const lastMonthSnaps = snapshots.filter(s => s.periodStart >= startLastMonth && s.periodStart < startThisMonth);

  const agg = (snaps: typeof snapshots) => ({
    views: snaps.reduce((a, s) => a + num(s.totalViews), 0),
    reach: snaps.reduce((a, s) => a + num(s.totalReach), 0),
    engagementRate: snaps.length > 0 ? snaps.reduce((a, s) => a + num(s.avgEngagementRate), 0) / snaps.length : 0,
    followers: snaps.reduce((a, s) => a + s.followerGrowth, 0),
    postCount: snaps.reduce((a, s) => a + s.postCount, 0),
  });

  const thisMonth = { ...agg(thisMonthSnaps), productCount: productRows.length, adSpend: 0 };
  const lastMonth = agg(lastMonthSnaps);

  // Budget
  const adSpendAgg = await prisma.content.aggregate({
    where: { clientId, publishDate: { gte: startThisMonth } },
    _sum: { adSpend: true },
  });
  thisMonth.adSpend = num(adSpendAgg._sum.adSpend);

  // Top content (by reach)
  const topContent = contentList
    .sort((a, b) => num(b.analytics?.reach) - num(a.analytics?.reach))
    .slice(0, 3)
    .map(c => ({
      id: c.id, title: c.title, topic: c.topic, platform: c.platform, contentType: c.contentType, status: c.status,
      caption: c.caption, script: c.script, assetUrls: c.assetUrls, hashtags: c.hashtags,
      scheduledAt: c.scheduledAt?.toISOString() ?? null, publishDate: c.publishDate?.toISOString() ?? null,
      adSpend: num(c.adSpend),
      views: num(c.analytics?.views), reach: num(c.analytics?.reach), likes: c.analytics?.likes ?? 0,
      comments: c.analytics?.comments ?? 0, shares: c.analytics?.shares ?? 0,
      engagementRate: num(c.analytics?.engagementRate),
    }));

  // Products
  const products = productRows.map(p => ({
    id: p.id, name: p.name, category: p.category, status: p.status,
    postCount: p.contents.length,
    totalReach: p.contents.reduce((sum, item) => sum + num(item.content.analytics?.reach), 0),
    totalEngagement: p.contents.reduce((sum, item) =>
      sum + (item.content.analytics?.likes ?? 0) + (item.content.analytics?.comments ?? 0) +
      (item.content.analytics?.shares ?? 0) + (item.content.analytics?.saves ?? 0), 0),
    totalViews: p.contents.reduce((sum, item) => sum + num(item.content.analytics?.views), 0),
  }));

  // Upcoming content
  const upcomingContent = upcomingRaw.map(c => ({
    id: c.id, title: c.title, topic: c.topic, platform: c.platform, contentType: c.contentType, status: c.status,
    caption: c.caption, script: c.script, assetUrls: c.assetUrls, hashtags: c.hashtags,
    scheduledAt: c.scheduledAt?.toISOString() ?? null, publishDate: c.publishDate?.toISOString() ?? null,
    adSpend: null, views: 0, reach: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0,
  }));

  // Activity
  const activityItems = approvalEvents.map(e => ({
    id: e.id, title: e.content.title, action: e.action, actor: e.actor?.name ?? null, date: e.createdAt.toISOString(),
  }));

  return (
    <ClientDashboard data={{
      client: client ? {
        brandName: client.brandName, description: client.description,
        status: client.status, monthlyBudget: num(client.monthlyBudget), monthlyRetainer: num(client.monthlyRetainer),
      } : null,
      thisMonth: {
        views: thisMonth.views, reach: thisMonth.reach, engagementRate: thisMonth.engagementRate,
        followers: thisMonth.followers, postCount: thisMonth.postCount, productCount: thisMonth.productCount, adSpend: thisMonth.adSpend,
      },
      lastMonth: {
        views: lastMonth.views, reach: lastMonth.reach, engagementRate: lastMonth.engagementRate,
        followers: lastMonth.followers, postCount: lastMonth.postCount,
      },
      monthlyTrend,
      topContent,
      products,
      upcomingContent,
      recentActivity: activityItems,
      budget: { monthly: num(client?.monthlyBudget), spent: thisMonth.adSpend, retainer: num(client?.monthlyRetainer) },
      pendingContent: pendingCount,
    }} />
  );
}
