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
  conflictResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { z } from "zod";
import { Platform } from "@prisma/client";

const createSocialAccountSchema = z.object({
  platform: z.nativeEnum(Platform),
  accountId: z.string().min(1, "Account ID is required"),
  accountName: z.string().optional(),
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional().nullable(),
  scope: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const { id: clientId } = await params;

    const clientExists = await prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!clientExists) return notFoundResponse("Client");

    const socialAccounts = await prisma.socialAccount.findMany({
      where: { clientId },
      select: {
        id: true,
        clientId: true,
        platform: true,
        accountId: true,
        accountName: true,
        status: true,
        tokenExpiresAt: true,
        lastSyncAt: true,
        syncError: true,
        createdAt: true,
        updatedAt: true,
        // Exclude accessTokenEnc and refreshTokenEnc intentionally
      },
    });

    return successResponse(socialAccounts);
  } catch (error) {
    console.error("[GET /api/clients/[id]/social-accounts] Error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const { id: clientId } = await params;

    const clientExists = await prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!clientExists) return notFoundResponse("Client");

    const body = await req.json();
    const result = createSocialAccountSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const {
      platform,
      accountId,
      accountName,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      scope,
    } = result.data;

    // Check if platform is already connected for this client
    const existing = await prisma.socialAccount.findUnique({
      where: {
        clientId_platform: {
          clientId,
          platform,
        },
      },
    });

    if (existing) {
      return conflictResponse(
        "PLATFORM_ALREADY_CONNECTED",
        `Platform ${platform} is already connected for this client.`
      );
    }

    // Encrypt tokens
    const accessTokenEnc = encrypt(accessToken);
    const refreshTokenEnc = refreshToken ? encrypt(refreshToken) : null;

    const socialAccount = await prisma.socialAccount.create({
      data: {
        clientId,
        platform,
        accountId,
        accountName: accountName || null,
        accessTokenEnc,
        refreshTokenEnc,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
        scope: scope || null,
        status: "CONNECTED",
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "SOCIAL_ACCOUNT_CONNECTED",
      entityType: "SocialAccount",
      entityId: socialAccount.id,
      afterSnapshot: {
        id: socialAccount.id,
        platform,
        accountId,
        accountName,
      },
    });

    return successResponse(
      {
        id: socialAccount.id,
        platform: socialAccount.platform,
        accountId: socialAccount.accountId,
        status: socialAccount.status,
      },
      201
    );
  } catch (error) {
    console.error("[POST /api/clients/[id]/social-accounts] Error:", error);
    return internalErrorResponse();
  }
}
