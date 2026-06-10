import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateClientStatusSchema } from "@/lib/validations/client";
import { createAuditLog } from "@/lib/services/audit.service";
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { ClientStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

function isValidTransition(from: ClientStatus, to: ClientStatus): boolean {
  if (to === "ARCHIVED") return true;
  if (from === "ACTIVE" && to === "PAUSED") return true;
  if (from === "PAUSED" && to === "ACTIVE") return true;

  const sequence: ClientStatus[] = [
    "LEAD",
    "DISCOVERY",
    "PROPOSAL_SENT",
    "CONTRACT_SIGNED",
    "SETUP",
    "DASHBOARD_READY",
    "ACTIVE",
  ];

  const fromIndex = sequence.indexOf(from);
  const toIndex = sequence.indexOf(to);

  if (fromIndex !== -1 && toIndex !== -1) {
    return toIndex === fromIndex + 1;
  }

  return false;
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
    const result = updateClientStatusSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const newStatus = result.data.status;

    if (!isValidTransition(client.status, newStatus)) {
      return errorResponse(
        "INVALID_STATUS_TRANSITION",
        `Transition from ${client.status} to ${newStatus} is not allowed`,
        undefined,
        422
      );
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        status: newStatus,
        // If transitioning to ARCHIVED, we also set archivedAt
        archivedAt: newStatus === "ARCHIVED" ? new Date() : undefined,
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "CLIENT_STATUS_UPDATED",
      entityType: "Client",
      entityId: id,
      beforeSnapshot: { status: client.status },
      afterSnapshot: { status: updatedClient.status },
    });

    return successResponse({
      id: updatedClient.id,
      status: updatedClient.status,
      updatedAt: updatedClient.updatedAt,
    });
  } catch (error) {
    console.error("[PATCH /api/clients/[id]/status] Error:", error);
    return internalErrorResponse();
  }
}
