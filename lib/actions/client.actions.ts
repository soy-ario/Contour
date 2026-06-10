"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";
import { createAuditLog } from "@/lib/services/audit.service";
import { requireAdmin } from "@/lib/session";
import bcrypt from "bcryptjs";
import { ClientStatus } from "@prisma/client";

export async function createClientAction(formData: any) {
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
      afterSnapshot: client as any,
    });

    revalidatePath("/admin/clients");
    return { success: true, data: { id: client.id } };
  } catch (error: any) {
    console.error("[createClientAction] Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

import { z } from "zod";
import { PaymentStatus } from "@prisma/client";

const actionUpdateClientSchema = updateClientSchema.extend({
  amountPaid: z.coerce.number().min(0).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "PARTIAL"]).optional(),
  logoUrl: z.string().optional().nullable(),
});

export async function updateClientAction(id: string, formData: any) {
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

    const updateData: any = {};
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
      beforeSnapshot: client as any,
      afterSnapshot: updatedClient as any,
    });

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${id}`);
    revalidatePath(`/admin/clients/${id}/overview`);
    revalidatePath(`/admin/clients/${id}/settings`);
    return { success: true, data: { id: updatedClient.id } };
  } catch (error: any) {
    console.error("[updateClientAction] Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function updateClientLogoAction(clientId: string, logoUrl: string) {
  try {
    const user = await requireAdmin();
    const updated = await prisma.client.update({
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
  } catch (error: any) {
    console.error("[updateClientLogoAction] Error:", error);
    return { success: false, error: error.message };
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
  } catch (error: any) {
    console.error("[updateClientStatusAction] Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
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
      },
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
  } catch (error: any) {
    console.error("[createClientUserAction] Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
