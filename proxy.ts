import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const allCookies = request.cookies.getAll();
  // Check for presence of the session token cookie (takes into account the "contour" prefix)
  const hasSessionCookie = allCookies.some((cookie) =>
    cookie.name.includes("session_token")
  );

  const { pathname } = request.nextUrl;

  if (!hasSessionCookie) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/client")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};
