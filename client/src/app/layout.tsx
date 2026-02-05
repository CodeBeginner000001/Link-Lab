import { ThemeProvider } from "@/context/ThemeContext";
import { AuthUserProvider } from "@/Provider/AuthUserProvider";
import { GetCurrentUser } from "@/service/auth";
import "@/styles/globals.css";
import { DM_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { ToastContainer } from "react-toastify";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const user = await GetCurrentUser(cookieStore.toString());
  console.log(user)
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <ThemeProvider>
          <AuthUserProvider user={user}>{children}</AuthUserProvider>
        </ThemeProvider>
        <ToastContainer limit={1} />
      </body>
    </html>
  );
}
