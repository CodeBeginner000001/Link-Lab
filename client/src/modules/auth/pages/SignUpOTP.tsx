import { GetSessionData } from "@/service/auth";
import { Mail } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MotionWrapper from "../../../components/common/MotionWrapper";
import Header from "../components/common/Header";
import OTPForm from "../components/OTPForm";

export default async function SignUpOTPVerification() {
  const cookieStore = await cookies();
  const signupSession = cookieStore.get("signup_session");
  if (!signupSession) redirect("/signup");

  const sessionData = await GetSessionData(cookieStore.toString());
  if (!sessionData.result) {
    redirect("/signup");
  }
  const { email, otp_resend_after: resendCooldown } = sessionData.result.data;
  return (
    <>
      <div className="flex flex-1 items-center justify-center">
        <MotionWrapper>
          <Header
            icon={Mail}
            heading="Enter verification code"
            paraline1="We've sent a 6-digit verification code to"
            paraline2={email}
          />
          <OTPForm initialCooldown={resendCooldown}/>
        </MotionWrapper>
      </div>
    </>
  );
}
