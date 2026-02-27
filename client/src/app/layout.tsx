// app/layout.tsx
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthUserProvider } from "@/Provider/AuthUserProvider";
import { GetCurrentUser } from "@/service/auth/auth.server";
import "@/styles/globals.css";
import { DM_Sans } from "next/font/google";
import { ToastContainer } from "react-toastify";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await GetCurrentUser();
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <ThemeProvider>
          <AuthUserProvider user={user}>
            {children}
          </AuthUserProvider>
        </ThemeProvider>
        <ToastContainer limit={1} />
      </body>
    </html>
  );
}
