import { BACKEND_API_URL } from "@/utils/env";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const EXCLUDED_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function revalidateFeatureTags(endpoint: string) {
  if (endpoint.startsWith("short-urls")) {
    revalidateTag("short-urls", { expire: 0 });
  }

  if (endpoint.startsWith("barcodes")) {
    revalidateTag("barcodes", { expire: 0 });
  }

  if (endpoint.startsWith("bulk-barcodes")) {
    revalidateTag("bulk-barcodes", { expire: 0 });
  }

  if (endpoint.startsWith("one-time-links")) {
    revalidateTag("one-time-links", { expire: 0 });
  }

  if (endpoint.startsWith("link-expanders")) {
    revalidateTag("link-expanders", { expire: 0 });
  }

  if (endpoint.startsWith("broken-link-checkers")) {
    revalidateTag("broken-link-checkers", { expire: 0 });
  }
}

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
    headers.set("accept-encoding", "identity");

    const backendResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
    });

    const response = new NextResponse(await backendResponse.arrayBuffer(), {
      status: backendResponse.status,
    });

    const shouldRevalidate =
      MUTATING_METHODS.has(request.method) &&
      (backendResponse.ok ||
        endpoint.startsWith("bulk-barcodes") ||
        endpoint.startsWith("link-expanders") ||
        endpoint.startsWith("broken-link-checkers"));
    const isBulkDownload =
      request.method === "GET" &&
      backendResponse.ok &&
      endpoint.startsWith("bulk-barcodes/") &&
      endpoint.endsWith("/download");

    if (shouldRevalidate || isBulkDownload) {
      revalidateFeatureTags(endpoint);
    }

    for (const [headerName, headerValue] of backendResponse.headers.entries()) {
      if (EXCLUDED_RESPONSE_HEADERS.has(headerName.toLowerCase())) {
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
        statusCode: 503,
        message: ["Unable to reach server"],
        error: "Service Unavailable",
        timeStamp: new Date().toISOString(),
        path: request.nextUrl.pathname,
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
