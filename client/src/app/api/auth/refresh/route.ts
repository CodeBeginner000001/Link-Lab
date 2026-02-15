import { NextResponse } from "next/server";

const BASE_URL = "http://localhost:4000/v1";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie");

  const backendResponse = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: cookie || "",
    },
  });

  // If refresh fails → clear cookies + login
  if (!backendResponse.ok) {
    const response = NextResponse.redirect(
      new URL("/login", req.url)
    );

    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");

    return response;
  }

  // Forward new cookies from backend
  const response = NextResponse.redirect(
    new URL(
      req.headers.get("x-redirect") || "/dashboard",
      req.url
    )
  );

  const setCookie = backendResponse.headers.get("set-cookie");

  if (setCookie) {
    response.headers.set("set-cookie", setCookie);
  }

  return response;
}
