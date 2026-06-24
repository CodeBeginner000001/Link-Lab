import ForgetPassword from "@/modules/auth/pages/ForgetPassword";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
  description:
    "Request a secure password reset link for your Link Lab account.",
  alternates: {
    canonical: "/forgetpassword",
  },
  openGraph: {
    title: "Forgot password | Link Lab",
    description:
      "Request a secure password reset link for your Link Lab account.",
    url: "/forgetpassword",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Forgot password | Link Lab",
    description:
      "Request a secure password reset link for your Link Lab account.",
  },
};

export default function Page() {
  return <ForgetPassword />;
}
