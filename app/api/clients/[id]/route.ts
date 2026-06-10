import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClientSchema } from "@/lib/validations/client";
import { createAuditLog } from "@/lib/services/audit.service";
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { z } from "zod";
import { PaymentStatus, Prisma } from "@prisma/client";

const patchClientSchema = updateClientSchema.extend({
  amountPaid: z.coerce.number().min(0).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "PARTIAL"]).optional(),
  logoUrl: z.string().optional().nullable(),
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

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contents: true,
            products: true,
            requests: true,
          },
        },
      },
    });

    if (!client) {
      return notFoundResponse("Client");
    }

    // Calculate budget statistics
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const adSpendGroup = await prisma.content.aggregate({
      where: {
        clientId: client.id,
        publishDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        adSpend: true,
      },
    });

    const budgetUsed = Number(adSpendGroup._sum.adSpend || 0);
    const budgetRemaining = client.monthlyBudget
      ? Math.max(0, Number(client.monthlyBudget) - budgetUsed)
      : null;

    const data = {
      ...client,
      monthlyRetainer: Number(client.monthlyRetainer),
      amountPaid: Number(client.amountPaid),
      monthlyBudget: client.monthlyBudget ? Number(client.monthlyBudget) : null,
      budgetUsed,
      budgetRemaining,
    };

    return successResponse(data);
  } catch (error) {
    console.error("[GET /api/clients/[id]] Error:", error);
    return internalErrorResponse();
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return notFoundResponse("Client");
    }

    const body = await req.json();
    const result = patchClientSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Check contact email uniqueness if it is changing
    if (data.contactEmail && data.contactEmail !== client.contactEmail) {
      const existing = await prisma.client.findFirst({
        where: { contactEmail: data.contactEmail, id: { not: id } },
      });
      if (existing) {
        return conflictResponse("DUPLICATE_EMAIL", "Email already used by another client");
      }
    }

    // Build update payload
    const updateData: Prisma.ClientUpdateInput = {};
    if (data.brandName !== undefined) updateData.brandName = data.brandName;
    if (data.website !== undefined) updateData.website = data.website || null;
    if (data.industry !== undefined) updateData.industry = data.industry || null;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.contactName !== undefined) updateData.contactName = data.contactName;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone || null;
    if (data.monthlyRetainer !== undefined) updateData.monthlyRetainer = data.monthlyRetainer;
    if (data.monthlyBudget !== undefined) updateData.monthlyBudget = data.monthlyBudget || null;
    if (data.marketingTheme !== undefined) updateData.marketingTheme = data.marketingTheme || null;
    if (data.contractStart !== undefined) updateData.contractStart = data.contractStart || null;
    if (data.contractEnd !== undefined) updateData.contractEnd = data.contractEnd || null;
    if (data.amountPaid !== undefined) updateData.amountPaid = data.amountPaid;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus as PaymentStatus;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;

    const updatedClient = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "CLIENT_UPDATED",
      entityType: "Client",
      entityId: id,
      beforeSnapshot: client as unknown as Record<string, unknown>,
      afterSnapshot: updatedClient as unknown as Record<string, unknown>,
    });

    return successResponse({
      ...updatedClient,
      monthlyRetainer: Number(updatedClient.monthlyRetainer),
      amountPaid: Number(updatedClient.amountPaid),
      monthlyBudget: updatedClient.monthlyBudget ? Number(updatedClient.monthlyBudget) : null,
    });
  } catch (error) {
    console.error("[PATCH /api/clients/[id]] Error:", error);
    return internalErrorResponse();
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return notFoundResponse("Client");
    }

    const archivedClient = await prisma.client.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "CLIENT_ARCHIVED",
      entityType: "Client",
      entityId: id,
      beforeSnapshot: client as unknown as Record<string, unknown>,
      afterSnapshot: archivedClient as unknown as Record<string, unknown>,
    });

    return successResponse({
      id: archivedClient.id,
      status: archivedClient.status,
      archivedAt: archivedClient.archivedAt,
    });
  } catch (error) {
    console.error("[DELETE /api/clients/[id]] Error:", error);
    return internalErrorResponse();
  }
}
