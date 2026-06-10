import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { Platform, Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();

    const { id: clientId } = await params;

    // Client role boundary check
    if (session.user.role === "CLIENT" && session.user.clientId !== clientId) {
      return forbiddenResponse();
    }

    const searchParams = req.nextUrl.searchParams;
    const monthParam = searchParams.get("month"); // YYYY-MM
    const platformParam = searchParams.get("platform");

    let year: number;
    let month: number;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const parts = monthParam.split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // 0-indexed month
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    const startOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    const where: Prisma.ContentWhereInput = {
      clientId,
      OR: [
        {
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        {
          publishDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      ],
    };

    if (platformParam) {
      where.platform = platformParam as Platform;
    }

    const contents = await prisma.content.findMany({
      where,
      select: {
        id: true,
        title: true,
        platform: true,
        contentType: true,
        status: true,
        scheduledAt: true,
        publishDate: true,
        adSpend: true,
      },
      orderBy: [
        { scheduledAt: "asc" },
        { publishDate: "asc" },
      ],
    });

    const data = contents.map((item) => ({
      ...item,
      adSpend: item.adSpend ? Number(item.adSpend) : null,
    }));

    return successResponse(data);
  } catch (error) {
    console.error("[GET /api/clients/[id]/content/calendar] Error:", error);
    return internalErrorResponse();
  }
}
