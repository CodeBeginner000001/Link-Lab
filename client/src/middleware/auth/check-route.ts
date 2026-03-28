const PUBLIC_ROUTES = [
    "/",
    "/logo.png",
    "/login",
    "/signup",
    "/signup/verify/OTP",
    "/forgetpassword",
    "/refresh"
]
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}
