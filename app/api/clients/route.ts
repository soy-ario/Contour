import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClientSchema } from "@/lib/validations/client";
import { createAuditLog } from "@/lib/services/audit.service";
import { parsePaginationParams, buildPaginatedResult } from "@/lib/pagination";
import {
  successResponse,
  paginatedResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse,
  internalErrorResponse,
} from "@/lib/api-helpers";
import { ClientStatus, PaymentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const searchParams = req.nextUrl.searchParams;
    const paginationParams = parsePaginationParams(searchParams);
    const { cursor, take } = paginationParams;

    const statusParam = searchParams.get("status");
    const paymentStatusParam = searchParams.get("paymentStatus");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: any = {};

    if (statusParam) {
      where.status = statusParam as ClientStatus;
    } else {
      // By default, exclude archived clients in general listings unless specifically filtered
      where.status = { not: "ARCHIVED" as ClientStatus };
    }

    if (paymentStatusParam) {
      where.paymentStatus = paymentStatusParam as PaymentStatus;
    }

    if (search) {
      where.OR = [
        { brandName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const validSortFields = ["brandName", "createdAt", "healthScore", "monthlyRetainer"];
    const sortByField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    // Count total matching records
    const totalCount = await prisma.client.count({ where });

    // Fetch + 1 for next cursor detection
    const clients = await prisma.client.findMany({
      where,
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: {
        [sortByField]: sortOrder === "asc" ? "asc" : "desc",
      },
    });

    const paginated = buildPaginatedResult(clients, take, cursor, totalCount);

    // Compute budget statistics for the page of clients
    const clientIds = paginated.data.map((c) => c.id);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const adSpendGroup = await prisma.content.groupBy({
      by: ["clientId"],
      where: {
        clientId: { in: clientIds },
        publishDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        adSpend: true,
      },
    });

    const spendMap = new Map<string, number>();
    for (const group of adSpendGroup) {
      spendMap.set(group.clientId, Number(group._sum.adSpend || 0));
    }

    const data = paginated.data.map((client) => {
      const budgetUsed = spendMap.get(client.id) || 0;
      const budgetRemaining = client.monthlyBudget
        ? Math.max(0, Number(client.monthlyBudget) - budgetUsed)
        : null;

      return {
        ...client,
        monthlyRetainer: Number(client.monthlyRetainer),
        amountPaid: Number(client.amountPaid),
        monthlyBudget: client.monthlyBudget ? Number(client.monthlyBudget) : null,
        budgetUsed,
        budgetRemaining,
      };
    });

    return paginatedResponse(data, paginated.pagination);
  } catch (error) {
    console.error("[GET /api/clients] Error:", error);
    return internalErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const body = await req.json();
    const result = createClientSchema.safeParse(body);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;

    // Check email uniqueness across clients
    const existing = await prisma.client.findFirst({
      where: { contactEmail: data.contactEmail },
    });
    if (existing) {
      return conflictResponse("DUPLICATE_EMAIL", "Email already used by another client");
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
        status: "LEAD", // default status per spec
      },
    });

    await createAuditLog({
      actorId: session.user.id,
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: client.id,
      afterSnapshot: client as any,
    });

    return successResponse(
      {
        ...client,
        monthlyRetainer: Number(client.monthlyRetainer),
        amountPaid: Number(client.amountPaid),
        monthlyBudget: client.monthlyBudget ? Number(client.monthlyBudget) : null,
      },
      201
    );
  } catch (error) {
    console.error("[POST /api/clients] Error:", error);
    return internalErrorResponse();
  }
}
