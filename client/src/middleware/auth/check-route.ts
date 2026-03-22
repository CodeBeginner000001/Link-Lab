const PUBLIC_ROUTES = [
    "/",
    "/logo.png",
    "/real_logo.png",
    "/login",
    "/signup",
    "/signup/verify/OTP",
    "/forgetpassword",
    "/api/auth/refresh"
]
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}