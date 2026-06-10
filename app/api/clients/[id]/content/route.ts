import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createContentSchema } from "@/lib/validations/content";
import { createAuditLog } from "@/lib/services/audit.service";
import { parsePaginationParams, buildPaginatedResult } from "@/lib/pagination";
import {
  successResponse,
  paginatedResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { ContentStatus, Platform, ContentType } from "@prisma/client";

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

    // CLIENT role must match the requested clientId
    if (session.user.role === "CLIENT" && session.user.clientId !== clientId) {
      return forbiddenResponse();
    }

    const searchParams = req.nextUrl.searchParams;
    const paginationParams = parsePaginationParams(searchParams);
    const { cursor, take } = paginationParams;

    const statusParam = searchParams.get("status");
    const platformParam = searchParams.get("platform");
    const contentTypeParam = searchParams.get("contentType");

    const where: any = { clientId };

    if (statusParam) {
      where.status = statusParam as ContentStatus;
    }
    if (platformParam) {
      where.platform = platformParam as Platform;
    }
    if (contentTypeParam) {
      where.contentType = contentTypeParam as ContentType;
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
    }));

    return paginatedResponse(data, paginated.pagination);
  } catch (error) {
    console.error("[GET /api/clients/[id]/content] Error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const { id: clientId } = await params;

    const body = await req.json();
    
    // Ensure body has the correct clientId matching the URL route
    const bodyWithClientId = { ...body, clientId };
    
    const result = createContentSchema.safeParse(bodyWithClientId);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { productIds, ...contentData } = result.data;

    // Check if client exists
    const clientExists = await prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!clientExists) {
      return notFoundResponse("Client");
    }

    const content = await prisma.$transaction(async (tx) => {
      // 1. Create content record
      const createdContent = await tx.content.create({
        data: {
          ...contentData,
          status: ContentStatus.IDEA,
          createdBy: session.user.id,
        },
      });

      // 2. Link products if provided
      if (productIds && productIds.length > 0) {
        await tx.contentProduct.createMany({
          data: productIds.map((pId) => ({
            contentId: createdContent.id,
            productId: pId,
          })),
        });
      }

      // 3. Write status log
      await tx.statusLog.create({
        data: {
          contentId: createdContent.id,
          toStatus: ContentStatus.IDEA,
          changedBy: session.user.id,
          note: "Content created via API",
        },
      });

      return createdContent;
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "CONTENT_CREATED",
      entityType: "Content",
      entityId: content.id,
      afterSnapshot: content as any,
    });

    return successResponse(
      {
        ...content,
        adSpend: content.adSpend ? Number(content.adSpend) : null,
      },
      201
    );
  } catch (error) {
    console.error("[POST /api/clients/[id]/content] Error:", error);
    return internalErrorResponse();
  }
}
