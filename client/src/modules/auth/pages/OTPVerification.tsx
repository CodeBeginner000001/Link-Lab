"use client";
import { Button } from "@/components/ui/Button";
import ToggleTheme from "@/components/ui/ToggleTheme";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Mail, RefreshCw } from "lucide-react";
import { email } from "zod";

export default function OTPVerification() {
  return (
    <>
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Enter verification code</h1>
            <p className="text-[hsl(var(--muted-foreground)/0.9)]">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-[hsl(var(--foreground))] font-medium mt-1">
              ashu210ahjb@gmail.com
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Button className="w-full" size="lg">
              <Loader2 className="w-4 h-4 animate-spin" />
              "Verify Email"
            </Button>

            <div className="text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground)/0.9)] mb-2">
                Didn't receive the code?
              </p>
              <Button variant="ghost" size="sm" className="gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <RefreshCw className="w-4 h-4" />
                Resend code
              </Button>
              <p className="text-sm text-muted-foreground">
                Resend in <span className="text-primary font-medium">5s</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
