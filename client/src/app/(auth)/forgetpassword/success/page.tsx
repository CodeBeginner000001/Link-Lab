import SuccessfullyResetLink from "@/modules/auth/pages/SuccessfullyResetLink";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password reset email sent",
  description:
    "Your Link Lab password reset email has been sent. Check your inbox to continue.",
  alternates: {
    canonical: "/forgetpassword/success",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Password reset email sent | Link Lab",
    description:
      "Your Link Lab password reset email has been sent. Check your inbox to continue.",
    url: "/forgetpassword/success",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Password reset email sent | Link Lab",
    description:
      "Your Link Lab password reset email has been sent. Check your inbox to continue.",
  },
};

export default function Page() {
  return <SuccessfullyResetLink />;
}
