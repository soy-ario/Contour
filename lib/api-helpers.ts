import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { ZodError } from "zod";

async function getMeta() {
  let requestId: string | null = null;
  try {
    const headersList = await headers();
    requestId = headersList.get("x-request-id");
  } catch (e) {
    // Headers read might fail if outside request context
  }
  return {
    requestId: requestId || `req_${Math.random().toString(36).substring(2, 11)}`,
    timestamp: new Date().toISOString(),
  };
}

export async function successResponse<T>(data: T, status = 200) {
  const meta = await getMeta();
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  );
}

export async function paginatedResponse<T>(data: T[], pagination: any, status = 200) {
  const meta = await getMeta();
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
      meta,
    },
    { status }
  );
}

export async function errorResponse(code: string, message: string, details?: any, status = 400) {
  const meta = await getMeta();
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta,
    },
    { status }
  );
}

export async function unauthorizedResponse() {
  return errorResponse("UNAUTHENTICATED", "No active session", undefined, 401);
}

export async function forbiddenResponse() {
  return errorResponse("FORBIDDEN", "Forbidden — access denied", undefined, 403);
}

export async function validationErrorResponse(zodError: ZodError) {
  const details = zodError.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    received: (err as any).value ?? undefined,
  }));
  return errorResponse("VALIDATION_ERROR", "Request validation failed", details, 400);
}

export async function notFoundResponse(resource = "Resource") {
  return errorResponse("NOT_FOUND", `${resource} not found`, undefined, 404);
}

export async function conflictResponse(code: string, message: string) {
  return errorResponse(code, message, undefined, 409);
}

export async function internalErrorResponse() {
  return errorResponse("INTERNAL_SERVER_ERROR", "An unexpected server error occurred", undefined, 500);
}
