import ForgetPasswordOTP from "@/modules/auth/pages/ForgetPasswordOTP";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify password reset",
  description:
    "Verify your Link Lab password reset request with the one-time code sent to your account.",
  alternates: {
    canonical: "/forgetpassword/verify",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Verify password reset | Link Lab",
    description:
      "Verify your Link Lab password reset request with the one-time code sent to your account.",
    url: "/forgetpassword/verify",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Verify password reset | Link Lab",
    description:
      "Verify your Link Lab password reset request with the one-time code sent to your account.",
  },
};

export default function Page() {
  return <ForgetPasswordOTP />;
}
