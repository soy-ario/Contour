import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAllClientAccounts } from "@/lib/services/social-sync.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Extra guard check in case middleware config is changed
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active clients
    const clients = await prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, brandName: true },
    });

    console.log(`[Cron Sync] Starting synchronization for ${clients.length} active clients...`);

    // Sync all accounts in parallel
    const syncResults = await Promise.all(
      clients.map(async (client) => {
        const results = await syncAllClientAccounts(client.id);
        return {
          clientId: client.id,
          brandName: client.brandName,
          accountsSynced: results.length,
          results,
        };
      })
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date(),
      clientsSyncedCount: clients.length,
      details: syncResults,
    });
  } catch (error) {
    console.error("[GET /api/cron/sync] General Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
