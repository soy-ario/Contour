import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AnalyticsPageContent from "@/components/features/admin/analytics-page-content";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const user = await requireAdmin();

  const [clients, snapshots, topContent, products] = await Promise.all([
    prisma.client.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: { id: true, brandName: true },
      orderBy: { brandName: "asc" },
    }),
    prisma.analyticsSnapshot.findMany({
      orderBy: { periodStart: "desc" },
      include: { client: { select: { brandName: true } } },
    }),
    prisma.content.findMany({
      where: { analytics: { isNot: null } },
      orderBy: { analytics: { reach: "desc" } },
      take: 50,
      include: {
        client: { select: { brandName: true } },
        analytics: true,
      },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
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
    }),
  ]);

  const formattedSnapshots = snapshots.map((s) => ({
    id: s.id,
    clientId: s.clientId,
    clientBrandName: s.client.brandName,
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
    followerCountStart: s.followerCountStart ? Number(s.followerCountStart) : null,
    followerCountEnd: s.followerCountEnd ? Number(s.followerCountEnd) : null,
    followerGrowth: s.followerGrowth,
    avgEngagementRate: s.avgEngagementRate ? Number(s.avgEngagementRate) : null,
    postCount: s.postCount,
    storyCount: s.storyCount,
    reelCount: s.reelCount,
  }));

  const formattedTopContent = topContent.map((c) => ({
    id: c.id,
    title: c.title,
    platform: c.platform,
    contentType: c.contentType,
    clientBrandName: c.client.brandName,
    clientId: c.clientId,
    assetUrls: c.assetUrls,
    views: Number(c.analytics?.views ?? 0),
    reach: Number(c.analytics?.reach ?? 0),
    impressions: Number(c.analytics?.impressions ?? 0),
    likes: c.analytics?.likes ?? 0,
    comments: c.analytics?.comments ?? 0,
    shares: c.analytics?.shares ?? 0,
    saves: c.analytics?.saves ?? 0,
    engagementRate: c.analytics?.engagementRate ? Number(c.analytics.engagementRate) : 0,
  }));

  const formattedProducts = products.map((p) => {
    let totalReach = 0;
    let totalViews = 0;
    let totalEngagement = 0;

    p.contents.forEach((cp) => {
      const analytics = cp.content.analytics;
      if (analytics) {
        totalReach += Number(analytics.reach ?? 0);
        totalViews += Number(analytics.views ?? 0);
        
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
    });

    return {
      id: p.id,
      name: p.name,
      clientId: p.clientId,
      postCount: p.contents.length,
      reach: totalReach,
      views: totalViews,
      engagement: totalEngagement,
    };
  });

  const sessionUser = {
    name: user.name || "Admin",
    email: user.email || "",
    username: user.username,
  };

  return (
    <AnalyticsPageContent
      clients={clients}
      snapshots={formattedSnapshots}
      topContent={formattedTopContent}
      products={formattedProducts}
      user={sessionUser}
    />
  );
}
