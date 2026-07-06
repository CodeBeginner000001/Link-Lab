import { ValidateResetPasswordToken } from "@/service/auth";
import PasswordReset from "@/modules/auth/pages/PasswordReset";
import ResetTokenExpired from "@/modules/auth/pages/ResetTokenExpired";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password",
  description:
    "Set a new password for your Link Lab account using your secure reset link.",
  alternates: {
    canonical: "/reset-password",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Reset password | Link Lab",
    description:
      "Set a new password for your Link Lab account using your secure reset link.",
    url: "/reset-password",
    siteName: "Link Lab",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Reset password | Link Lab",
    description:
      "Set a new password for your Link Lab account using your secure reset link.",
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const decodedToken = decodeURIComponent(token);
  const validationResult = await ValidateResetPasswordToken(decodedToken);

  if (!validationResult.result?.success) {
    return <ResetTokenExpired />;
  }

  return <PasswordReset token={decodedToken} />;
}
