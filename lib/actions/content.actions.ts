"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { createAuditLog } from "@/lib/services/audit.service";
import {
  createContentSchema,
  updateContentSchema,
} from "@/lib/validations/content";
import { sendContentSubmittedEmail } from "@/lib/services/email.service";
import type { ActionResult } from "@/types";
import { ContentStatus, Content } from "@prisma/client";

export async function createContentAction(
  prevState: unknown,
  formData: unknown
): Promise<ActionResult<Content>> {
  try {
    const user = await requireAdmin();

    const result = createContentSchema.safeParse(formData);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const { productIds, ...contentData } = result.data;

    if (productIds && productIds.length > 0) {
      const ownedProductCount = await prisma.product.count({
        where: {
          id: { in: productIds },
          clientId: contentData.clientId,
        },
      });

      if (ownedProductCount !== productIds.length) {
        return {
          success: false,
          error: "One or more products do not exist or belong to a different client",
        };
      }
    }

    const newContent = await prisma.$transaction(async (tx) => {
      // 1. Create content record
      const content = await tx.content.create({
        data: {
          ...contentData,
          status: ContentStatus.IDEA,
          createdBy: user.id,
        },
      });

      // 2. Link products if any
      if (productIds && productIds.length > 0) {
        await tx.contentProduct.createMany({
          data: productIds.map((pId) => ({
            contentId: content.id,
            productId: pId,
          })),
        });
      }

      // 3. Write status log
      await tx.statusLog.create({
        data: {
          contentId: content.id,
          toStatus: ContentStatus.IDEA,
          changedBy: user.id,
          note: "Content created (Idea phase)",
        },
      });

      return content;
    });

    // 4. Create audit log
    await createAuditLog({
      actorId: user.id,
      action: "CONTENT_CREATED",
      entityType: "Content",
      entityId: newContent.id,
      afterSnapshot: newContent as unknown as Record<string, unknown>,
    });

    // Revalidate relevant pages
    revalidatePath("/content");
    revalidatePath(`/clients/${contentData.clientId}/content`);

    return { success: true, data: newContent };
  } catch (error) {
    console.error("[createContentAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function updateContentAction(
  contentId: string,
  data: unknown
): Promise<ActionResult<Content>> {
  try {
    const user = await requireAdmin();

    const result = updateContentSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      return { success: false, error: "Content not found" };
    }

    // Only allow edit in IDEA, DRAFT, or CLIENT_APPROVAL_PENDING (changes requested)
    const allowedStatuses: ContentStatus[] = [
      ContentStatus.IDEA,
      ContentStatus.DRAFT,
      ContentStatus.CLIENT_APPROVAL_PENDING,
    ];
    if (!allowedStatuses.includes(content.status)) {
      return {
        success: false,
        error: `Cannot edit content in ${content.status} status`,
      };
    }

    const { productIds, ...contentData } = result.data;

    if (productIds && productIds.length > 0) {
      const ownedProductCount = await prisma.product.count({
        where: {
          id: { in: productIds },
          clientId: content.clientId,
        },
      });

      if (ownedProductCount !== productIds.length) {
        return {
          success: false,
          error: "One or more products do not exist or belong to a different client",
        };
      }
    }

    const updatedContent = await prisma.$transaction(async (tx) => {
      // Update client product mapping if productIds is provided
      if (productIds !== undefined) {
        await tx.contentProduct.deleteMany({
          where: { contentId },
        });
        if (productIds.length > 0) {
          await tx.contentProduct.createMany({
            data: productIds.map((pId) => ({
              contentId,
              productId: pId,
            })),
          });
        }
      }

      return await tx.content.update({
        where: { id: contentId },
        data: contentData,
      });
    });

    await createAuditLog({
      actorId: user.id,
      action: "CONTENT_UPDATED",
      entityType: "Content",
      entityId: contentId,
      beforeSnapshot: content as unknown as Record<string, unknown>,
      afterSnapshot: updatedContent as unknown as Record<string, unknown>,
    });

    revalidatePath("/content");
    revalidatePath(`/clients/${content.clientId}/content`);

    return { success: true, data: updatedContent };
  } catch (error) {
    console.error("[updateContentAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function deleteContentAction(
  contentId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAdmin();

    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      return { success: false, error: "Content not found" };
    }

    // Only allow delete in IDEA or DRAFT
    const allowedStatuses: ContentStatus[] = [ContentStatus.IDEA, ContentStatus.DRAFT];
    if (!allowedStatuses.includes(content.status)) {
      return {
        success: false,
        error: `Cannot delete content in ${content.status} status`,
      };
    }

    await prisma.$transaction(async (tx) => {
      // Relationships with cascade will automatically clean up
      await tx.content.delete({
        where: { id: contentId },
      });
    });

    await createAuditLog({
      actorId: user.id,
      action: "CONTENT_DELETED",
      entityType: "Content",
      entityId: contentId,
      beforeSnapshot: content as unknown as Record<string, unknown>,
    });

    revalidatePath("/content");
    revalidatePath(`/clients/${content.clientId}/content`);

    return { success: true };
  } catch (error) {
    console.error("[deleteContentAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function submitContentAction(
  contentId: string
): Promise<ActionResult<Content>> {
  try {
    const user = await requireAdmin();

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        client: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!content) {
      return { success: false, error: "Content not found" };
    }

    if (content.status !== ContentStatus.DRAFT) {
      return {
        success: false,
        error: "Only draft content can be submitted for approval",
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
          fromStatus: ContentStatus.DRAFT,
          toStatus: ContentStatus.CLIENT_APPROVAL_PENDING,
          changedBy: user.id,
          note: "Submitted for client approval",
        },
      });

      await tx.approvalEvent.create({
        data: {
          contentId,
          action: "SUBMITTED",
          actorId: user.id,
          comment: "Content submitted for approval",
        },
      });

      return updated;
    });

    await createAuditLog({
      actorId: user.id,
      action: "CONTENT_SUBMITTED",
      entityType: "Content",
      entityId: contentId,
      beforeSnapshot: content as unknown as Record<string, unknown>,
      afterSnapshot: updatedContent as unknown as Record<string, unknown>,
    });

    // Send email notification to client
    const clientEmail = content.client.user?.email || content.client.contactEmail;
    if (clientEmail) {
      await sendContentSubmittedEmail(clientEmail, content.title, content.clientId);
    }

    revalidatePath("/content");
    revalidatePath(`/clients/${content.clientId}/content`);

    return { success: true, data: updatedContent };
  } catch (error) {
    console.error("[submitContentAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function scheduleContentAction(
  contentId: string,
  scheduledDate: string | Date
): Promise<ActionResult<Content>> {
  try {
    const user = await requireAdmin();

    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      return { success: false, error: "Content not found" };
    }

    if (content.status !== ContentStatus.APPROVED) {
      return {
        success: false,
        error: "Only approved content can be scheduled",
      };
    }

    const scheduledDateObj = new Date(scheduledDate);

    const updatedContent = await prisma.$transaction(async (tx) => {
      const updated = await tx.content.update({
        where: { id: contentId },
        data: {
          status: ContentStatus.SCHEDULED,
          scheduledAt: scheduledDateObj,
          publishDate: scheduledDateObj,
        },
      });

      await tx.statusLog.create({
        data: {
          contentId,
          fromStatus: ContentStatus.APPROVED,
          toStatus: ContentStatus.SCHEDULED,
          changedBy: user.id,
          note: `Scheduled for ${scheduledDateObj.toLocaleDateString()}`,
        },
      });

      return updated;
    });

    await createAuditLog({
      actorId: user.id,
      action: "CONTENT_SCHEDULED",
      entityType: "Content",
      entityId: contentId,
      beforeSnapshot: content as unknown as Record<string, unknown>,
      afterSnapshot: updatedContent as unknown as Record<string, unknown>,
    });

    revalidatePath("/content");
    revalidatePath(`/clients/${content.clientId}/content`);

    return { success: true, data: updatedContent };
  } catch (error) {
    console.error("[scheduleContentAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}
