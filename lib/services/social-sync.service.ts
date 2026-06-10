/**
 * Social Sync Service
 *
 * This service is responsible for syncing analytics data from social media platforms.
 * In production, this would call actual platform APIs (Instagram Graph API, etc.).
 * For now, it provides the interface and a simulated sync flow.
 */

import { prisma } from "@/lib/prisma";
import { Platform, SyncStatus } from "@prisma/client";

export interface SyncResult {
  platform: Platform;
  status: SyncStatus;
  recordsSynced: number;
  error?: string;
}

/**
 * Trigger a sync for a single social account.
 * Creates a sync log entry and simulates the sync process.
 * Replace the body with real API calls for production.
 */
export async function syncSocialAccount(
  clientId: string,
  socialAccountId: string
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

  // Create sync log entry
  const syncLog = await prisma.syncLog.create({
    data: {
      clientId,
      platform: account.platform,
      status: SyncStatus.STARTED,
    },
  });

  try {
    // TODO: Replace with real platform API calls
    // For now, simulate a successful sync
    const recordsSynced = 0;

    // Update the social account's last sync timestamp
    await prisma.socialAccount.update({
      where: { id: socialAccountId },
      data: { lastSyncAt: new Date() },
    });

    // Mark sync log as successful
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

    // Mark sync log as failed
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      },
    });

    // Update social account status to reflect error
    await prisma.socialAccount.update({
      where: { id: socialAccountId },
      data: { status: "ERROR", syncError: errorMessage },
    });

    return {
      platform: account.platform,
      status: SyncStatus.FAILED,
      recordsSynced: 0,
      error: errorMessage,
    };
  }
}

/**
 * Sync all connected social accounts for a client.
 */
export async function syncAllClientAccounts(clientId: string): Promise<SyncResult[]> {
  const accounts = await prisma.socialAccount.findMany({
    where: {
      clientId,
      status: { in: ["CONNECTED", "TOKEN_EXPIRED"] },
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
      error: result.reason?.message ?? "Unknown error",
    };
  });
}
