import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateContentSchema } from "@/lib/validations/content";
import { createAuditLog } from "@/lib/services/audit.service";
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { ContentStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    id: string;
    ctId: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();

    const { id: clientId, ctId } = await params;

    const content = await prisma.content.findUnique({
      where: { id: ctId },
      include: {
        client: {
          select: {
            id: true,
            brandName: true,
            logoUrl: true,
          },
        },
        analytics: true,
        products: {
          include: {
            product: true,
          },
        },
        approvalEvents: {
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        statusLogs: {
          include: {
            changer: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!content || content.clientId !== clientId) {
      return notFoundResponse("Content");
    }

    if (session.user.role === "CLIENT" && session.user.clientId !== content.clientId) {
      return forbiddenResponse();
    }

    const data = {
      ...content,
      adSpend: content.adSpend ? Number(content.adSpend) : null,
      products: content.products.map((p) => p.product),
    };

    return successResponse(data);
  } catch (error) {
    console.error("[GET /api/clients/[id]/content/[ctId]] Error:", error);
    return internalErrorResponse();
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const { id: clientId, ctId } = await params;

    const content = await prisma.content.findUnique({
      where: { id: ctId },
    });

    if (!content || content.clientId !== clientId) {
      return notFoundResponse("Content");
    }

    const allowedStatuses: ContentStatus[] = [
      ContentStatus.IDEA,
      ContentStatus.DRAFT,
      ContentStatus.CLIENT_APPROVAL_PENDING,
    ];
    if (!allowedStatuses.includes(content.status)) {
      return errorResponse("BAD_REQUEST", `Cannot update content in status ${content.status}`);
    }

    const body = await req.json();
    const result = updateContentSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { productIds, ...contentData } = result.data;

    const updatedContent = await prisma.$transaction(async (tx) => {
      if (productIds !== undefined) {
        await tx.contentProduct.deleteMany({
          where: { contentId: ctId },
        });
        if (productIds.length > 0) {
          await tx.contentProduct.createMany({
            data: productIds.map((pId) => ({
              contentId: ctId,
              productId: pId,
            })),
          });
        }
      }

      return await tx.content.update({
        where: { id: ctId },
        data: contentData,
      });
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "CONTENT_UPDATED",
      entityType: "Content",
      entityId: ctId,
      beforeSnapshot: content as unknown as Record<string, unknown>,
      afterSnapshot: updatedContent as unknown as Record<string, unknown>,
    });

    return successResponse({
      ...updatedContent,
      adSpend: updatedContent.adSpend ? Number(updatedContent.adSpend) : null,
    });
  } catch (error) {
    console.error("[PATCH /api/clients/[id]/content/[ctId]] Error:", error);
    return internalErrorResponse();
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const { id: clientId, ctId } = await params;

    const content = await prisma.content.findUnique({
      where: { id: ctId },
    });

    if (!content || content.clientId !== clientId) {
      return notFoundResponse("Content");
    }

    const allowedStatuses: ContentStatus[] = [ContentStatus.IDEA, ContentStatus.DRAFT];
    if (!allowedStatuses.includes(content.status)) {
      return errorResponse("BAD_REQUEST", `Cannot delete content in status ${content.status}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.content.delete({
        where: { id: ctId },
      });
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "CONTENT_DELETED",
      entityType: "Content",
      entityId: ctId,
      beforeSnapshot: content as unknown as Record<string, unknown>,
    });

    return successResponse({ id: ctId });
  } catch (error) {
    console.error("[DELETE /api/clients/[id]/content/[ctId]] Error:", error);
    return internalErrorResponse();
  }
}
