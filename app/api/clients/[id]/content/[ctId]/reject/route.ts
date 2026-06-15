import { NextRequest } from "next/server";
import { rejectContentAction } from "@/lib/actions/approval.actions";
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

    const { id: clientId, ctId } = await params;

    // Check client role boundary
    if (session.user.role === "CLIENT" && session.user.clientId !== clientId) {
      return forbiddenResponse();
    }

    // Verify content exists and belongs to client
    const content = await prisma.content.findUnique({
      where: { id: ctId },
      select: { clientId: true },
    });

    if (!content || content.clientId !== clientId) {
      return notFoundResponse("Content");
    }

    let comment: string;
    try {
      const body = await req.json();
      comment = body?.comment;
    } catch {
      return errorResponse("BAD_REQUEST", "Request body is required");
    }

    if (!comment || comment.trim() === "") {
      return errorResponse("VALIDATION_ERROR", "A reason comment is required for rejection");
    }

    const result = await rejectContentAction(ctId, comment);
    if (!result.success) {
      return errorResponse("REJECT_FAILED", result.error || "Failed to reject content", undefined, 400);
    }

    return successResponse(result.data);
  } catch (error) {
    console.error("[POST /api/clients/[id]/content/[ctId]/reject] Error:", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred", undefined, 500);
  }
}
