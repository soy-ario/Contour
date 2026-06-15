import { NextRequest, after } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { syncSocialAccount } from "@/lib/services/social-sync.service";

interface RouteParams {
  params: Promise<{
    id: string;
    accountId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const { id: clientId, accountId } = await params;

    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        clientId,
        accountId,
      },
    });

    if (!socialAccount) {
      return notFoundResponse("Social Account");
    }

    // Create a SyncLog record with status STARTED
    const syncLog = await prisma.syncLog.create({
      data: {
        clientId,
        platform: socialAccount.platform,
        status: "STARTED",
        recordsSynced: 0,
      },
    });

    // Trigger the background sync process without awaiting
    after(() => {
      syncSocialAccount(clientId, socialAccount.id, syncLog.id).catch((e) => {
        console.error("[POST /api/clients/[id]/social-accounts/[accountId]/sync] Background task error:", e);
      });
    });

    // Return 202 Accepted response as required by API specification
    return successResponse(
      {
        syncLogId: syncLog.id,
        status: syncLog.status,
        startedAt: syncLog.startedAt,
      },
      202
    );
  } catch (error) {
    console.error("[POST /api/clients/[id]/social-accounts/[accountId]/sync] Error:", error);
    return internalErrorResponse();
  }
}
