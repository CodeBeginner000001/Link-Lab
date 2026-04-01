import { SonnerToaster } from "@/components/ui/SonnerToaster";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthUserProvider } from "@/Provider/AuthUserProvider";
import { GetCurrentUser } from "@/service/auth";
import "@/styles/globals.css";
import { cookies, headers } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DM_Sans } from "next/font/google";
import "sonner/dist/styles.css";
import OAuthWrapper from "@/context/OAuthWrapper";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const pathname = headerStore.get("x-pathname") || "/";
  const user = accessToken ? await GetCurrentUser(accessToken) : null;

  if (!pathname.startsWith("/refresh") && !user && refreshToken) {
    redirect(`/refresh?redirect=${encodeURIComponent(pathname)}`);
  }

  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <OAuthWrapper>
          <ThemeProvider>
            <AuthUserProvider user={user}>
              {children}
              <SonnerToaster />
            </AuthUserProvider>
          </ThemeProvider>
        </OAuthWrapper>
      </body>
    </html>
  );
}
