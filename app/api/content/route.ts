import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parsePaginationParams, buildPaginatedResult } from "@/lib/pagination";
import {
  successResponse,
  paginatedResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { ContentStatus, Platform, ContentType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const searchParams = req.nextUrl.searchParams;
    const paginationParams = parsePaginationParams(searchParams);
    const { cursor, take } = paginationParams;

    const statusParam = searchParams.get("status");
    const platformParam = searchParams.get("platform");
    const contentTypeParam = searchParams.get("contentType");
    const clientIdParam = searchParams.get("clientId");

    const where: any = {};

    if (statusParam) {
      where.status = statusParam as ContentStatus;
    }
    if (platformParam) {
      where.platform = platformParam as Platform;
    }
    if (contentTypeParam) {
      where.contentType = contentTypeParam as ContentType;
    }
    if (clientIdParam) {
      where.clientId = clientIdParam;
    }

    const totalCount = await prisma.content.count({ where });

    const contents = await prisma.content.findMany({
      where,
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: {
          select: {
            id: true,
            brandName: true,
            logoUrl: true,
          },
        },
        products: {
          include: {
            product: true,
          },
        },
        analytics: true,
      },
    });

    const paginated = buildPaginatedResult(contents, take, cursor, totalCount);

    const data = paginated.data.map((content) => ({
      ...content,
      adSpend: content.adSpend ? Number(content.adSpend) : null,
      products: content.products.map((p) => p.product),
      clientBrandName: content.client.brandName,
    }));

    return paginatedResponse(data, paginated.pagination);
  } catch (error) {
    console.error("[GET /api/content] Error:", error);
    return internalErrorResponse();
  }
}
