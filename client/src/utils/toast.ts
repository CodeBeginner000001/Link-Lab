import { toast } from "sonner";

type ToastType = "success" | "error" | "info" | "warning";

const toastMap = {
  success: toast.success,
  error: toast.error,
  info: toast.info,
  warning: toast.warning,
} as const;

const defaultToastOptions = {
  duration: 2000,
};

export function useToastNotification() {
  return (message: string, type: ToastType = "info") => {
    return toastMap[type](message, defaultToastOptions);
  };
}

export function notification(message: string) {
  return toast.info(message, defaultToastOptions);
}
