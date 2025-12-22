"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { AuthFlowSource } from "../constants/auth-routing";
import { resolveAuthBackRoute } from "../utils/resolve-auth-back-route";
import AuthNavBar from "./AuthNavBar";

export default function AuthNavBarWrapper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") as AuthFlowSource | null;

  const backTo = resolveAuthBackRoute(pathname, from ?? undefined);

  return (
      <AuthNavBar link={backTo} />
  );
}
