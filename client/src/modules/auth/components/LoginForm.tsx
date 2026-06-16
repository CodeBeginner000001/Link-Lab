"use client";
import { Login } from "@/service/auth";
import {
  handleFormFieldErrors,
  getUserFriendlyMessage,
} from "@/utils/custom-error-message";
import { useToastNotification } from "@/utils/toast";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import FormField from "./common/FormField";
import SubmitButton from "./common/SubmitButton";

type LoginFormErrors = {
  email?: string;
  password?: string;
};

const LOGIN_ERROR_FIELDS = ["email", "password"] as const;

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
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
    const loginResult = await Login(formData.email, formData.password);
    setLoading(false);

    if (loginResult.result?.success) {
      notify(loginResult.result.data.message, "success");
      router.replace("/dashboard/url-shortener");
      router.refresh();
      return;
    }

    if (
      handleFormFieldErrors(loginResult, LOGIN_ERROR_FIELDS, {
        setErrors,
        notify,
      })
    ) {
      return;
    }

    notify(getUserFriendlyMessage(loginResult), "error");
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
      <SubmitButton loading={loading} buttonLabel="Sign In" />
    </form>
  );
}
