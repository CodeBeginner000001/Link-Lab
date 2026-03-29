"use client";

import {
  handleFormFieldErrors,
  getUserFriendlyMessage,
} from "@/utils/custom-error-message";
import { useToastNotification } from "@/utils/toast";
import { AnimatePresence, motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ForgetPassword } from "@/service/auth";
import FormField from "./common/FormField";
import SubmitButton from "./common/SubmitButton";

type ForgetPasswordFormErrors = {
  email?: string;
};

const FORGET_PASSWORD_ERROR_FIELDS = ["email"] as const;

export default function ForgetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
  });
  const [errors, setErrors] = useState<ForgetPasswordFormErrors>({});
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
    setLoading(true);
    const forgetPasswordResult = await ForgetPassword(formData.email);
    setLoading(false);

    if (forgetPasswordResult.result?.success) {
      notify(forgetPasswordResult.result.data.message, "success");
      router.replace("/forgetpassword/verify");
      return;
    }

    if (
      handleFormFieldErrors(
        forgetPasswordResult,
        FORGET_PASSWORD_ERROR_FIELDS,
        {
          setErrors,
          notify,
        },
      )
    ) {
      return;
    }

    notify(getUserFriendlyMessage(forgetPasswordResult), "error");
  };

  return (
    <form className="space-y-4" onSubmit={handleFormSubmit} noValidate>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
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
      <SubmitButton loading={loading} buttonLabel="Send Reset Link" />
    </form>
  );
}
