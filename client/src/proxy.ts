import { NextRequest, NextResponse } from "next/server";
import { isProtectedRoute, isPublicRoute } from "./middleware/auth/check-route";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isPublicRoute(pathname)) {
    return response;
  }

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (isProtectedRoute(pathname) && !accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  // Skip static assets so browsers can request favicon and Apple touch icons directly.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*$).*)"],
};
