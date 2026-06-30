import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Platform } from "@prisma/client";
import { getOAuthConnectUrl } from "@/lib/services/platforms";
import { unauthorizedResponse, internalErrorResponse } from "@/lib/api-helpers";

interface RouteParams {
  params: Promise<{ platform: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();

    const { platform: rawPlatform } = await params;
    const platform = rawPlatform.toUpperCase() as Platform;

    if (!Object.values(Platform).includes(platform)) {
      return NextResponse.json({ error: `Invalid platform: ${rawPlatform}` }, { status: 400 });
    }

    const clientId = req.nextUrl.searchParams.get("clientId") || "";
    const role = req.nextUrl.searchParams.get("role") || "admin";

    const state = JSON.stringify({ clientId, role });
    const redirectUri = `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth/callback/${rawPlatform.toLowerCase()}`;

    const url = getOAuthConnectUrl(platform, redirectUri);
    const finalUrl = `${url}&state=${encodeURIComponent(state)}`;

    return NextResponse.json({ url: finalUrl });
  } catch (error) {
    console.error("[GET /api/auth/connect/[platform]]", error);
    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    return internalErrorResponse();
  }
}
