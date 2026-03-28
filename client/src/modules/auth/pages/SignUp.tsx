import { GetSessionData } from "@/service/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MotionWrapper from "../../../components/common/MotionWrapper";
import AuthDivider from "../components/AuthDivider";
import AuthFooter from "../components/AuthFooter";
import AuthHero from "../components/AuthHero";
import AuthNavBar from "../components/common/AuthNavBar";
import GoogleButton from "../components/common/GoogleButton";
import SignUpForm from "../components/SignUpForm";

export default async function SignUp() {
  const cookieStore = await cookies();
  const signupSession = cookieStore.get("signup_session");
  if (signupSession) {
    const sessionData = await GetSessionData(cookieStore.toString());

    if (sessionData.result) {
      redirect("/signup/verify/OTP");
    }
  }
  return (
    <>
      <AuthNavBar link="/" />
      <div className="flex flex-1 items-center justify-center">
        <MotionWrapper className="max-w-md">
          <AuthHero
            logoSize="lg"
            heading="Create your account"
            headline="Start your journey with LinkLab"
          />
          <GoogleButton />
          <AuthDivider dividerLine="Or continue with email" />
          <SignUpForm />
          <AuthFooter
            href="/login"
            buttonLabel="Sign in"
            headline="Already have an account?"
          />
        </MotionWrapper>
      </div>
    </>
  );
}
