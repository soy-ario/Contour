import { prisma } from "@/lib/prisma";
import { Platform } from "@prisma/client";

export interface AnalyticsOverview {
  totalViews: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  followerGrowth: number;
  postCount: number;
  engagementRate: number;
  // Platform-specific metrics
  profileVisits: number;
  websiteClicks: number;
  pageLikes: number;
  profileViews: number;
  subscribers: number;
  videoViews: number;
  watchTimeSeconds: number;
}

export interface PlatformBreakdown extends AnalyticsOverview {
  platform: Platform;
}

export interface ProductPerformance {
  productId: string;
  name: string;
  postCount: number;
  totalViews: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  engagementRate: number;
}

export interface GrowthMetrics {
  viewsGrowthPct: number;
  reachGrowthPct: number;
  engagementGrowthPct: number;
  followerGrowthPct: number;
}

/**
 * Aggregate all analytics snapshots for a client in a given month.
 */
export async function getClientMonthlyOverview(
  clientId: string,
  year: number,
  month: number
): Promise<{ current: AnalyticsOverview; previous: AnalyticsOverview }> {
  const currentStart = new Date(year, month - 1, 1);
  const currentEnd = new Date(year, month, 0);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const previousStart = new Date(prevYear, prevMonth - 1, 1);
  const previousEnd = new Date(prevYear, prevMonth, 0);

  const [currentSnaps, previousSnaps] = await Promise.all([
    prisma.analyticsSnapshot.findMany({
      where: {
        clientId,
        periodStart: { gte: currentStart, lte: currentEnd },
      },
    }),
    prisma.analyticsSnapshot.findMany({
      where: {
        clientId,
        periodStart: { gte: previousStart, lte: previousEnd },
      },
    }),
  ]);

  return {
    current: aggregateSnapshots(currentSnaps),
    previous: aggregateSnapshots(previousSnaps),
  };
}

/**
 * Get per-platform breakdown for a client in a given month.
 */
export async function getClientPlatformBreakdown(
  clientId: string,
  year: number,
  month: number
): Promise<PlatformBreakdown[]> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      clientId,
      periodStart: { gte: start, lte: end },
    },
  });

  // Group by platform
  const byPlatform: Record<string, typeof snapshots> = {};
  for (const snap of snapshots) {
    if (!byPlatform[snap.platform]) byPlatform[snap.platform] = [];
    byPlatform[snap.platform].push(snap);
  }

  return Object.entries(byPlatform).map(([platform, snaps]) => ({
    platform: platform as Platform,
    ...aggregateSnapshots(snaps),
  }));
}

/**
 * Get top performing content for a client.
 */
export async function getTopPerformingContent(
  clientId: string,
  year: number,
  month: number,
  take = 5
) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return prisma.content.findMany({
    where: {
      clientId,
      publishDate: { gte: start, lte: end },
      analytics: { isNot: null },
    },
    include: { analytics: true },
    orderBy: { analytics: { engagementRate: "desc" } },
    take,
  });
}

/**
 * Get agency-wide aggregate metrics across all active clients.
 */
export async function getAgencyMetrics() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      periodStart: { gte: start, lte: end },
    },
    include: { client: { select: { brandName: true, status: true } } },
  });

  const overview = aggregateSnapshots(snapshots);
  return overview;
}

function aggregateSnapshots(
  snapshots: Awaited<ReturnType<typeof prisma.analyticsSnapshot.findMany>>
): AnalyticsOverview {
  const totals = snapshots.reduce(
    (acc, s) => ({
      totalViews: acc.totalViews + Number(s.totalViews),
      totalReach: acc.totalReach + Number(s.totalReach),
      totalImpressions: acc.totalImpressions + Number(s.totalImpressions),
      totalEngagement: acc.totalEngagement + Number(s.totalEngagement),
      totalLikes: acc.totalLikes + Number(s.totalLikes),
      totalComments: acc.totalComments + Number(s.totalComments),
      totalShares: acc.totalShares + Number(s.totalShares),
      totalSaves: acc.totalSaves + Number(s.totalSaves),
      followerGrowth: acc.followerGrowth + s.followerGrowth,
      postCount: acc.postCount + s.postCount,
      // Platform-specific metrics
      profileVisits: acc.profileVisits + Number(s.profileVisits || 0),
      websiteClicks: acc.websiteClicks + Number(s.websiteClicks || 0),
      pageLikes: acc.pageLikes + Number(s.pageLikes || 0),
      profileViews: acc.profileViews + Number(s.profileViews || 0),
      subscribers: acc.subscribers + Number(s.subscribers || 0),
      videoViews: acc.videoViews + Number(s.videoViews || 0),
      watchTimeSeconds: acc.watchTimeSeconds + Number(s.watchTimeSeconds || 0),
    }),
    {
      totalViews: 0,
      totalReach: 0,
      totalImpressions: 0,
      totalEngagement: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalSaves: 0,
      followerGrowth: 0,
      postCount: 0,
      profileVisits: 0,
      websiteClicks: 0,
      pageLikes: 0,
      profileViews: 0,
      subscribers: 0,
      videoViews: 0,
      watchTimeSeconds: 0,
    }
  );

  const engagementRate =
    totals.totalReach > 0
      ? (totals.totalEngagement / totals.totalReach) * 100
      : 0;

  return { ...totals, engagementRate };
}

// ─── REUSABLE WRAPPERS REQUIRED BY SPEC ─────────────────────────────────────

export async function getClientOverviewMetrics(
  clientId: string,
  year: number,
  month: number
): Promise<AnalyticsOverview> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      clientId,
      periodStart: { gte: start, lte: end },
    },
  });

  return aggregateSnapshots(snapshots);
}

export async function getPlatformAnalytics(
  clientId: string,
  year: number,
  month: number
): Promise<PlatformBreakdown[]> {
  return getClientPlatformBreakdown(clientId, year, month);
}

export async function getProductPerformance(
  clientId: string,
  year: number,
  month: number
): Promise<ProductPerformance[]> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  const products = await prisma.product.findMany({
    where: { clientId },
    include: {
      contents: {
        include: {
          content: {
            include: {
              analytics: true,
            },
          },
        },
      },
    },
  });

  return products.map((p) => {
    const monthlyContents = p.contents.filter((cp) => {
      const pubDate = cp.content.publishDate;
      return (
        cp.content.status === "POSTED" &&
        pubDate &&
        pubDate >= start &&
        pubDate <= end
      );
    });

    let totalViews = 0;
    let totalReach = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;

    for (const cp of monthlyContents) {
      const analytics = cp.content.analytics;
      if (analytics) {
        totalViews += Number(analytics.views);
        totalReach += Number(analytics.reach);
        totalImpressions += Number(analytics.impressions);
        
        // sum up core and platform specific engagement interactions
        const likesVal = analytics.likes;
        const commentsVal = analytics.comments;
        const sharesVal = analytics.shares;
        const savesVal = analytics.saves;
        const clicksVal = analytics.clicks || 0;
        const reactionsVal = analytics.reactions || 0;
        const repostsVal = analytics.reposts || 0;
        const repliesVal = analytics.replies || 0;
        
        totalEngagement += (likesVal + commentsVal + sharesVal + savesVal + clicksVal + reactionsVal + repostsVal + repliesVal);
      }
    }

    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    return {
      productId: p.id,
      name: p.name,
      postCount: monthlyContents.length,
      totalViews,
      totalReach,
      totalImpressions,
      totalEngagement,
      engagementRate,
    };
  });
}

export async function getTopContent(
  clientId: string,
  year: number,
  month: number,
  take = 5
) {
  return getTopPerformingContent(clientId, year, month, take);
}

export async function getGrowthMetrics(
  clientId: string,
  year: number,
  month: number
): Promise<GrowthMetrics> {
  const { current, previous } = await getClientMonthlyOverview(clientId, year, month);

  const calcPct = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

  return {
    viewsGrowthPct: calcPct(current.totalViews, previous.totalViews),
    reachGrowthPct: calcPct(current.totalReach, previous.totalReach),
    engagementGrowthPct: calcPct(current.totalEngagement, previous.totalEngagement),
    followerGrowthPct: calcPct(current.followerGrowth, previous.followerGrowth),
  };
}
