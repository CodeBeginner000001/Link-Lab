import { jwtVerify } from "jose";

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not configured");
}

const accessSecret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);

const refreshSecret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

export async function isAccessTokenValid(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, accessSecret);
    return true;
  } catch {
    return false;
  }
}

export async function isRefreshTokenValid(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, refreshSecret);
    return true;
  } catch {
    return false;
  }
}

export const config = {
  matcher: [
    /*
      Run middleware on ALL routes
      except:
      - next internal files
      - static assets
      - favicon
      - api routes (optional)
    */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};