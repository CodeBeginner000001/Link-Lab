import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:4000/v1";

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const endpoint = path.join("/");

  try {
    const targetUrl = new URL(`${BACKEND_API_URL}/${endpoint}`);
    targetUrl.search = request.nextUrl.search;

    console.info(`[features-proxy] ${request.method} ${targetUrl.toString()}`);

    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    const cookieHeader = request.headers.get("cookie");

    if (contentType) headers.set("content-type", contentType);
    if (cookieHeader) headers.set("cookie", cookieHeader);

    const backendResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.text(),
      cache: "no-store",
    });

    const response = new NextResponse(await backendResponse.arrayBuffer(), {
      status: backendResponse.status,
    });

    for (const [headerName, headerValue] of backendResponse.headers.entries()) {
      if (headerName.toLowerCase() === "content-length") {
        continue;
      }

      response.headers.set(headerName, headerValue);
    }

    return response;
  } catch (error) {
    console.error("[features-proxy] upstream request failed", {
      endpoint,
      error: error instanceof Error ? error.message : "unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        message: ["Unable to reach server"],
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
