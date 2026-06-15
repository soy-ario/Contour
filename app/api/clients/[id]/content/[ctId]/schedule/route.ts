import { NextRequest } from "next/server";
import { scheduleContentAction } from "@/lib/actions/content.actions";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/api-helpers";

interface RouteParams {
  params: Promise<{
    id: string;
    ctId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return unauthorizedResponse();
    if (session.user.role !== "ADMIN") return forbiddenResponse();

    const { id: clientId, ctId } = await params;

    // Verify content exists and belongs to client
    const content = await prisma.content.findUnique({
      where: { id: ctId },
      select: { clientId: true },
    });

    if (!content || content.clientId !== clientId) {
      return notFoundResponse("Content");
    }

    let scheduledDate: string;
    try {
      const body = await req.json();
      scheduledDate = body?.scheduledDate;
    } catch {
      return errorResponse("BAD_REQUEST", "Request body is required");
    }

    if (!scheduledDate || scheduledDate.trim() === "") {
      return errorResponse("VALIDATION_ERROR", "A scheduledDate is required to schedule content");
    }

    const result = await scheduleContentAction(ctId, scheduledDate);
    if (!result.success) {
      return errorResponse("SCHEDULE_FAILED", result.error || "Failed to schedule content", undefined, 400);
    }

    return successResponse(result.data);
  } catch (error) {
    console.error("[POST /api/clients/[id]/content/[ctId]/schedule] Error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred", undefined, 500);
  }
}
