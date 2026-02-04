"use client";
import { Button } from "@/components/ui/Button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/InputOTP";
import { ResendOTP, VerifySignUpOTP } from "@/service/auth";
import { getUserFriendlyMessage } from "@/utils/custom-error-message";
import { useToastNotification } from "@/utils/react-toastify";
import { Loader2, RefreshCw } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignUpOTPForm({
  initialCooldown,
}: {
  initialCooldown: string;
}) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(() => {
    const now = Math.floor(Date.now() / 1000);
    return Math.max(-1, parseInt(initialCooldown) - now);
  });
  const canResend = countdown === -1;
  const notify = useToastNotification();

  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    setResendLoading(true);
    const resendOTP = await ResendOTP();
    setResendLoading(false);
    if (resendOTP.result) {
      setCountdown(() =>
        Math.max(
          -1,
          parseInt(resendOTP.result.data.otp_resend_after) -
            Math.floor(Date.now() / 1000),
        ),
      );
      notify(resendOTP.result.message, "success");
      return;
    }
    notify(getUserFriendlyMessage(resendOTP), "error");
    if (
      resendOTP.error.message.split(": ")[1] ===
      "Session expired, Please start again"
    ) {
      redirect("/signup");
    }
  };

  useEffect(() => {
    if (countdown < 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOTPVerification = async () => {
    setLoading(true);
    const verifyOTP = await VerifySignUpOTP(otp);
    setLoading(false);
    if (verifyOTP.result) {
      notify(verifyOTP.result.message, "success");
      router.push("/dashboard");
      return;
    }
    notify(getUserFriendlyMessage(verifyOTP), "error");
    if (
      verifyOTP.error.message.split(": ")[1] ===
      "Session expired, Please start again"
    ) {
      redirect("/signup");
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <InputOTP
        maxLength={6}
        value={otp}
        onChange={(value) => setOtp(value)}
        className="gap-2"
      >
        <InputOTPGroup className="gap-2">
          <InputOTPSlot
            index={0}
            className="max-[310px]:w-8 max-[310px]:h-8 max-[310px]:text-xs max-[310px]:rounded-md max-[360px]:w-10 max-[360px]:h-10 max-[360px]:text-sm max-[360px]:rounded-lg w-12 h-12 text-lg"
          />
          <InputOTPSlot
            index={1}
            className="max-[310px]:w-8 max-[310px]:h-8 max-[310px]:text-xs max-[310px]:rounded-md max-[360px]:w-10 max-[360px]:h-10 max-[360px]:text-sm w-12 h-12 text-lg"
          />
          <InputOTPSlot
            index={2}
            className="max-[310px]:w-8 max-[310px]:h-8 max-[310px]:text-xs max-[310px]:rounded-md max-[360px]:w-10 max-[360px]:h-10 max-[360px]:text-sm w-12 h-12 text-lg"
          />
          <InputOTPSlot
            index={3}
            className="max-[310px]:w-8 max-[310px]:h-8 max-[310px]:text-xs max-[310px]:rounded-md max-[360px]:w-10 max-[360px]:h-10 max-[360px]:text-sm w-12 h-12 text-lg"
          />
          <InputOTPSlot
            index={4}
            className="max-[310px]:w-8 max-[310px]:h-8 max-[310px]:text-xs max-[310px]:rounded-md max-[360px]:w-10 max-[360px]:h-10 max-[360px]:text-sm w-12 h-12 text-lg"
          />
          <InputOTPSlot
            index={5}
            className="max-[310px]:w-8 max-[310px]:h-8 max-[310px]:text-xs max-[310px]:rounded-md max-[360px]:w-10 max-[360px]:h-10 max-[360px]:text-sm w-12 h-12 text-lg"
          />
        </InputOTPGroup>
      </InputOTP>

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
  );
}
