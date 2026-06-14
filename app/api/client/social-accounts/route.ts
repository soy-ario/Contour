import { NextResponse } from "next/server";
import { requireClient } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireClient();
    const accounts = await prisma.socialAccount.findMany({
      where: { clientId: user.clientId },
      select: { id: true, platform: true, accountName: true, status: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[GET /api/client/social-accounts]", error);
    return NextResponse.json({ accounts: [] });
  }
}
