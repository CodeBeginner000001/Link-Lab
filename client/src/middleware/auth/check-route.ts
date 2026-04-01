const PUBLIC_ROUTES = [
    "/",
    "/logo.png",
    "/login",
    "/signup",
    "/signup/verify/OTP",
    "/forgetpassword",
    "/reset-password",
    "/refresh",
    "/OAuth"
]
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}
