import { KeyRound } from "lucide-react";
import MotionWrapper from "../../../components/common/MotionWrapper";
import AuthFooter from "../components/AuthFooter";
import ForgetPasswordForm from "../components/ForgetPasswordForm";
import AuthNavBar from "../components/common/AuthNavBar";

export default function ForgetPassword() {
  return (
    <>
      <AuthNavBar link="/login" />
      <div className="flex flex-1 items-center justify-center">
        <MotionWrapper className="max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
            <p className="text-[hsl(var(--muted-foreground)/0.9)]">
              Enter your email and we&apos;ll send you a password reset link.
            </p>
          </div>
          <ForgetPasswordForm />
          <AuthFooter
            href="/login"
            buttonLabel="Sign In"
            headline="Remember your Password? "
          />
        </MotionWrapper>
      </div>
    </>
  );
}
