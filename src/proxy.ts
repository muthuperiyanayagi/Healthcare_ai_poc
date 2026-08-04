import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/encounters") ||
    request.nextUrl.pathname.startsWith("/settings") ||
    request.nextUrl.pathname.startsWith("/analytics") ||
    request.nextUrl.pathname.startsWith("/prior-auth") ||
    request.nextUrl.pathname.startsWith("/revenue") ||
    request.nextUrl.pathname.startsWith("/claim-readiness") ||
    request.nextUrl.pathname.startsWith("/care-gaps") ||
    request.nextUrl.pathname.startsWith("/ask");

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }

    // Role-based route guard enforcement
    const userRole = (payload.role || "").toLowerCase();
    const isDoctor = userRole === "doctor";
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/ask") || pathname.startsWith("/encounters/new")) {
      if (!isDoctor) {
        // Non-doctors (e.g. admins) cannot access new clinical documentation or clinical chat assistant
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  if (request.nextUrl.pathname === "/login" && token) {
    const payload = await verifyToken(token);
    if (payload) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/encounters/:path*",
    "/settings/:path*",
    "/analytics/:path*",
    "/prior-auth/:path*",
    "/revenue/:path*",
    "/claim-readiness/:path*",
    "/care-gaps/:path*",
    "/ask/:path*",
    "/login",
  ],
};
