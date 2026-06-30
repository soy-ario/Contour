import { prisma } from "@/lib/prisma";
import { Platform, SyncStatus, ConnectionStatus, Prisma } from "@prisma/client";
import { decrypt, encrypt } from "@/lib/crypto";
import { getPlatformClient } from "@/lib/services/platforms";
import { PlatformNotConfiguredError, PlatformAuthError } from "@/lib/services/platforms/platform-client";

export interface SyncResult {
  platform: Platform;
  status: SyncStatus;
  recordsSynced: number;
  error?: string;
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 150
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(operation, retries - 1, delay * 2.5);
  }
}

function getAccessToken(account: {
  accessTokenEnc: string;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
}): string {
  if (!account.accessTokenEnc) {
    throw new Error("AUTHENTICATION_FAILED: No access token stored");
  }
  return decrypt(account.accessTokenEnc);
}

export async function refreshTokenIfNeeded(socialAccountId: string): Promise<boolean> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  });

  if (!account) return false;

  const thresholdMs = 5 * 60 * 1000;
  const now = Date.now();
  const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt).getTime() : null;

  if (expiresAt && expiresAt - now > thresholdMs) {
    return true;
  }

  if (!account.refreshTokenEnc) {
    if (expiresAt && expiresAt <= now) {
      await prisma.socialAccount.update({
        where: { id: socialAccountId },
        data: {
          status: ConnectionStatus.TOKEN_EXPIRED,
          syncError: "OAuth access token expired; manual re-authorization required.",
        },
      });
      return false;
    }
    return true;
  }

  try {
    const platformClient = getPlatformClient(account.platform);
    const refreshToken = decrypt(account.refreshTokenEnc);
    const result = await platformClient.refreshToken(refreshToken);

    await prisma.socialAccount.update({
      where: { id: socialAccountId },
      data: {
        accessTokenEnc: encrypt(result.accessToken),
        refreshTokenEnc: result.refreshToken ? encrypt(result.refreshToken) : undefined,
        tokenExpiresAt: result.expiresAt,
        expiresAt: result.expiresAt,
        status: ConnectionStatus.CONNECTED,
        syncError: null,
      },
    });

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Token refresh failed";
    console.error(`[Sync Token] Failed to refresh token for account ${socialAccountId}:`, error);

    await prisma.socialAccount.update({
      where: { id: socialAccountId },
      data: {
        status: ConnectionStatus.TOKEN_EXPIRED,
        syncError: `Token refresh failed: ${errorMsg}`,
      },
    });

    return false;
  }
}

export async function syncSocialAccount(
  clientId: string,
  socialAccountId: string,
  syncLogId?: string
): Promise<SyncResult> {
  const account = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
  });

  if (!account || account.clientId !== clientId) {
    return {
      platform: Platform.INSTAGRAM,
      status: SyncStatus.FAILED,
      recordsSynced: 0,
      error: "Social account not found",
    };
  }

  let syncLog;
  if (syncLogId) {
    syncLog = { id: syncLogId };
  } else {
    syncLog = await prisma.syncLog.create({
      data: {
        clientId,
        platform: account.platform,
        status: SyncStatus.STARTED,
      },
    });
  }

  try {
    const tokenOk = await refreshTokenIfNeeded(socialAccountId);
    if (!tokenOk) {
      throw new Error("AUTHENTICATION_FAILED: OAuth token refresh failed or token expired.");
    }

    const recordsSynced = await retryWithBackoff(async () => {
      const platformClient = getPlatformClient(account.platform);
      const accessToken = getAccessToken(account);
      const now = new Date();

      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      periodStart.setUTCHours(0, 0, 0, 0);
      periodEnd.setUTCHours(0, 0, 0, 0);

      const since = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const sinceDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
      sinceDateOnly.setUTCHours(0, 0, 0, 0);

      const posts = await platformClient.fetchPosts(accessToken, sinceDateOnly);
      let contentSynced = 0;
      let totalViews = BigInt(0);
      let totalReach: bigint | null = null;
      let totalImpressions = BigInt(0);
      let totalLikes = BigInt(0);
      let totalComments = BigInt(0);
      let totalShares = BigInt(0);
      let totalSaves = BigInt(0);
      let totalVideoViews = BigInt(0);
      let totalWatchTime = BigInt(0);
      let totalReplies = BigInt(0);
      let totalReposts = BigInt(0);
      let totalReactions = BigInt(0);
      let totalClicks = BigInt(0);

      for (const post of posts) {
        let metrics = await platformClient.fetchPostMetrics(accessToken, post.nativePostId);

        totalViews += BigInt(metrics.views);
        if (metrics.reach !== null) totalReach = (totalReach ?? BigInt(0)) + BigInt(metrics.reach);
        totalImpressions += BigInt(metrics.impressions);
        totalLikes += BigInt(metrics.likes);
        totalComments += BigInt(metrics.comments);
        totalShares += BigInt(metrics.shares);
        totalSaves += BigInt(metrics.saves);
        totalVideoViews += BigInt(metrics.videoViews);
        totalWatchTime += BigInt(metrics.watchTimeSecs);
        totalReplies += BigInt(metrics.replies);
        totalReposts += BigInt(metrics.reposts);
        totalReactions += BigInt(metrics.reactions);
        totalClicks += BigInt(metrics.clicks);

        const mgmtEngagement = metrics.likes + metrics.comments + metrics.shares + metrics.saves
          + metrics.replies + metrics.reposts + metrics.reactions + metrics.clicks;

        let existingContent = await prisma.content.findFirst({
          where: {
            clientId,
            platform: account.platform,
            status: "POSTED",
          },
          orderBy: { postedAt: "desc" },
        });

        if (existingContent) {
          const existingAnalytic = await prisma.contentAnalytic.findUnique({
            where: { contentId: existingContent.id },
          });

          if (existingAnalytic) {
            const combinedReach = metrics.reach !== null
              ? BigInt(metrics.reach) + existingAnalytic.reach
              : null;

            await prisma.contentAnalytic.update({
              where: { contentId: existingContent.id },
              data: {
                views: existingAnalytic.views + BigInt(metrics.views),
                reach: combinedReach ?? existingAnalytic.reach,
                impressions: existingAnalytic.impressions + BigInt(metrics.impressions),
                likes: existingAnalytic.likes + metrics.likes,
                comments: existingAnalytic.comments + metrics.comments,
                shares: existingAnalytic.shares + metrics.shares,
                saves: existingAnalytic.saves + metrics.saves,
                videoViews: existingAnalytic.videoViews + BigInt(metrics.videoViews),
                watchTimeSecs: existingAnalytic.watchTimeSecs + BigInt(metrics.watchTimeSecs),
                reactions: existingAnalytic.reactions + metrics.reactions,
                reposts: existingAnalytic.reposts + metrics.reposts,
                replies: existingAnalytic.replies + metrics.replies,
                clicks: existingAnalytic.clicks + metrics.clicks,
                lastSyncedAt: now,
              },
            });
          }
        }

        contentSynced++;
      }

      const accountMetrics = await platformClient.fetchAccountInsights(accessToken, periodStart, periodEnd);

      const postCount = posts.length;
      const avgEngagementNumerator = Number(totalLikes) + Number(totalComments) + Number(totalShares) + Number(totalSaves);
      const avgEngagementDenominator = Number(totalReach ?? totalViews);
      const engagementRate = avgEngagementDenominator > 0
        ? new Prisma.Decimal(avgEngagementNumerator / avgEngagementDenominator)
        : null;

      const followerGrowth = accountMetrics.followerGrowth;

      await prisma.analyticsSnapshot.upsert({
        where: {
          clientId_platform_periodStart_periodEnd: {
            clientId,
            platform: account.platform,
            periodStart,
            periodEnd,
          },
        },
        create: {
          clientId,
          platform: account.platform,
          periodStart,
          periodEnd,
          totalViews,
          totalReach: totalReach ?? BigInt(0),
          totalImpressions,
          totalEngagement: totalLikes + totalComments + totalShares + totalSaves,
          totalLikes,
          totalComments,
          totalShares,
          totalSaves,
          followerCountEnd: BigInt(accountMetrics.followerCount),
          followerGrowth,
          videoViews: totalVideoViews,
          watchTimeSeconds: totalWatchTime,
          avgEngagementRate: engagementRate,
          avgCtr: null,
          postCount,
          profileVisits: BigInt(accountMetrics.profileVisits),
          websiteClicks: BigInt(accountMetrics.websiteClicks),
          pageLikes: BigInt(accountMetrics.pageLikes),
          profileViews: BigInt(accountMetrics.profileViews),
          subscribers: BigInt(accountMetrics.subscribers),
        },
        update: {
          totalViews,
          totalReach: totalReach ?? BigInt(0),
          totalImpressions,
          totalEngagement: totalLikes + totalComments + totalShares + totalSaves,
          totalLikes,
          totalComments,
          totalShares,
          totalSaves,
          followerCountEnd: BigInt(accountMetrics.followerCount),
          followerGrowth: {
            increment: followerGrowth,
          },
          videoViews: totalVideoViews,
          watchTimeSeconds: totalWatchTime,
          avgEngagementRate: engagementRate,
          postCount,
          profileVisits: BigInt(accountMetrics.profileVisits),
          websiteClicks: BigInt(accountMetrics.websiteClicks),
          pageLikes: BigInt(accountMetrics.pageLikes),
          profileViews: BigInt(accountMetrics.profileViews),
          subscribers: BigInt(accountMetrics.subscribers),
        },
      });

      for (let i = 30; i >= 0; i--) {
        const metricDate = new Date();
        metricDate.setUTCDate(metricDate.getUTCDate() - i);
        metricDate.setUTCHours(0, 0, 0, 0);

        await prisma.platformDailyMetric.upsert({
          where: {
            clientId_platform_metricDate: {
              clientId,
              platform: account.platform,
              metricDate,
            },
          },
          create: {
            clientId,
            platform: account.platform,
            metricDate,
            views: totalViews,
            reach: totalReach ?? BigInt(0),
            impressions: totalImpressions,
            engagement: totalLikes + totalComments + totalShares + totalSaves,
            likes: totalLikes,
            comments: totalComments,
            shares: totalShares,
            saves: totalSaves,
            followerDelta: 0,
            profileVisits: BigInt(accountMetrics.profileVisits),
            websiteClicks: BigInt(accountMetrics.websiteClicks),
            pageLikes: BigInt(accountMetrics.pageLikes),
            profileViews: BigInt(accountMetrics.profileViews),
            subscribers: BigInt(accountMetrics.subscribers),
          },
          update: {
            views: totalViews,
            reach: totalReach ?? BigInt(0),
            impressions: totalImpressions,
            engagement: totalLikes + totalComments + totalShares + totalSaves,
            likes: totalLikes,
            comments: totalComments,
            shares: totalShares,
            saves: totalSaves,
            profileVisits: BigInt(accountMetrics.profileVisits),
            websiteClicks: BigInt(accountMetrics.websiteClicks),
            pageLikes: BigInt(accountMetrics.pageLikes),
            profileViews: BigInt(accountMetrics.profileViews),
            subscribers: BigInt(accountMetrics.subscribers),
          },
        });
      }

      return contentSynced;
    });

    await prisma.socialAccount.update({
      where: { id: socialAccountId },
      data: {
        lastSyncAt: new Date(),
        status: ConnectionStatus.CONNECTED,
        syncError: null,
      },
    });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        recordsSynced,
        completedAt: new Date(),
      },
    });

    return {
      platform: account.platform,
      status: SyncStatus.SUCCESS,
      recordsSynced,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
    console.error(`[Sync Engine] Sync failed for account ${socialAccountId}:`, error);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      },
    });

    const isAuthFailure = errorMessage.includes("AUTHENTICATION_FAILED")
      || errorMessage.includes("401")
      || error instanceof PlatformAuthError;
    const isNotConfigured = error instanceof PlatformNotConfiguredError;
    const nextStatus = isAuthFailure ? ConnectionStatus.TOKEN_EXPIRED : ConnectionStatus.ERROR;

    await prisma.socialAccount.update({
      where: { id: socialAccountId },
      data: {
        status: isNotConfigured ? ConnectionStatus.ERROR : nextStatus,
        syncError: errorMessage,
      },
    });

    return {
      platform: account.platform,
      status: isNotConfigured ? SyncStatus.PARTIAL : SyncStatus.FAILED,
      recordsSynced: 0,
      error: errorMessage,
    };
  }
}

export async function syncAllClientAccounts(clientId: string): Promise<SyncResult[]> {
  const accounts = await prisma.socialAccount.findMany({
    where: {
      clientId,
      status: { in: [ConnectionStatus.CONNECTED, ConnectionStatus.TOKEN_EXPIRED] },
    },
  });

  const results = await Promise.allSettled(
    accounts.map((account) => syncSocialAccount(clientId, account.id))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      platform: accounts[index].platform,
      status: SyncStatus.FAILED,
      recordsSynced: 0,
      error: result.reason?.message ?? "Unknown client sync error",
    };
  });
}
