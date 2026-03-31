"use client";
import MotionWrapper from "@/components/common/MotionWrapper";
import { ResetPassword } from "@/service/auth";
import {
  getUserFriendlyMessage,
  handleFormFieldErrors,
} from "@/utils/custom-error-message";
import { useToastNotification } from "@/utils/toast";
import { KeyRound, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthFooter from "../components/AuthFooter";
import AuthNavBar from "../components/common/AuthNavBar";
import FormField from "../components/common/FormField";
import ResetTokenExpired from "./ResetTokenExpired";
import SubmitButton from "../components/common/SubmitButton";

type PasswordResetErrors = {
  password?: string;
  confirmPassword?: string;
};

const RESET_PASSWORD_ERROR_FIELDS = ["password"] as const;

export default function PasswordReset({ token }: { token: string }) {
  const router = useRouter();
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<PasswordResetErrors>({});
  const notify = useToastNotification();

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const nextErrors: PasswordResetErrors = {};

    if (!formData.password) {
      nextErrors.password = "Password is required";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      notify("Please fill form correctly", "error");
      return false;
    }

    return true;
  };

  const shouldRestartFlow = (
    statusCode?: number,
    messages?: string[] | string,
  ) => {
    const messageList = Array.isArray(messages)
      ? messages
      : messages
        ? [messages]
        : [];

    return (
      statusCode === 410 ||
      messageList.some((message) =>
        [
          "Invalid reset token",
          "Forgot password OTP has not been verified yet",
          "Forget Password session not found or expired",
        ].includes(message),
      )
    );
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const resetPasswordResult = await ResetPassword(token, formData.password);
    setLoading(false);

    if (resetPasswordResult.result?.success) {
      notify(resetPasswordResult.result.data.message, "success");
      router.replace("/login");
      router.refresh();
      return;
    }

    if (
      handleFormFieldErrors(resetPasswordResult, RESET_PASSWORD_ERROR_FIELDS, {
        setErrors,
        notify,
      })
    ) {
      return;
    }

    notify(getUserFriendlyMessage(resetPasswordResult), "error");

    if (
      shouldRestartFlow(
        resetPasswordResult.statusCode,
        resetPasswordResult.error?.message,
      )
    ) {
      setIsTokenExpired(true);
    }
  };

  if (isTokenExpired) {
    return <ResetTokenExpired />;
  }

  return (
    <>
      <AuthNavBar link="/forgetpassword" />
      <div className="flex flex-1 items-center justify-center">
        <MotionWrapper className="max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="font-bold text-2xl mb-2">Set New Password</h1>
            <p className="text-[hsl(var(--muted-foreground)/0.9)]">
              Choose a strong password for your account to finish the reset flow.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleFormSubmit} noValidate>
            <FormField
              label="New Password"
              name="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              error={errors.password}
              onChange={handleFormChange}
              isPassword
            />
            <FormField
              label="Confirm Password"
              name="confirmPassword"
              placeholder="••••••••"
              icon={Lock}
              value={formData.confirmPassword}
              error={errors.confirmPassword}
              onChange={handleFormChange}
              isPassword
            />
            <SubmitButton loading={loading} buttonLabel="Reset Password" />
          </form>
          <AuthFooter
            href="/login"
            buttonLabel="Sign In"
            headline="Remember your password?"
          />
        </MotionWrapper>
      </div>
    </>
  );
}
