"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { createAuditLog } from "@/lib/services/audit.service";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateAdminAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Must be a valid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username must only contain letters, numbers, underscores, or hyphens"),
  currentPassword: z.string().optional().or(z.literal("")),
  newPassword: z.string().optional().or(z.literal("")),
});

export async function updateAdminAccountAction(
  prevState: unknown,
  data: z.infer<typeof updateAdminAccountSchema>
) {
  try {
    const adminSession = await requireAdmin();

    const result = updateAdminAccountSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((i) => i.message).join(", "),
      };
    }

    const { name, email, username, currentPassword, newPassword } = result.data;

    // Fetch the admin user record
    const user = await prisma.user.findUnique({
      where: { id: adminSession.id },
    });

    if (!user) {
      return { success: false, error: "Admin account not found" };
    }

    // Uniqueness checks if changed
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      if (existingEmail) {
        return { success: false, error: "Email address is already in use" };
      }
    }

    if (username.toLowerCase() !== user.username.toLowerCase()) {
      const existingUsername = await prisma.user.findFirst({
        where: { username: { equals: username, mode: "insensitive" } },
      });
      if (existingUsername) {
        return { success: false, error: "Username is already in use" };
      }
    }

    const updateData: Record<string, unknown> = {
      name,
      email,
      username,
    };

    // Password change request
    if (newPassword && newPassword.trim() !== "") {
      if (newPassword.length < 8) {
        return { success: false, error: "New password must be at least 8 characters" };
      }
      if (!currentPassword) {
        return { success: false, error: "Current password is required to set a new password" };
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return { success: false, error: "Incorrect current password" };
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Audit log
    await createAuditLog({
      actorId: adminSession.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: user.id,
      beforeSnapshot: { name: user.name, email: user.email, username: user.username },
      afterSnapshot: { name: updatedUser.name, email: updatedUser.email, username: updatedUser.username },
    });

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("[updateAdminAccountAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}
