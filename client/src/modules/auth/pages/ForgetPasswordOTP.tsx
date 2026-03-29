import { GetForgetPasswordSessionData } from "@/service/auth";
import { Mail } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MotionWrapper from "../../../components/common/MotionWrapper";
import Header from "../components/common/Header";
import OTPForm from "../components/OTPForm";
import ForgetPasswordOTPForm from "../components/ForgetPasswordOTPForm";

export default async function ForgetPasswordOTP() {
  const cookieStore = await cookies();
  const sessionData = await GetForgetPasswordSessionData(
    cookieStore.toString(),
  );
  if (!sessionData.result) {
    redirect("/forgetpassword");
  }
  const { email, otpExpiresAt } = sessionData.result.data;
  return (
    <>
      <div className="flex flex-1 items-center justify-center">
        <MotionWrapper className="max-w-md">
          <Header
            icon={Mail}
            heading="Enter verification code"
            paraline1="We've sent a 6-digit verification code to"
            paraline2={email}
          />
          <ForgetPasswordOTPForm resendTimeRemaining={otpExpiresAt} />
        </MotionWrapper>
      </div>
    </>
  );
}
