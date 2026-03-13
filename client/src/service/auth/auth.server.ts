import { cookies } from "next/headers";
import { cache } from "react";
import { BACKEND_API_URL } from "@/config/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};

export const GetCurrentUser = cache(async (): Promise<AuthUser | null> => {
  try {
    const cookieStore = await cookies();

    const response = await fetch(`${BACKEND_API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: cookieStore.toString(),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();

    return {
      id: json.data.id,
      name: json.data.name,
      email: json.data.email,
      avatar: json.data.avatar,
    };
  } catch (err) {
    console.error("GetCurrentUser failed:", err);
    return null;
  }
});
