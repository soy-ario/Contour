import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { createAuditLog } from "@/lib/services/audit.service";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { z } from "zod";
import { ConnectionStatus, Prisma } from "@prisma/client";

const patchSocialAccountSchema = z.object({
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional().nullable(),
  status: z.enum(["CONNECTED", "DISCONNECTED"]).optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
    accountId: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    const body = await req.json();
    const result = patchSocialAccountSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const data = result.data;
    const updateData: Prisma.SocialAccountUpdateInput = {};

    if (data.accessToken !== undefined) {
      updateData.accessTokenEnc = encrypt(data.accessToken);
    }
    if (data.refreshToken !== undefined) {
      updateData.refreshTokenEnc = encrypt(data.refreshToken);
    }
    if (data.tokenExpiresAt !== undefined) {
      updateData.tokenExpiresAt = data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status as ConnectionStatus;
    }

    const updated = await prisma.socialAccount.update({
      where: { id: socialAccount.id },
      data: updateData,
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "SOCIAL_ACCOUNT_UPDATED",
      entityType: "SocialAccount",
      entityId: socialAccount.id,
      beforeSnapshot: { status: socialAccount.status },
      afterSnapshot: { status: updated.status },
    });

    return successResponse({
      id: updated.id,
      clientId: updated.clientId,
      platform: updated.platform,
      accountId: updated.accountId,
      accountName: updated.accountName,
      status: updated.status,
      tokenExpiresAt: updated.tokenExpiresAt,
      lastSyncAt: updated.lastSyncAt,
      syncError: updated.syncError,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("[PATCH /api/clients/[id]/social-accounts/[accountId]] Error:", error);
    return internalErrorResponse();
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    await prisma.socialAccount.delete({
      where: { id: socialAccount.id },
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "SOCIAL_ACCOUNT_DELETED",
      entityType: "SocialAccount",
      entityId: socialAccount.id,
      beforeSnapshot: {
        id: socialAccount.id,
        platform: socialAccount.platform,
        accountId: socialAccount.accountId,
      },
    });

    return successResponse({ message: "Social account disconnected" });
  } catch (error) {
    console.error("[DELETE /api/clients/[id]/social-accounts/[accountId]] Error:", error);
    return internalErrorResponse();
  }
}
