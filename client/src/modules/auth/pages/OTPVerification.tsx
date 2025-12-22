/**
 * resendLoading- true
 * setCountdown - number
 * setCanResend - true
 */
"use client";
import { Button } from "@/components/ui/Button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/InputOTP";
import { motion } from "framer-motion";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const count = 5;
export default function OTPVerification() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(count);

  const canResend = countdown===-1;

  const handleResend = ()=>{
    if(!canResend || resendLoading) return;
    setResendLoading(true);
    setTimeout(()=>{
      setCountdown(count);
      setResendLoading(false);
    },2000)
  }

  useEffect(() => {
    if (countdown < 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]); 



  const handleOTPVerification = () => {
    setLoading(true);
    setTimeout(() => {
      console.log("OTP submitted");
      setLoading(false);
      router.push("/dashboard");
    }, 500);
  };

  return (
    <>
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
              <Mail className="w-8 h-8 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Enter verification code</h1>
            <p className="text-[hsl(var(--muted-foreground)/0.9)]">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-[hsl(var(--foreground))] font-medium mt-1">
              ashu210ahjb@gmail.com
            </p>
          </div>
          <div className="flex flex-col items-center gap-6">
            {/* OTP boxes */}
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
              className="gap-2"
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={4} className="w-12 h-12 text-lg" />
                <InputOTPSlot index={5} className="w-12 h-12 text-lg" />
              </InputOTPGroup>
            </InputOTP>
            {/* Verify button */}
            <Button
              className="w-full"
              size="lg"
              disabled={loading || otp.length !== 6}
              onClick={handleOTPVerification}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify Email"
              )}
            </Button>
            {/* Resend OTP  */}
            <div className="text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground)/0.9)] mb-2">
                Didn&apos;t receive the code?
              </p>
              {canResend ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  disabled={resendLoading}
                  onClick={handleResend}
                >
                  {resendLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Resend code
                </Button>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground)/0.9)]">
                  Resend in{" "}
                  <span className="text-[hsl(var(--primary))] font-medium">
                    {countdown}s
                  </span>
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
