"use client";

import MotionWrapper from "@/components/common/MotionWrapper";
import { CircleAlert } from "lucide-react";
import Link from "next/link";
import AuthFooter from "../components/AuthFooter";
import AuthNavBar from "../components/common/AuthNavBar";

export default function ResetTokenExpired() {
  return (
    <>
      <AuthNavBar link="/forgetpassword" />
      <div className="flex flex-1 items-center justify-center">
        <MotionWrapper className="max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--destructive)/0.1)] flex items-center justify-center mx-auto mb-6">
              <CircleAlert className="w-8 h-8 text-[hsl(var(--destructive))]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Reset Link Expired</h1>
            <p className="text-[hsl(var(--muted-foreground)/0.9)]">
              This password reset link is invalid or has already expired.
            </p>
          </div>
          <p className="text-[hsl(var(--muted-foreground)/0.9)] text-center">
            Request a new reset link to continue resetting your password.
          </p>
          <p className="text-center text-sm mt-4">
            <Link href="/forgetpassword">
              <button className="text-[hsl(var(--primary))] hover:underline font-medium">
                Request New Reset Link
              </button>
            </Link>
          </p>
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
