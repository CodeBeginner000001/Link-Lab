"use client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PasswordReset() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmShowPassword, setConfirmShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
    setTimeout(() => {
      setShowPassword((prev) => !prev);
    }, 500);
  };

  const handleCofirmShowPassword = () => {
    setConfirmShowPassword((prev) => !prev);
    setTimeout(() => {
      setConfirmShowPassword((prev) => !prev);
    }, 500);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace("/signin");
    }, 2000);
    console.log("form Submitted");
    
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
              <Lock className="w-8 h-8 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="font-bold text-2xl mb-2">Set New Password</h1>
            <p className="text-[hsl(var(--muted-foreground)/0.9)]">
              Create a strong password for your account.
            </p>
          </div>

          {/* form submission */}
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground)/0.9)]" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={handleFormChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    onClick={handleShowPassword}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.password}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground)/0.9)]" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={confirmShowPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={handleFormChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  onClick={handleCofirmShowPassword}
                >
                  {confirmShowPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </>
  );
}
