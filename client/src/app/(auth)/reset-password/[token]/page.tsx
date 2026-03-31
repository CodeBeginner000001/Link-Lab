import { ValidateResetPasswordToken } from "@/service/auth";
import PasswordReset from "@/modules/auth/pages/PasswordReset";
import ResetTokenExpired from "@/modules/auth/pages/ResetTokenExpired";

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
