import { BACKEND_API_URL } from "@/utils/env";
import { NextRequest, NextResponse } from "next/server";

type RedirectRouteContext = {
  params: Promise<{ alias: string }>;
};

const getBackendRedirectUrl = (alias: string) => {
  const backendBaseUrl = BACKEND_API_URL.replace(/\/v1\/?$/, "").replace(
    /\/+$/,
    "",
  );

  return `${backendBaseUrl}/ot/${encodeURIComponent(alias)}`;
};

export async function GET(request: NextRequest, context: RedirectRouteContext) {
  const { alias } = await context.params;

  try {
    const response = await fetch(getBackendRedirectUrl(alias), {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
    });
    const destination = response.headers.get("location");

    if (destination && response.status >= 300 && response.status < 400) {
      return NextResponse.redirect(destination);
    }
  } catch {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  return NextResponse.redirect(new URL("/404", request.url));
}
