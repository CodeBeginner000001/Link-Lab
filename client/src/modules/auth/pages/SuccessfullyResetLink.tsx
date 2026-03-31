"use client";

import { useEffect, useState } from "react";
import MotionWrapper from "@/components/common/MotionWrapper";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SuccessfullyResetLink() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      router.replace("/login");
    }, 5000);

    const countdownTimer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(countdownTimer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearInterval(countdownTimer);
    };
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <MotionWrapper className="max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[hsl(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Reset Link Sent!</h1>
          <p className="text-[hsl(var(--muted-foreground)/0.9)]">
            We&apos;ve sent a password reset link to your email address.
          </p>
        </div>
        <p className="text-[hsl(var(--muted-foreground)/0.9)] text-center">
          Please check your inbox and spam folder. The link will expire in a few minutes.
        </p>
        <p className="text-center text-sm text-[hsl(var(--muted-foreground)/0.9)] mt-4">
          You&apos;ll be redirected to the login page in {countdown} second
          {countdown === 1 ? "" : "s"}.
        </p>
        <p className="text-center text-sm text-[hsl(var(--muted-foreground)/0.9)] mt-6">
          Remember your Password?{" "}
          <Link href="/login">
            <button className="text-[hsl(var(--primary))] hover:underline font-medium">
              Sign In
            </button>
          </Link>
        </p>
      </MotionWrapper>
    </div>
  );
}
