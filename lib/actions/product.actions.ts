"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { createAuditLog } from "@/lib/services/audit.service";
import { createProductSchema, updateProductSchema } from "@/lib/validations/product";
import type { ActionResult } from "@/types";
import { Product } from "@prisma/client";

export async function createProductAction(
  prevState: unknown,
  formData: unknown
): Promise<ActionResult<Product>> {
  try {
    const user = await requireAdmin();

    const result = createProductSchema.safeParse(formData);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const product = await prisma.product.create({
      data: result.data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "PRODUCT_CREATED",
      entityType: "Product",
      entityId: product.id,
      afterSnapshot: product as unknown as Record<string, unknown>,
    });

    revalidatePath(`/admin/clients/${product.clientId}/products`);

    return { success: true, data: product };
  } catch (error) {
    console.error("[createProductAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function updateProductAction(
  productId: string,
  data: unknown
): Promise<ActionResult<Product>> {
  try {
    const user = await requireAdmin();

    const result = updateProductSchema.safeParse(data);
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return { success: false, error: "Product not found" };
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: result.data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "PRODUCT_UPDATED",
      entityType: "Product",
      entityId: productId,
      beforeSnapshot: existing as unknown as Record<string, unknown>,
      afterSnapshot: updated as unknown as Record<string, unknown>,
    });

    revalidatePath(`/admin/clients/${existing.clientId}/products`);

    return { success: true, data: updated };
  } catch (error) {
    console.error("[updateProductAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}

export async function deleteProductAction(
  productId: string
): Promise<ActionResult<void>> {
  try {
    const user = await requireAdmin();

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return { success: false, error: "Product not found" };
    }

    await prisma.$transaction(async (tx) => {
      // Delete all content-product join records first
      await tx.contentProduct.deleteMany({ where: { productId } });
      // Then delete the product
      await tx.product.delete({ where: { id: productId } });
    });

    await createAuditLog({
      actorId: user.id,
      action: "PRODUCT_DELETED",
      entityType: "Product",
      entityId: productId,
      beforeSnapshot: existing as unknown as Record<string, unknown>,
    });

    revalidatePath(`/admin/clients/${existing.clientId}/products`);

    return { success: true };
  } catch (error) {
    console.error("[deleteProductAction] Error:", error);
    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
    return { success: false, error: msg };
  }
}
