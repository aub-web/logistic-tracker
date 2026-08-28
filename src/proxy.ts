import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/sync authenticates itself via SYNC_SECRET (for external cron), not
  // the admin cookie — let it through here.
  if (pathname === "/api/sync") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const authenticated = (await verifySessionToken(token)) !== null;

  if (pathname === "/login") {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/device-requests/:path*",
    "/swapping-requests/:path*",
    "/summary",
    "/trash",
    "/login",
  ],
};
