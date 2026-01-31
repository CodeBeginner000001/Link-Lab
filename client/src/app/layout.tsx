import { ThemeProvider } from "@/context/ThemeContext";
import "@/styles/globals.css";
import { DM_Sans } from "next/font/google";
import { ToastContainer } from "react-toastify";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <ToastContainer limit={1} />
      </body>
    </html>
  );
}
