"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { generateReportSummary } from "@/lib/ai";
import type { ActionResult } from "@/types";
import type { Prisma, Report } from "@prisma/client";

interface GenerateReportInput {
  clientId: string;
  month: number;
  year: number;
  includeAiSummary?: boolean;
}

export async function generateReportAction(
  input: GenerateReportInput
): Promise<ActionResult<Report>> {
  try {
    const user = await requireAdmin();
    const { clientId, month, year, includeAiSummary = true } = input;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { brandName: true },
    });
    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // Check for existing report for this period
    const existing = await prisma.report.findUnique({
      where: { clientId_month_year: { clientId, month, year } },
    });
    if (existing) {
      return {
        success: false,
        error: `A report for ${month}/${year} already exists. Delete it first to regenerate.`,
      };
    }

    // Build period boundaries
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Gather analytics data in parallel
    const [snapshots, contents, products] = await Promise.all([
      prisma.analyticsSnapshot.findMany({
        where: {
          clientId,
          periodStart: { gte: periodStart, lte: periodEnd },
        },
      }),
      prisma.content.findMany({
        where: {
          clientId,
          publishDate: { gte: periodStart, lte: periodEnd },
        },
        include: { analytics: true },
      }),
      prisma.product.findMany({
        where: { clientId },
        include: {
          contents: { include: { content: { include: { analytics: true } } } },
        },
      }),
    ]);

    // Aggregate metrics
    const totalViews = snapshots.reduce((s, sn) => s + Number(sn.totalViews), 0);
    const totalReach = snapshots.reduce((s, sn) => s + Number(sn.totalReach), 0);
    const totalEngagement = snapshots.reduce((s, sn) => s + Number(sn.totalEngagement), 0);
    const totalFollowers = snapshots.reduce((s, sn) => s + sn.followerGrowth, 0);
    const totalAdSpend = contents.reduce(
      (s, c) => s + (c.adSpend ? Number(c.adSpend) : 0),
      0
    );

    // Platform breakdown
    const platformStats: Record<
      string,
      {
        views: number;
        reach: number;
        engagement: number;
        posts: number;
        followerGrowth: number;
        profileVisits: number;
        websiteClicks: number;
        pageLikes: number;
        profileViews: number;
        subscribers: number;
        watchTimeSeconds: number;
      }
    > = {};

    for (const sn of snapshots) {
      if (!platformStats[sn.platform]) {
        platformStats[sn.platform] = {
          views: 0,
          reach: 0,
          engagement: 0,
          posts: 0,
          followerGrowth: 0,
          profileVisits: 0,
          websiteClicks: 0,
          pageLikes: 0,
          profileViews: 0,
          subscribers: 0,
          watchTimeSeconds: 0,
        };
      }
      platformStats[sn.platform].views += Number(sn.totalViews);
      platformStats[sn.platform].reach += Number(sn.totalReach);
      platformStats[sn.platform].engagement += Number(sn.totalEngagement);
      platformStats[sn.platform].posts += sn.postCount;
      platformStats[sn.platform].followerGrowth += sn.followerGrowth;
      platformStats[sn.platform].profileVisits += Number(sn.profileVisits || BigInt(0));
      platformStats[sn.platform].websiteClicks += Number(sn.websiteClicks || BigInt(0));
      platformStats[sn.platform].pageLikes += Number(sn.pageLikes || BigInt(0));
      platformStats[sn.platform].profileViews += Number(sn.profileViews || BigInt(0));
      platformStats[sn.platform].subscribers += Number(sn.subscribers || BigInt(0));
      platformStats[sn.platform].watchTimeSeconds += Number(sn.watchTimeSeconds || BigInt(0));
    }

    // Top content
    const topContent = [...contents]
      .filter((c) => c.analytics)
      .sort((a, b) => Number(b.analytics!.engagementRate) - Number(a.analytics!.engagementRate))
      .slice(0, 5)
      .map((c) => {
        const analytics = c.analytics!;
        const likesVal = analytics.likes;
        const commentsVal = analytics.comments;
        const sharesVal = analytics.shares;
        const savesVal = analytics.saves;
        const clicksVal = analytics.clicks || 0;
        const reactionsVal = analytics.reactions || 0;
        const repostsVal = analytics.reposts || 0;
        const repliesVal = analytics.replies || 0;

        return {
          title: c.title,
          platform: c.platform,
          views: Number(analytics.views),
          reach: Number(analytics.reach),
          engagement:
            likesVal +
            commentsVal +
            sharesVal +
            savesVal +
            clicksVal +
            reactionsVal +
            repostsVal +
            repliesVal,
          engagementRate: Number(analytics.engagementRate ?? 0),
          watchTimeSecs: Number(analytics.watchTimeSecs || BigInt(0)),
          ctr: analytics.ctr ? Number(analytics.ctr) : null,
        };
      });

    // Top products
    const topProducts = products
      .map((p) => {
        let totalReachP = 0;
        let totalViewsP = 0;
        let totalEngagementP = 0;

        p.contents.forEach((cp) => {
          const analytics = cp.content.analytics;
          if (analytics) {
            totalReachP += Number(analytics.reach ?? 0);
            totalViewsP += Number(analytics.views ?? 0);

            const likesVal = analytics.likes;
            const commentsVal = analytics.comments;
            const sharesVal = analytics.shares;
            const savesVal = analytics.saves;
            const clicksVal = analytics.clicks || 0;
            const reactionsVal = analytics.reactions || 0;
            const repostsVal = analytics.reposts || 0;
            const repliesVal = analytics.replies || 0;

            totalEngagementP +=
              likesVal +
              commentsVal +
              sharesVal +
              savesVal +
              clicksVal +
              reactionsVal +
              repostsVal +
              repliesVal;
          }
        });

        return {
          name: p.name,
          posts: p.contents.length,
          reach: totalReachP,
          views: totalViewsP,
          engagement: totalEngagementP,
        };
      })
      .sort((a, b) => b.reach - a.reach)
      .slice(0, 5);

    const reportData = {
      period: `${month}/${year}`,
      client: client.brandName,
      metrics: { totalViews, totalReach, totalEngagement, totalFollowers, totalAdSpend },
      platformStats,
      topContent,
      topProducts,
      contentCount: contents.length,
    };

    // Generate AI summary if requested
    let aiSummary: string | null = null;
    if (includeAiSummary) {
      try {
        aiSummary = await generateReportSummary(reportData);
      } catch (aiErr) {
        console.warn("[generateReportAction] AI summary failed:", aiErr);
        aiSummary = null;
      }
    }

    // Create the report + sections in a transaction
    const report = await prisma.$transaction(async (tx) => {
      const newReport = await tx.report.create({
        data: {
          clientId,
          month,
          year,
          status: "GENERATING",
          dataSnapshot: reportData as Prisma.InputJsonValue,
          aiSummary: aiSummary ?? undefined,
          generatedBy: user.id,
        },
      });

      const sectionDefs = [
        { section: "EXECUTIVE_SUMMARY", title: "Executive Summary", sortOrder: 1 },
        { section: "PERFORMANCE_OVERVIEW", title: "Performance Overview", sortOrder: 2 },
        { section: "CONTENT_PERFORMANCE", title: "Content Performance", sortOrder: 3 },
        { section: "PLATFORM_BREAKDOWN", title: "Platform Breakdown", sortOrder: 4 },
        { section: "PRODUCT_PERFORMANCE", title: "Product Performance", sortOrder: 5 },
        { section: "BUDGET_UTILIZATION", title: "Budget Utilization", sortOrder: 6 },
        { section: "RECOMMENDATIONS", title: "Recommendations", sortOrder: 7 },
      ];

      await tx.reportSection.createMany({
        data: sectionDefs.map((sd) => ({
          reportId: newReport.id,
          section: sd.section,
          title: sd.title,
          sortOrder: sd.sortOrder,
          content: {},
        })),
      });

      return await tx.report.update({
        where: { id: newReport.id },
        data: { status: "READY" },
      });
    });

    revalidatePath(`/admin/clients/${clientId}/reports`);

    return { success: true, data: report };
  } catch (error) {
    console.error("[generateReportAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}
