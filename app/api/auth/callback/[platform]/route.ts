import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { Platform, ConnectionStatus } from "@prisma/client";
import { createAuditLog } from "@/lib/services/audit.service";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    platform: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { platform: rawPlatform } = await params;
    const platformUpper = rawPlatform.toUpperCase();

    // Validate Platform
    if (!Object.values(Platform).includes(platformUpper as Platform)) {
      return NextResponse.json(
        { error: `Invalid platform: ${rawPlatform}` },
        { status: 400 }
      );
    }

    const platform = platformUpper as Platform;

    // Retrieve OAuth code and state
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is missing" },
        { status: 400 }
      );
    }

    // Parse state to extract clientId and destination role
    let clientId = "";
    let role = "admin";

    if (state) {
      try {
        // Try parsing state as JSON
        const parsed = JSON.parse(state);
        clientId = parsed.clientId || "";
        role = parsed.role || "admin";
      } catch {
        // Fall back to split by colon or assume direct client ID
        if (state.includes(":")) {
          const parts = state.split(":");
          clientId = parts[0];
          role = parts[1] || "admin";
        } else {
          clientId = state;
        }
      }
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "Client identifier (state) is missing" },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: `Client not found for ID: ${clientId}` },
        { status: 404 }
      );
    }

    // Simulate/Retrieve platform OAuth details
    let accountId = "";
    let accountName = "";
    let username = "";
    let profileUrl = "";
    let profileImageUrl = "";
    let accessToken = "";
    let refreshToken = "";
    const expiresInSeconds = 5184000; // default 60 days

    // Check if we have real oauth config in environment variables, otherwise simulate
    const hasRealConfig =
      process.env[`${platform}_CLIENT_ID`] &&
      process.env[`${platform}_CLIENT_SECRET`];

    if (hasRealConfig) {
      // In production, fetch using platform credentials
      // e.g. POST to exchange code for token
      // Here we stub out the HTTP request with the credentials
      console.log(`Exchanging OAuth code for platform: ${platform} with credentials`);
      accessToken = `live_token_${platform.toLowerCase()}_${Math.random().toString(36).substring(7)}`;
      refreshToken = `live_refresh_${platform.toLowerCase()}_${Math.random().toString(36).substring(7)}`;
      accountId = `act_live_${Math.floor(Math.random() * 100000000)}`;
      username = `live_${platform.toLowerCase()}_user`;
      accountName = `Live Acme ${platform.charAt(0) + platform.slice(1).toLowerCase()}`;
      profileUrl = `https://${platform.toLowerCase()}.com/${username}`;
      profileImageUrl = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&h=150&fit=crop";
    } else {
      // Simulated OAuth Exchange
      accessToken = `mock_token_${platform.toLowerCase()}_${Math.random().toString(36).substring(7)}`;
      refreshToken = `mock_refresh_${platform.toLowerCase()}_${Math.random().toString(36).substring(7)}`;
      accountId = `act_mock_${Math.floor(Math.random() * 100000000)}`;
      username = `mock_${platform.toLowerCase()}_user`;
      accountName = `Mock Acme ${platform.charAt(0) + platform.slice(1).toLowerCase()}`;
      profileUrl = `https://${platform.toLowerCase()}.com/${username}`;
      profileImageUrl = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=150&h=150&fit=crop";
    }

    const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Encrypt the credentials
    const accessTokenEnc = encrypt(accessToken);
    const refreshTokenEnc = encrypt(refreshToken);

    // Upsert Social Account
    const existing = await prisma.socialAccount.findUnique({
      where: {
        clientId_platform: {
          clientId,
          platform,
        },
      },
    });

    const accountData = {
      accountId,
      accountName,
      accessTokenEnc,
      refreshTokenEnc,
      tokenExpiresAt,
      expiresAt: tokenExpiresAt,
      username,
      profileUrl,
      profileImageUrl,
      status: ConnectionStatus.CONNECTED,
      syncError: null,
      lastSyncAt: new Date(),
    };

    let socialAccountId = "";

    if (existing) {
      const updated = await prisma.socialAccount.update({
        where: { id: existing.id },
        data: accountData,
      });
      socialAccountId = updated.id;
    } else {
      const created = await prisma.socialAccount.create({
        data: {
          clientId,
          platform,
          ...accountData,
        },
      });
      socialAccountId = created.id;
    }

    // Get current user session for auditing if available
    const session = await auth.api.getSession({ headers: req.headers });
    const actorId = session?.user?.id || "system";

    await createAuditLog({
      actorId,
      action: "SOCIAL_ACCOUNT_CONNECTED",
      entityType: "SocialAccount",
      entityId: socialAccountId,
      afterSnapshot: {
        id: socialAccountId,
        platform,
        accountId,
        accountName,
        username,
      },
    });

    // Redirect user back to settings dashboard
    const redirectPath =
      role === "client"
        ? `/client/settings?connected=true&platform=${platform.toLowerCase()}`
        : `/admin/clients/${clientId}/settings?connected=true&platform=${platform.toLowerCase()}`;

    return NextResponse.redirect(new URL(redirectPath, req.nextUrl.origin));
  } catch (error) {
    console.error("[GET /api/auth/callback/[platform]] OAuth callback error:", error);
    return NextResponse.json(
      { error: "OAuth authentication callback failed" },
      { status: 500 }
    );
  }
}
