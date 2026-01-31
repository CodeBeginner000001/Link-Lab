import AuthDivider from "../components/AuthDivider";
import AuthFooter from "../components/AuthFooter";
import AuthHero from "../components/AuthHero";
import AuthNavBar from "../components/AuthNavBar";
import GoogleButton from "../components/GoogleButton";
import MotionWrapper from "../components/MotionWrapper";
import SignUpForm from "../components/SignUpForm";

export default function SignUp() {
  return (
    <>
      <AuthNavBar link="/" />
      <div className="flex flex-1 items-center justify-center">
        <MotionWrapper>
          <AuthHero
            logoSize="lg"
            heading="Create your account"
            headline="Start your journey with LinkLab"
          />
          <GoogleButton />
          <AuthDivider dividerLine="Or continue with email" />
          <SignUpForm />
          <AuthFooter
            href="/signin"
            buttonLabel="Sign in"
            headline="Already have an account?"
          />
        </MotionWrapper>
      </div>
    </>
  );
}
