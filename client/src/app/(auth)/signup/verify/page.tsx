import SignUpOTP from "@/modules/auth/pages/SignUpOTP"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify account",
  description:
    "Verify your Link Lab account with the one-time code sent during signup.",
  alternates: {
    canonical: "/signup/verify",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Verify account | Link Lab",
    description:
      "Verify your Link Lab account with the one-time code sent during signup.",
    url: "/signup/verify",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Verify account | Link Lab",
    description:
      "Verify your Link Lab account with the one-time code sent during signup.",
  },
};

export default function Page() {
    return <SignUpOTP />
}
