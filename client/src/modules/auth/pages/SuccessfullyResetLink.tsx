"use client";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SuccessfullyResetLink() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[hsl(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
          <p className="text-[hsl(var(--muted-foreground)/0.9)]">
            We&apos;ve sent password reset link to
          </p>
          <p className="text-[hsl(var(--foreground))] font-medium mt-1">
              ashu210ahjb@gmail.com
            </p>
        </div>
        <p className="text-[hsl(var(--muted-foreground)/0.9)] text-center">
          Please check your inbox and spam folder. The code will expire in a few minutes.
        </p>
        <p className="text-center text-sm text-[hsl(var(--muted-foreground)/0.9)] mt-6">
          Remember your Password?{" "}
          <Link href="signin">
            <button className="text-[hsl(var(--primary))] hover:underline font-medium">
              Sign In
            </button>
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
