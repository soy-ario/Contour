import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";

interface AuditLogInput {
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      null;
    const userAgent = headersList.get("user-agent") ?? null;
    const requestId = headersList.get("x-request-id") ?? null;

    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        beforeSnapshot: input.beforeSnapshot ? (input.beforeSnapshot as Prisma.InputJsonValue) : undefined,
        afterSnapshot: input.afterSnapshot ? (input.afterSnapshot as Prisma.InputJsonValue) : undefined,
        ipAddress,
        userAgent,
        requestId,
      },
    });
  } catch (error) {
    // Audit logging should never fail the primary operation
    console.error("[AuditLog] Failed to create audit log:", error);
  }
}
