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
}

export interface PlatformBreakdown extends AnalyticsOverview {
  platform: Platform;
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
    }
  );

  const engagementRate =
    totals.totalReach > 0
      ? (totals.totalEngagement / totals.totalReach) * 100
      : 0;

  return { ...totals, engagementRate };
}
