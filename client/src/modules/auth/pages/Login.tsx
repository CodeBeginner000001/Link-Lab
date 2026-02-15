import Link from "next/link";
import MotionWrapper from "../../../components/common/MotionWrapper";
import AuthDivider from "../components/AuthDivider";
import AuthFooter from "../components/AuthFooter";
import AuthHero from "../components/AuthHero";
import AuthNavBar from "../components/common/AuthNavBar";
import GoogleButton from "../components/common/GoogleButton";
import LoginForm from "../components/LoginForm";

export default function Login() {
  return (
    <>
      <AuthNavBar link="/" />
      <div className="flex flex-1 items-center justify-center">
        <MotionWrapper>
          <AuthHero
            logoSize="lg"
            heading="Welcome back"
            headline="Sign in to access your dashboard"
          />
          <GoogleButton />
          <AuthDivider dividerLine="Or continue with email" />
          <LoginForm />
          <div className="text-center mt-4">
            <Link href="/forgetpassword">
              <button
                type="button"
                className="text-sm text-[hsl(var(--muted-foreground)/0.9)] hover:text-[hsl(var(--primary))] transition-colors hover:cursor-pointer"
              >
                Forgot password?
              </button>
            </Link>
          </div>
          <AuthFooter
            href="/signup"
            buttonLabel="Sign Up"
            headline="Don't have an account? "
          />
        </MotionWrapper>
      </div>
    </>
  );
}
