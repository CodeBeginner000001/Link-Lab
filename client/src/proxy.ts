import { NextRequest, NextResponse } from "next/server";
import { isPublicRoute } from "./middleware/auth/check-route";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  if (isPublicRoute(pathname)) {
    return response;
  }

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
