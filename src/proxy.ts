import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/session";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(COOKIE_NAME);
  const { pathname } = request.nextUrl;

  // Only the /admin login page itself is reachable without a session.
  // Sub-routes like /admin/users and /admin/events require a session.
  if (!hasSession && pathname !== "/admin" && pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (!hasSession && pathname.startsWith("/scanner")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/scanner/:path*"],
};
