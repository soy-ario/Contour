import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Attempt to get session from Better Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Public routes — allow through
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    // If already authenticated, redirect to appropriate dashboard
    if (session) {
      const redirectPath =
        session.user.role === "ADMIN" ? "/admin/dashboard" : "/client/dashboard";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/client/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect client routes
  if (pathname.startsWith("/client")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.user.role !== "CLIENT") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // API routes that require auth (webhooks/cron have their own auth)
  if (pathname.startsWith("/api/cron")) {
    const cronSecret = request.headers.get("authorization");
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === "/") {
    if (session) {
      const redirectPath =
        session.user.role === "ADMIN" ? "/admin/dashboard" : "/client/dashboard";
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/api/cron/:path*",
  ],
};
