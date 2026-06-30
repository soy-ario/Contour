import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { Platform, ConnectionStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/services/audit.service";
import { getPlatformClient } from "@/lib/services/platforms";
import { PlatformNotConfiguredError, PlatformAuthError } from "@/lib/services/platforms/platform-client";

interface RouteParams {
  params: Promise<{ platform: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { platform: rawPlatform } = await params;
    const platformUpper = rawPlatform.toUpperCase();

    if (!Object.values(Platform).includes(platformUpper as Platform)) {
      return NextResponse.json({ error: `Invalid platform: ${rawPlatform}` }, { status: 400 });
    }

    const platform = platformUpper as Platform;
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      const redirectError = new URL(`/admin/clients?oauth_error=${error}`, req.nextUrl.origin);
      return NextResponse.redirect(redirectError);
    }

    if (!code) {
      return NextResponse.json({ error: "Authorization code is missing" }, { status: 400 });
    }

    let clientId = "";
    let role = "admin";

    if (state) {
      try {
        const parsed = JSON.parse(state);
        clientId = parsed.clientId || "";
        role = parsed.role || "admin";
      } catch {
        clientId = state;
      }
    }

    if (!clientId) {
      return NextResponse.json({ error: "Client identifier (state) is missing" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: `Client not found: ${clientId}` }, { status: 404 });
    }

    const platformClient = getPlatformClient(platform);
    const redirectUri = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/callback/${rawPlatform.toLowerCase()}`;

    const tokenResult = await platformClient.exchangeCode(code, redirectUri);
    const profile = await platformClient.fetchProfile(tokenResult.accessToken);

    const accessTokenEnc = encrypt(tokenResult.accessToken);
    const refreshTokenEnc = tokenResult.refreshToken ? encrypt(tokenResult.refreshToken) : null;

    const accountData = {
      accountId: profile.platformAccountId,
      accountName: profile.platformUsername,
      accessTokenEnc,
      refreshTokenEnc: refreshTokenEnc ?? undefined,
      tokenExpiresAt: tokenResult.expiresAt,
      expiresAt: tokenResult.expiresAt,
      username: profile.platformUsername,
      profileUrl: `https://${platform.toLowerCase()}.com/${profile.platformUsername}`,
      profileImageUrl: (profile.profileData as any)?.profile_picture_url ?? (profile.profileData as any)?.avatar_url ?? null,
      status: ConnectionStatus.CONNECTED,
      syncError: null,
      lastSyncAt: new Date(),
    };

    const existing = await prisma.socialAccount.findUnique({
      where: { clientId_platform: { clientId, platform } },
    });

    let socialAccountId: string;
    if (existing) {
      const updated = await prisma.socialAccount.update({
        where: { id: existing.id },
        data: accountData,
      });
      socialAccountId = updated.id;
    } else {
      const created = await prisma.socialAccount.create({
        data: { clientId, platform, ...accountData },
      });
      socialAccountId = created.id;
    }

    await createAuditLog({
      actorId: "system",
      action: "SOCIAL_ACCOUNT_CONNECTED",
      entityType: "SocialAccount",
      entityId: socialAccountId,
      afterSnapshot: {
        id: socialAccountId,
        platform,
        accountId: profile.platformAccountId,
        username: profile.platformUsername,
      },
    });

    const redirectPath =
      role === "client"
        ? `/client/settings?connected=true&platform=${platform.toLowerCase()}`
        : `/admin/clients/${clientId}/settings?connected=true&platform=${platform.toLowerCase()}`;

    return NextResponse.redirect(new URL(redirectPath, req.nextUrl.origin));
  } catch (error) {
    console.error("[GET /api/auth/callback/[platform]]", error);

    if (error instanceof PlatformNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: "OAuth authentication failed" }, { status: 500 });
  }
}
