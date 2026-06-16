const PUBLIC_ROUTES = [
  "/",
  "/404",
  "/410",
  "/500",
  "/logo.png",
  "/login",
  "/signup",
  "/signup/verify/OTP",
  "/forgetpassword",
  "/reset-password",
  "/refresh",
  "/OAuth",
];

const PROTECTED_ROUTES = [
  "/dashboard",
  "/dashboard/barcode-decoder",
  "/dashboard/barcode-generator",
  "/dashboard/broken-link-checker",
  "/dashboard/dns-checker",
  "/dashboard/dynamic-qr",
  "/dashboard/link-expander",
  "/dashboard/one-time-link",
  "/dashboard/qr-code-generator",
  "/dashboard/qr-scanner",
  "/dashboard/settings",
  "/dashboard/url-shortener",
];

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route);
}
