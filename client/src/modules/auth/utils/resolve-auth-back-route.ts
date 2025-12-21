import { AUTH_BACK_ROUTE_MAP, AuthFlowSource } from "@/modules/auth/constants/auth-routing";

export function resolveAuthBackRoute(
  pathname: string,
  from?: AuthFlowSource
): string {
  const routeConfig = AUTH_BACK_ROUTE_MAP[pathname];

  if (!routeConfig) {
    return "/";
  }

  if (from && routeConfig.from?.[from]) {
    return routeConfig.from[from]!;
  }

  return routeConfig.default;
}