import "@/styles/globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { DM_Sans} from "next/font/google"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
