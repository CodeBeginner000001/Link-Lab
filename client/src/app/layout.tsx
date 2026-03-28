import { SonnerToaster } from "@/components/ui/SonnerToaster";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthUserProvider } from "@/Provider/AuthUserProvider";
import { GetCurrentUser } from "@/service/auth";
import "@/styles/globals.css";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DM_Sans } from "next/font/google";
import "sonner/dist/styles.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
        <ThemeProvider>
          <AuthUserProvider user={user}>
            {children}
            <SonnerToaster />
          </AuthUserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
