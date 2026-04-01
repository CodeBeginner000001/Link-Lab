import { NextRequest, NextResponse, userAgent } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000/v1";

const ALLOWED_AUTH_PATHS = new Set([
  "login",
  "logout",
  "signup",
  "session",
  "verify-otp",
  "resend-otp",
  "refresh-token",
  "forgot-password",
  "forgot-password/verify-otp",
  "forgot-password/reset-password",
]);

function getSetCookieHeaders(headers: Headers): string[] {
  const extendedHeaders = headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof extendedHeaders.getSetCookie === "function") {
    return extendedHeaders.getSetCookie();
  }

  const setCookieHeader = headers.get("set-cookie");

  return setCookieHeader ? [setCookieHeader] : [];
}

function getLocationInfo(request: NextRequest) {
  const city = request.headers.get("x-vercel-ip-city");
  const country = request.headers.get("x-vercel-ip-country");

  if (city && country) {
    return `${city}, ${country}`;
  }

  return city ?? country ?? "Location not found";
}

function getDeviceInfo(request: NextRequest) {
  const parsedUserAgent = userAgent(request);

  return (
    parsedUserAgent.device.model ??
    parsedUserAgent.device.type ??
    request.headers.get("user-agent") ??
    "Device not found"
  );
}

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const endpoint = path.join("/");

  if (!ALLOWED_AUTH_PATHS.has(endpoint)) {
    return NextResponse.json(
      {
        success: false,
        message: ["Auth endpoint not found"],
        error: "Not Found",
      },
      { status: 404 },
    );
  }

  try {
    const targetUrl = new URL(`${BACKEND_API_URL}/auth/${endpoint}`);
    targetUrl.search = request.nextUrl.search;
    console.info(
      `[auth-proxy] ${request.method} ${targetUrl.toString()}`,
    );

    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    const cookieHeader = request.headers.get("cookie");
    const userAgent = request.headers.get("user-agent");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const deviceInfo = getDeviceInfo(request);
    const locationInfo = getLocationInfo(request);

    if (contentType) {
      headers.set("content-type", contentType);
    }

    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    if (userAgent) {
      headers.set("user-agent", userAgent);
    }

    if (forwardedFor) {
      headers.set("x-forwarded-for", forwardedFor);
    }

    if (realIp) {
      headers.set("x-real-ip", realIp);
    }

    headers.set("x-device-info", deviceInfo);
    headers.set("x-location-info", locationInfo);

    const backendResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.text(),
      cache: "no-store",
    });

    const response = new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
    });
    const responseContentType = backendResponse.headers.get("content-type");

    if (responseContentType) {
      response.headers.set("content-type", responseContentType);
    }

    for (const setCookieHeader of getSetCookieHeaders(
      backendResponse.headers,
    )) {
      response.headers.append("set-cookie", setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error("[auth-proxy] upstream request failed", {
      endpoint,
      backendUrl: BACKEND_API_URL,
      error: error instanceof Error ? error.message : "unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        message: ["Unable to reach auth server"],
        error: "Service Unavailable",
      },
      { status: 503 },
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
