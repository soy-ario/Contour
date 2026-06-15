"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, getRequiredSession, assertClientOwnership } from "@/lib/session";
import { createAuditLog } from "@/lib/services/audit.service";
import { createRequestSchema, createCommentSchema } from "@/lib/validations/request";
import type { ActionResult } from "@/types";
import { Request, RequestComment } from "@prisma/client";

export async function createRequestAction(
  clientId: string,
  prevState: unknown,
  formData: unknown
): Promise<ActionResult<Request>> {
  try {
    await assertClientOwnership(clientId);

    const result = createRequestSchema.safeParse(formData);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const request = await prisma.request.create({
      data: {
        clientId,
        title: result.data.title,
        body: result.data.body ?? null,
      },
    });

    revalidatePath(`/admin/clients/${clientId}/requests`);
    revalidatePath(`/client/requests`);

    return { success: true, data: request };
  } catch (error) {
    console.error("[createRequestAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function resolveRequestAction(
  requestId: string
): Promise<ActionResult<Request>> {
  try {
    const user = await requireAdmin();

    const existing = await prisma.request.findUnique({ where: { id: requestId } });
    if (!existing) {
      return { success: false, error: "Request not found" };
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    await createAuditLog({
      actorId: user.id,
      action: "REQUEST_RESOLVED",
      entityType: "Request",
      entityId: requestId,
    });

    revalidatePath(`/admin/clients/${existing.clientId}/requests`);
    revalidatePath(`/client/requests`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("[resolveRequestAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function reopenRequestAction(
  requestId: string
): Promise<ActionResult<Request>> {
  try {
    const existing = await prisma.request.findUnique({ where: { id: requestId } });
    if (!existing) {
      return { success: false, error: "Request not found" };
    }

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "OPEN",
        resolvedAt: null,
      },
    });

    revalidatePath(`/admin/clients/${existing.clientId}/requests`);
    revalidatePath(`/client/requests`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("[reopenRequestAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function addRequestCommentAction(
  requestId: string,
  prevState: unknown,
  formData: unknown
): Promise<ActionResult<RequestComment>> {
  try {
    const { user } = await getRequiredSession();

    const result = createCommentSchema.safeParse(formData);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) {
      return { success: false, error: "Request not found" };
    }

    // Verify ownership: client must own the request, admin has global access
    if (user.role === "CLIENT") {
      await assertClientOwnership(request.clientId);
    }

    const comment = await prisma.requestComment.create({
      data: {
        requestId,
        authorId: user.id,
        body: result.data.body,
      },
    });

    revalidatePath(`/admin/clients/${request.clientId}/requests`);
    revalidatePath(`/client/requests/${requestId}`);

    return { success: true, data: comment };
  } catch (error) {
    console.error("[addRequestCommentAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}
