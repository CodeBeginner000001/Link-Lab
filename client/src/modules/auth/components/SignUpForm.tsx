"use client";
import {
  handleFormFieldErrors,
  getUserFriendlyMessage,
} from "@/utils/custom-error-message";
import { useToastNotification } from "@/utils/toast";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FormField from "./common/FormField";
import SubmitButton from "./common/SubmitButton";
import { Signup } from "@/service/auth";

type SignUpFormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const SIGN_UP_ERROR_FIELDS = ["name", "email", "password"] as const;

export default function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<SignUpFormErrors>({});

  const notify = useToastNotification();
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    if (formData.confirmPassword != formData.password) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setLoading(true);
    const signupResult = await Signup(
      formData.name,
      formData.email,
      formData.password,
    );
    setLoading(false);
    if (signupResult.result?.success) {
      notify(signupResult.result.data?.message, "success");
      router.push("/signup/verify/OTP");
      return;
    }
    if (
      handleFormFieldErrors(signupResult, SIGN_UP_ERROR_FIELDS, {
        setErrors,
        notify,
        statusCodes: [400],
      })
    ) {
      return;
    }
    notify(getUserFriendlyMessage(signupResult), "error");
  };
  return (
    <form className="space-y-4" onSubmit={handleFormSubmit} noValidate>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex gap-4"
        >
          <FormField
            label="Full Name"
            name="name"
            placeholder="John Doe"
            icon={User}
            value={formData.name}
            error={errors.name}
            onChange={handleFormChange}
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            icon={Mail}
            value={formData.email}
            error={errors.email}
            onChange={handleFormChange}
          />
        </motion.div>
      </AnimatePresence>
      <FormField
        label="Password"
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
      <SubmitButton loading={loading} buttonLabel="Create Account" />
    </form>
  );
}
