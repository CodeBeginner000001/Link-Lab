import { BACKEND_API_URL_ENV } from "@/config/api";
import { NextResponse } from "next/server";

const BACKEND_API_URL = BACKEND_API_URL_ENV;
const clearAuthCookies = (response: NextResponse) => {
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
};

const getSafeRedirectPath = (value: string | null) => {
  if (!value || !value.startsWith("/")) {
    return "/dashboard";
  }

  return value;
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectTo = getSafeRedirectPath(
    requestUrl.searchParams.get("redirect"),
  );
  const cookieHeader = request.headers.get("cookie") || "";
  const refreshToken = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("refresh_token="))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!refreshToken) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    clearAuthCookies(response);
    return response;
  }

  try {
    const backendResponse = await fetch(`${BACKEND_API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!backendResponse.ok) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      clearAuthCookies(response);
      return response;
    }

    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    const setCookieHeader = backendResponse.headers.get("set-cookie");

    if (setCookieHeader) {
      response.headers.set("set-cookie", setCookieHeader);
    }

    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    clearAuthCookies(response);
    return response;
  }
}
