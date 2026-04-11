import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/utils/tailwindcss-merger";
import { ComponentProps } from "react";

type UrlInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
  label?: string;
  containerClassName?: string;
};

export default function UrlInput({
  id = "url",
  label = "URL",
  className,
  containerClassName,
  ...props
}: UrlInputProps) {
  return (
    <div className={cn("grid gap-2", containerClassName)}>
      <Label htmlFor={id} className="max-sm:text-xs">{label}</Label>
      <Input
        id={id}
        type="url"
        inputMode="url"
        autoComplete="url"
        className={cn("h-11", className)}
        {...props}
      />
    </div>
  );
}
