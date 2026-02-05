import { NextRequest, NextResponse } from "next/server";
import { isPublicRoute } from "./middleware/auth/check-route";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: [
    // run proxy on all routes except static assets
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};