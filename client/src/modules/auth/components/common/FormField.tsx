"use client";

import { Input } from "@/components/ui/Input";
import { Label } from "@radix-ui/react-label";
import { CircleX, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

type FormFieldProps = {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  value: string;
  error?: string;
  icon?: LucideIcon;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPassword?: boolean;
};

export default function FormField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  error,
  icon: Icon,
  onChange,
  isPassword = false,
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
    setTimeout(() => {
      setShowPassword((prev) => !prev);
    }, 1000);
  };

  return (
    <div className="w-full">
      <Label htmlFor={name} className="text-sm">
        {label}
      </Label>

      <div className="relative mt-1.5">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground)/0.9)]" />
        )}

        <Input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${Icon ? "pl-10 pr-10" : "pr-10"} placeholder:text-sm`}
          
        />

        {isPassword && (
          <button
            type="button"
            onClick={handleShowPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="flex gap-1 text-red-500 items-start mt-2">
          <CircleX size={14} />
          <p className="text-destructive text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
