import { prisma } from "@/lib/prisma";

/**
 * Calculates a 0–100 health score for a client based on:
 * - Engagement trend (0–20 pts)
 * - Reach trend (0–20 pts)
 * - Posting consistency (0–20 pts)
 * - Approval delays (0–20 pts)
 * - Follower growth trend (0–20 pts)
 */
export async function calculateHealthScore(clientId: string): Promise<number> {
  try {
    // Fetch last 3 months of analytics snapshots
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const snapshots = await prisma.analyticsSnapshot.findMany({
      where: {
        clientId,
        periodStart: { gte: threeMonthsAgo },
      },
      orderBy: { periodStart: "asc" },
    });

    // Fetch recent content for approval delay calculation
    const recentContent = await prisma.content.findMany({
      where: {
        clientId,
        status: { in: ["APPROVED", "SCHEDULED", "POSTED"] },
        createdAt: { gte: threeMonthsAgo },
      },
      include: {
        statusLogs: {
          where: {
            toStatus: { in: ["CLIENT_APPROVAL_PENDING", "APPROVED"] },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // 1. Engagement Trend (0–20 pts)
    const engagementScore = calculateTrendScore(
      snapshots.map((s) => Number(s.avgEngagementRate ?? 0))
    );

    // 2. Reach Trend (0–20 pts)
    const reachScore = calculateTrendScore(
      snapshots.map((s) => Number(s.totalReach))
    );

    // 3. Posting Consistency (0–20 pts) — expect at least 4 posts/month
    const totalPosts = snapshots.reduce((sum, s) => sum + s.postCount, 0);
    const monthsCovered = Math.max(1, snapshots.length / 6); // ~6 platforms per month snapshot
    const avgPostsPerMonth = totalPosts / monthsCovered;
    const consistencyScore = Math.min(20, (avgPostsPerMonth / 4) * 20);

    // 4. Approval Delays (0–20 pts) — lower delay = higher score
    let approvalScore = 20; // default: perfect if no content
    if (recentContent.length > 0) {
      const delays: number[] = [];
      for (const content of recentContent) {
        const submittedLog = content.statusLogs.find(
          (l) => l.toStatus === "CLIENT_APPROVAL_PENDING"
        );
        const approvedLog = content.statusLogs.find((l) => l.toStatus === "APPROVED");
        if (submittedLog && approvedLog) {
          const delayDays =
            (approvedLog.createdAt.getTime() - submittedLog.createdAt.getTime()) /
            (1000 * 60 * 60 * 24);
          delays.push(delayDays);
        }
      }
      if (delays.length > 0) {
        const avgDelay = delays.reduce((s, d) => s + d, 0) / delays.length;
        // 0 days delay = 20 pts, 14+ days = 0 pts
        approvalScore = Math.max(0, 20 - (avgDelay / 14) * 20);
      }
    }

    // 5. Follower Growth Trend (0–20 pts)
    const followerScore = calculateTrendScore(
      snapshots.map((s) => s.followerGrowth)
    );

    const totalScore = Math.round(
      engagementScore + reachScore + consistencyScore + approvalScore + followerScore
    );

    return Math.max(0, Math.min(100, totalScore));
  } catch (error) {
    console.error("[calculateHealthScore] Error:", error);
    return 0;
  }
}

/**
 * Given an array of values over time, returns a score 0–20 based on the trend.
 * Positive slope = closer to 20, flat = 10, negative = closer to 0.
 */
function calculateTrendScore(values: number[]): number {
  if (values.length < 2) return 10; // not enough data — neutral

  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - meanX) * (values[i] - meanY);
    denominator += (i - meanX) ** 2;
  }

  if (denominator === 0) return 10;

  const slope = numerator / denominator;
  const maxVal = Math.max(...values, 1);
  const normalizedSlope = slope / maxVal; // relative slope

  // Map [-0.5, +0.5] → [0, 20]
  const clamped = Math.max(-0.5, Math.min(0.5, normalizedSlope));
  return 10 + clamped * 20;
}

/**
 * Persists a health score calculation to the health_score_logs table
 * and updates the client's cached healthScore field.
 */
export async function persistHealthScore(clientId: string): Promise<number> {
  const score = await calculateHealthScore(clientId);

  const now = new Date();

  await Promise.all([
    prisma.healthScoreLog.create({
      data: {
        clientId,
        score,
        engagementComponent: Math.round(score * 0.2),
        reachComponent: Math.round(score * 0.2),
        consistencyComponent: Math.round(score * 0.2),
        approvalComponent: Math.round(score * 0.2),
        growthComponent: Math.round(score * 0.2),
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
      },
    }),
    prisma.client.update({
      where: { id: clientId },
      data: { healthScore: score },
    }),
  ]);

  return score;
}
