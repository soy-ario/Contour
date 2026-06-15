import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ClientAnalytics from "@/components/features/client/client-analytics";

export const dynamic = "force-dynamic";

export default async function ClientAnalyticsPage() {
  const user = await requireClient();
  const clientId = user.clientId;

  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const previousLabel =
    prevStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " – " +
    prevEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const [snapshots, dailyMetrics, topContent] = await Promise.all([
    prisma.analyticsSnapshot.findMany({
      where: { clientId },
    }),
    prisma.platformDailyMetric.findMany({
      where: { clientId },
      orderBy: { metricDate: "asc" },
    }),
    prisma.content.findMany({
      where: {
        clientId,
        status: "POSTED",
        analytics: { isNot: null },
      },
      include: { analytics: true },
      orderBy: { analytics: { engagementRate: "desc" } },
    }),
  ]);

  // Safely serialize database BigInts to numbers to prevent Next.js serialization errors
  const serializedSnapshots = snapshots.map((s) => ({
    id: s.id,
    platform: s.platform,
    periodStart: s.periodStart.toISOString(),
    periodEnd: s.periodEnd.toISOString(),
    totalViews: Number(s.totalViews),
    totalReach: Number(s.totalReach),
    totalImpressions: Number(s.totalImpressions),
    totalEngagement: Number(s.totalEngagement),
    totalLikes: Number(s.totalLikes),
    totalComments: Number(s.totalComments),
    totalShares: Number(s.totalShares),
    totalSaves: Number(s.totalSaves),
    followerGrowth: s.followerGrowth,
    postCount: s.postCount,
    videoViews: Number(s.videoViews || BigInt(0)),
    watchTimeSeconds: Number(s.watchTimeSeconds || BigInt(0)),
    avgEngagementRate: s.avgEngagementRate ? Number(s.avgEngagementRate) : 0,
    avgCtr: s.avgCtr ? Number(s.avgCtr) : 0,
    profileVisits: Number(s.profileVisits || BigInt(0)),
    websiteClicks: Number(s.websiteClicks || BigInt(0)),
    pageLikes: Number(s.pageLikes || BigInt(0)),
    profileViews: Number(s.profileViews || BigInt(0)),
    subscribers: Number(s.subscribers || BigInt(0)),
  }));

  const serializedDailyMetrics = dailyMetrics.map((m) => ({
    id: m.id,
    platform: m.platform,
    metricDate: m.metricDate.toISOString(),
    views: Number(m.views),
    reach: Number(m.reach),
    impressions: Number(m.impressions),
    engagement: Number(m.engagement),
    likes: Number(m.likes),
    comments: Number(m.comments),
    shares: Number(m.shares),
    saves: Number(m.saves),
    followerDelta: m.followerDelta,
    videoViews: Number(m.videoViews || BigInt(0)),
    profileVisits: Number(m.profileVisits || BigInt(0)),
    websiteClicks: Number(m.websiteClicks || BigInt(0)),
    pageLikes: Number(m.pageLikes || BigInt(0)),
    profileViews: Number(m.profileViews || BigInt(0)),
    subscribers: Number(m.subscribers || BigInt(0)),
  }));

  const serializedTopContent = topContent.map((c) => ({
    id: c.id,
    title: c.title,
    views: Number(c.analytics?.views || BigInt(0)),
    reach: Number(c.analytics?.reach || BigInt(0)),
    impressions: Number(c.analytics?.impressions || BigInt(0)),
    engagementRate: c.analytics?.engagementRate ? Number(c.analytics.engagementRate) * 100 : 0,
    likes: c.analytics?.likes || 0,
    comments: c.analytics?.comments || 0,
    shares: c.analytics?.shares || 0,
    saves: c.analytics?.saves || 0,
    reactions: c.analytics?.reactions || 0,
    reposts: c.analytics?.reposts || 0,
    replies: c.analytics?.replies || 0,
    clicks: c.analytics?.clicks || 0,
    videoViews: Number(c.analytics?.videoViews || BigInt(0)),
    watchTimeSecs: Number(c.analytics?.watchTimeSecs || BigInt(0)),
    avgWatchPct: c.analytics?.avgWatchPct ? Number(c.analytics.avgWatchPct) : null,
    ctr: c.analytics?.ctr ? Number(c.analytics.ctr) : null,
    thumbnail: c.assetUrls?.[0] || null,
    platform: c.platform,
    contentType: c.contentType,
    publishedDate: c.publishDate?.toISOString() || c.createdAt.toISOString(),
  }));

  return (
    <ClientAnalytics
      snapshots={serializedSnapshots}
      dailyMetrics={serializedDailyMetrics}
      topContent={serializedTopContent}
      currentStart={currentStart.toISOString()}
      currentEnd={currentEnd.toISOString()}
      prevStart={prevStart.toISOString()}
      prevEnd={prevEnd.toISOString()}
      previousLabel={previousLabel}
    />
  );
}
