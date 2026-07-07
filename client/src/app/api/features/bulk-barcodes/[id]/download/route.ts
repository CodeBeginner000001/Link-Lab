import { BACKEND_API_URL } from "@/utils/env";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const EXCLUDED_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const type = request.nextUrl.searchParams.get("type");

  if (type !== "zip" && type !== "pdf") {
    return NextResponse.json(
      { message: "Download type must be pdf or zip" },
      { status: 400 },
    );
  }

  const targetUrl = new URL(
    `${BACKEND_API_URL}/bulk-barcodes/${encodeURIComponent(id)}/download`,
  );
  targetUrl.searchParams.set("type", type);

  try {
    const headers = new Headers();
    const cookieHeader = request.headers.get("cookie");

    if (cookieHeader) {
      headers.set("cookie", cookieHeader);
    }

    headers.set("accept-encoding", "identity");

    const backendResponse = await fetch(targetUrl.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!backendResponse.ok || !backendResponse.body) {
      const errorBody = await backendResponse.text().catch(() => "");

      return new NextResponse(errorBody || "Download failed", {
        status: backendResponse.status,
      });
    }

    const responseHeaders = new Headers();

    for (const [headerName, headerValue] of backendResponse.headers.entries()) {
      if (EXCLUDED_RESPONSE_HEADERS.has(headerName.toLowerCase())) {
        continue;
      }

      responseHeaders.set(headerName, headerValue);
    }

    revalidateTag("bulk-barcodes", { expire: 0 });

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[bulk-download] upstream request failed", {
      id,
      type,
      error: error instanceof Error ? error.message : "unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        statusCode: 503,
        message: ["Unable to reach server"],
        error: "Service Unavailable",
      },
      { status: 503 },
    );
  }
}
