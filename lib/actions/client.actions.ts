"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";
import { createAuditLog } from "@/lib/services/audit.service";
import { requireAdmin } from "@/lib/session";
import bcrypt from "bcryptjs";
import { ClientStatus, Prisma } from "@prisma/client";

export async function createClientAction(formData: unknown) {
  try {
    const user = await requireAdmin();
    const result = createClientSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: "Validation failed: " + result.error.message };
    }

    const data = result.data;

    // Check email uniqueness
    const existing = await prisma.client.findFirst({
      where: { contactEmail: data.contactEmail },
    });
    if (existing) {
      return { success: false, error: "Email already in use by another client." };
    }

    const client = await prisma.client.create({
      data: {
        brandName: data.brandName,
        website: data.website || null,
        industry: data.industry || null,
        description: data.description || null,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        monthlyRetainer: data.monthlyRetainer,
        monthlyBudget: data.monthlyBudget || null,
        marketingTheme: data.marketingTheme || null,
        contractStart: data.contractStart || null,
        contractEnd: data.contractEnd || null,
        status: "LEAD",
      },
    });

    await createAuditLog({
      actorId: user.id,
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: client.id,
      afterSnapshot: client as unknown as Record<string, unknown>,
    });

    revalidatePath("/admin/clients");
    return { success: true, data: { id: client.id } };
  } catch (error) {
    console.error("[createClientAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}

import { z } from "zod";
import { PaymentStatus } from "@prisma/client";

const actionUpdateClientSchema = updateClientSchema.extend({
  amountPaid: z.coerce.number().min(0).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "PARTIAL"]).optional(),
  logoUrl: z.string().optional().nullable(),
});

export async function updateClientAction(id: string, formData: unknown) {
  try {
    const user = await requireAdmin();
    const result = actionUpdateClientSchema.safeParse(formData);
    if (!result.success) {
      return { success: false, error: "Validation failed: " + result.error.message };
    }

    const data = result.data;

    const client = await prisma.client.findUnique({
      where: { id },
    });
    if (!client) {
      return { success: false, error: "Client not found." };
    }

    // Check contact email uniqueness
    if (data.contactEmail && data.contactEmail !== client.contactEmail) {
      const existing = await prisma.client.findFirst({
        where: { contactEmail: data.contactEmail, id: { not: id } },
      });
      if (existing) {
        return { success: false, error: "Email already in use by another client." };
      }
    }

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
      actorId: user.id,
      action: "CLIENT_UPDATED",
      entityType: "Client",
      entityId: id,
      beforeSnapshot: client as unknown as Record<string, unknown>,
      afterSnapshot: updatedClient as unknown as Record<string, unknown>,
    });

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${id}`);
    revalidatePath(`/admin/clients/${id}/overview`);
    revalidatePath(`/admin/clients/${id}/settings`);
    return { success: true, data: { id: updatedClient.id } };
  } catch (error) {
    console.error("[updateClientAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}

export async function updateClientLogoAction(clientId: string, logoUrl: string) {
  try {
    const user = await requireAdmin();
    await prisma.client.update({
      where: { id: clientId },
      data: { logoUrl },
    });
    
    await createAuditLog({
      actorId: user.id,
      action: "CLIENT_LOGO_UPDATED",
      entityType: "Client",
      entityId: clientId,
      afterSnapshot: { logoUrl },
    });

    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath(`/admin/clients/${clientId}/overview`);
    revalidatePath(`/admin/clients/${clientId}/settings`);
    return { success: true, url: logoUrl };
  } catch (error) {
    console.error("[updateClientLogoAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}

export async function updateClientStatusAction(id: string, status: ClientStatus) {
  try {
    const user = await requireAdmin();

    const client = await prisma.client.findUnique({
      where: { id },
    });
    if (!client) {
      return { success: false, error: "Client not found." };
    }

    // Validate transition
    const sequence: ClientStatus[] = [
      "LEAD",
      "DISCOVERY",
      "PROPOSAL_SENT",
      "CONTRACT_SIGNED",
      "SETUP",
      "DASHBOARD_READY",
      "ACTIVE",
    ];

    let isValid = status === "ARCHIVED";
    if (!isValid && client.status === "ACTIVE" && status === "PAUSED") isValid = true;
    if (!isValid && client.status === "PAUSED" && status === "ACTIVE") isValid = true;

    if (!isValid) {
      const fromIndex = sequence.indexOf(client.status);
      const toIndex = sequence.indexOf(status);
      if (fromIndex !== -1 && toIndex !== -1 && toIndex === fromIndex + 1) {
        isValid = true;
      }
    }

    if (!isValid) {
      return {
        success: false,
        error: `Invalid status transition from ${client.status} to ${status}`,
      };
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        status,
        archivedAt: status === "ARCHIVED" ? new Date() : undefined,
      },
    });

    await createAuditLog({
      actorId: user.id,
      action: "CLIENT_STATUS_UPDATED",
      entityType: "Client",
      entityId: id,
      beforeSnapshot: { status: client.status },
      afterSnapshot: { status: updatedClient.status },
    });

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${id}`);
    revalidatePath(`/admin/clients/${id}/overview`);
    return { success: true, data: { id: updatedClient.id, status: updatedClient.status } };
  } catch (error) {
    console.error("[updateClientStatusAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}

export async function createClientUserAction(clientId: string, username: string, password: string) {
  try {
    const user = await requireAdmin();

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      return { success: false, error: "Client not found." };
    }

    // Check if client already has a user
    const existingClientUser = await prisma.user.findFirst({
      where: { clientId },
    });
    if (existingClientUser) {
      return { success: false, error: "This client already has an associated user login." };
    }

    // Check if username is already taken
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return { success: false, error: "Username is already taken." };
    }

    // Check if email is already taken
    const existingEmail = await prisma.user.findUnique({
      where: { email: client.contactEmail },
    });
    if (existingEmail) {
      return { success: false, error: "Email is already registered to another user." };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const clientUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "CLIENT",
        clientId,
        name: client.contactName,
        email: client.contactEmail,
        emailVerified: true,
        accounts: {
          create: {
            accountId: client.contactEmail,
            providerId: "credential",
            password: passwordHash,
          },
        },
      },
    });

    await prisma.client.update({
      where: { id: clientId },
      data: { portalPassword: password },
    });

    await createAuditLog({
      actorId: user.id,
      action: "CLIENT_USER_CREATED",
      entityType: "User",
      entityId: clientUser.id,
      afterSnapshot: {
        id: clientUser.id,
        username: clientUser.username,
        email: clientUser.email,
        clientId,
      },
    });

    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath(`/admin/clients/${clientId}/overview`);
    return { success: true, data: { id: clientUser.id, username: clientUser.username } };
  } catch (error) {
    console.error("[createClientUserAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { success: false, error: msg };
  }
}

export async function resetClientPasswordAction(clientId: string) {
  try {
    const user = await requireAdmin();

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return { success: false, error: "Client not found." };

    const clientUser = await prisma.user.findFirst({ where: { clientId } });
    if (!clientUser) return { success: false, error: "No portal user exists for this client." };

    const newPassword = `Contour#${String(Date.now()).slice(-6)}!X8`;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: clientUser.id },
        data: { passwordHash },
      }),
      prisma.account.updateMany({
        where: { userId: clientUser.id, providerId: "credential" },
        data: { password: passwordHash },
      }),
      prisma.client.update({
        where: { id: clientId },
        data: { portalPassword: newPassword },
      }),
    ]);

    await createAuditLog({
      actorId: user.id,
      action: "CLIENT_USER_PASSWORD_RESET",
      entityType: "User",
      entityId: clientUser.id,
      afterSnapshot: { username: clientUser.username, clientId },
    });

    return { success: true, password: newPassword, username: clientUser.username };
  } catch (error) {
    console.error("[resetClientPasswordAction] Error:", error);
    return { success: false, error: "Failed to reset password." };
  }
}

export async function deleteClientAction(clientId: string) {
  try {
    const admin = await requireAdmin();

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return { success: false, error: "Client not found." };

    await prisma.client.delete({ where: { id: clientId } });

    await createAuditLog({
      actorId: admin.id,
      action: "CLIENT_DELETED",
      entityType: "Client",
      entityId: clientId,
      beforeSnapshot: { brandName: client.brandName },
    });

    return { success: true };
  } catch (error) {
    console.error("[deleteClientAction] Error:", error);
    return { success: false, error: "Failed to delete client." };
  }
}
