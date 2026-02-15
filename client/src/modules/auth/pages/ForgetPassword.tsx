"use client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { motion } from "framer-motion";
import { KeyRound, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
  }>({});

  const handleSendCode = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace("verifyotp?from=forgetpassword");
    }, 2000);
  };

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
            <KeyRound className="w-8 h-8 text-[hsl(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
          <p className="text-[hsl(var(--muted-foreground)/0.9)]">
            Enter your email and we&apos;ll send you a verification code to
            reset your password.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reset-email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground)/0.9)]" />
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && (
              <p className="text-[hsl(var(--destructive))] text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !email.trim()}
            onClick={handleSendCode}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Send Resend Code"
            )}
          </Button>
          <p className="text-center text-sm text-[hsl(var(--muted-foreground)/0.9)] mt-6">
            Remember your Password?{" "}
            <Link href="/login">
              <button className="text-[hsl(var(--primary))] hover:underline font-medium">
                Sign In
              </button>
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
