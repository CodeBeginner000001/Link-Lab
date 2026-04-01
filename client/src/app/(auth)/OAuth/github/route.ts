import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/OAuth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.redirect(
        new URL("/login", APP_URL)
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/auth/oauth/github/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.image,
        provider: "github",
        providerUserId: (session.user as { githubId?: string }).githubId,
      }),
    });

    if (!backendRes.ok) {
      return NextResponse.redirect(
        new URL("/login?error=github_exchange_failed", APP_URL)
      );
    }

    const data: {
      success: boolean;
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        email: string;
        name?: string;
        avatar?: string;
      };
    } = await backendRes.json();

    if (!data?.accessToken || !data?.refreshToken) {
      return NextResponse.redirect(
        new URL("/login?error=github_tokens_missing", APP_URL)
      );
    }

    const response = NextResponse.redirect(new URL("/dashboard", APP_URL));

    response.cookies.set("access_token", data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    response.cookies.set("refresh_token", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("GitHub complete route error:", error);

    return NextResponse.redirect(
      new URL("/login?error=github_complete_failed", APP_URL)
    );
  }
}