"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getRequiredSession } from "@/lib/session";
import { createAuditLog } from "@/lib/services/audit.service";
import {
  sendContentApprovedEmail,
  sendContentRejectedEmail,
  sendChangesRequestedEmail,
} from "@/lib/services/email.service";
import type { ActionResult } from "@/types";
import { ContentStatus, ApprovalAction, Content, ApprovalEvent } from "@prisma/client";

/**
 * Common helper to authenticate, verify client ownership, and fetch content details.
 */
async function validateAccessAndGetContent(contentId: string) {
  const { user } = await getRequiredSession();
  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    throw new Error("Content not found");
  }

  // Cross-client isolation check
  if (user.role === "CLIENT" && user.clientId !== content.clientId) {
    throw new Error("Forbidden — cross-client access denied");
  }

  return { content, user };
}

/**
 * Helper to fetch all Admin emails to notify them of workflow updates.
 */
async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  return admins.map((a) => a.email).filter(Boolean);
}

export async function approveContentAction(
  contentId: string,
  comment?: string
): Promise<ActionResult<Content>> {
  try {
    const { content, user } = await validateAccessAndGetContent(contentId);

    if (content.status !== ContentStatus.CLIENT_APPROVAL_PENDING) {
      return {
        success: false,
        error: "Content is not pending client approval",
      };
    }

    const updatedContent = await prisma.$transaction(async (tx) => {
      const updated = await tx.content.update({
        where: { id: contentId },
        data: {
          status: ContentStatus.APPROVED,
        },
      });

      await tx.statusLog.create({
        data: {
          contentId,
          fromStatus: ContentStatus.CLIENT_APPROVAL_PENDING,
          toStatus: ContentStatus.APPROVED,
          changedBy: user.id,
          note: comment || "Approved by client",
        },
      });

      await tx.approvalEvent.create({
        data: {
          contentId,
          action: ApprovalAction.APPROVED,
          actorId: user.id,
          comment: comment || null,
        },
      });

      return updated;
    });

    await createAuditLog({
      actorId: user.id,
      action: "CONTENT_APPROVED",
      entityType: "Content",
      entityId: contentId,
      beforeSnapshot: content as unknown as Record<string, unknown>,
      afterSnapshot: updatedContent as unknown as Record<string, unknown>,
    });

    // Notify admins
    const adminEmails = await getAdminEmails();
    for (const email of adminEmails) {
      await sendContentApprovedEmail(email, content.title);
    }

    revalidatePath("/content");
    revalidatePath(`/clients/${content.clientId}/content`);

    return { success: true, data: updatedContent };
  } catch (error) {
    console.error("[approveContentAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function rejectContentAction(
  contentId: string,
  comment: string
): Promise<ActionResult<Content>> {
  try {
    if (!comment || comment.trim() === "") {
      return { success: false, error: "A reason comment is required for rejection" };
    }

    const { content, user } = await validateAccessAndGetContent(contentId);

    if (content.status !== ContentStatus.CLIENT_APPROVAL_PENDING) {
      return {
        success: false,
        error: "Content is not pending client approval",
      };
    }

    const updatedContent = await prisma.$transaction(async (tx) => {
      const updated = await tx.content.update({
        where: { id: contentId },
        data: {
          status: ContentStatus.REJECTED,
        },
      });

      await tx.statusLog.create({
        data: {
          contentId,
          fromStatus: ContentStatus.CLIENT_APPROVAL_PENDING,
          toStatus: ContentStatus.REJECTED,
          changedBy: user.id,
          note: comment,
        },
      });

      await tx.approvalEvent.create({
        data: {
          contentId,
          action: ApprovalAction.REJECTED,
          actorId: user.id,
          comment,
        },
      });

      return updated;
    });

    await createAuditLog({
      actorId: user.id,
      action: "CONTENT_REJECTED",
      entityType: "Content",
      entityId: contentId,
      beforeSnapshot: content as unknown as Record<string, unknown>,
      afterSnapshot: updatedContent as unknown as Record<string, unknown>,
    });

    // Notify admins
    const adminEmails = await getAdminEmails();
    for (const email of adminEmails) {
      await sendContentRejectedEmail(email, content.title, comment);
    }

    revalidatePath("/content");
    revalidatePath(`/clients/${content.clientId}/content`);

    return { success: true, data: updatedContent };
  } catch (error) {
    console.error("[rejectContentAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function requestChangesAction(
  contentId: string,
  comment: string
): Promise<ActionResult<Content>> {
  try {
    if (!comment || comment.trim() === "") {
      return { success: false, error: "Feedback comment is required for change requests" };
    }

    const { content, user } = await validateAccessAndGetContent(contentId);

    if (content.status !== ContentStatus.CLIENT_APPROVAL_PENDING) {
      return {
        success: false,
        error: "Content must be pending client approval to request changes",
      };
    }

    const updatedContent = await prisma.$transaction(async (tx) => {
      const updated = await tx.content.update({
        where: { id: contentId },
        data: {
          status: ContentStatus.CLIENT_APPROVAL_PENDING,
        },
      });

      await tx.statusLog.create({
        data: {
          contentId,
          fromStatus: ContentStatus.CLIENT_APPROVAL_PENDING,
          toStatus: ContentStatus.CLIENT_APPROVAL_PENDING,
          changedBy: user.id,
          note: `Changes requested: ${comment}`,
        },
      });

      await tx.approvalEvent.create({
        data: {
          contentId,
          action: ApprovalAction.CHANGES_REQUESTED,
          actorId: user.id,
          comment,
        },
      });

      return updated;
    });

    await createAuditLog({
      actorId: user.id,
      action: "CONTENT_CHANGES_REQUESTED",
      entityType: "Content",
      entityId: contentId,
      beforeSnapshot: content as unknown as Record<string, unknown>,
      afterSnapshot: updatedContent as unknown as Record<string, unknown>,
    });

    // Notify admins
    const adminEmails = await getAdminEmails();
    for (const email of adminEmails) {
      await sendChangesRequestedEmail(email, content.title, comment);
    }

    revalidatePath("/content");
    revalidatePath(`/clients/${content.clientId}/content`);

    return { success: true, data: updatedContent };
  } catch (error) {
    console.error("[requestChangesAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function addCommentAction(
  contentId: string,
  comment: string
): Promise<ActionResult<ApprovalEvent>> {
  try {
    if (!comment || comment.trim() === "") {
      return { success: false, error: "Comment body cannot be empty" };
    }

    const { content, user } = await validateAccessAndGetContent(contentId);

    const event = await prisma.approvalEvent.create({
      data: {
        contentId,
        action: ApprovalAction.COMMENTED,
        actorId: user.id,
        comment,
      },
    });

    revalidatePath("/content");
    revalidatePath(`/clients/${content.clientId}/content`);

    return { success: true, data: event };
  } catch (error) {
    console.error("[addCommentAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}
