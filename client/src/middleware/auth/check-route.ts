const PUBLIC_ROUTES = [
    "/",
    "/login",
    "/signup",
    "/signup/verify/OTP",
]
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}