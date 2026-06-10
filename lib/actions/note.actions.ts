"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { createAuditLog } from "@/lib/services/audit.service";

export async function createNoteAction(clientId: string, content: string) {
  try {
    const user = await requireAdmin();

    if (!content || content.trim() === "") {
      return { success: false, error: "Note content cannot be empty." };
    }

    const note = await prisma.internalNote.create({
      data: {
        clientId,
        content,
        createdBy: user.id,
      },
    });

    await createAuditLog({
      actorId: user.id,
      action: "NOTE_CREATED",
      entityType: "InternalNote",
      entityId: note.id,
      afterSnapshot: { clientId, content },
    });

    revalidatePath(`/admin/clients/${clientId}/overview`);
    return { success: true, data: note };
  } catch (error) {
    console.error("[createNoteAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}

export async function updateNoteAction(id: string, content: string) {
  try {
    const user = await requireAdmin();

    if (!content || content.trim() === "") {
      return { success: false, error: "Note content cannot be empty." };
    }

    const existing = await prisma.internalNote.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: "Note not found." };
    }

    const note = await prisma.internalNote.update({
      where: { id },
      data: { content },
    });

    await createAuditLog({
      actorId: user.id,
      action: "NOTE_UPDATED",
      entityType: "InternalNote",
      entityId: id,
      beforeSnapshot: { content: existing.content },
      afterSnapshot: { content: note.content },
    });

    revalidatePath(`/admin/clients/${existing.clientId}/overview`);
    return { success: true, data: note };
  } catch (error) {
    console.error("[updateNoteAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}

export async function deleteNoteAction(id: string) {
  try {
    const user = await requireAdmin();

    const existing = await prisma.internalNote.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: "Note not found." };
    }

    await prisma.internalNote.delete({
      where: { id },
    });

    await createAuditLog({
      actorId: user.id,
      action: "NOTE_DELETED",
      entityType: "InternalNote",
      entityId: id,
      beforeSnapshot: { content: existing.content },
    });

    revalidatePath(`/admin/clients/${existing.clientId}/overview`);
    return { success: true };
  } catch (error) {
    console.error("[deleteNoteAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}
