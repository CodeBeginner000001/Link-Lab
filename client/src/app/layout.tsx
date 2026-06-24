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
import { isKnownRoute, isProtectedRoute } from "@/middleware/auth/check-route";
import { APP_URL } from "@/utils/env";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "Link Lab",
  title: {
    default: "Link Lab",
    template: "%s | Link Lab",
  },
  description:
    "Link Lab is a digital toolkit for short links, barcodes, QR tools, and link utilities.",
  openGraph: {
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
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

const themeInitScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("theme");
    const theme = ["light", "dark", "system"].includes(storedTheme)
      ? storedTheme
      : "system";
    const resolvedTheme =
      theme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolvedTheme);
  } catch {
    document.documentElement.classList.add(
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    );
  }
})();
`;

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
  const shouldResolveUser = accessToken && isKnownRoute(pathname);
  const user = shouldResolveUser ? await GetCurrentUser(accessToken) : null;

  if (isProtectedRoute(pathname) && !user && refreshToken) {
    redirect(`/refresh?redirect=${encodeURIComponent(pathname)}`);
  }

  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
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
