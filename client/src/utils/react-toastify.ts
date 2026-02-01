import { useTheme } from "@/context/ThemeContext";
import { Bounce, toast } from "react-toastify";
type ToastType = "success" | "error" | "info" | "warning";

export function useToastNotification() {
  const { resolvedTheme } = useTheme();
  return (message: string, type: ToastType = "info") => {
    const toastMap = {
      success: toast.success,
      error: toast.error,
      info: toast.info,
      warning: toast.warning,
    };
    toastMap[type](message, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      theme: resolvedTheme,
      transition: Bounce,
    });
  };
}

export function notification(message: string) {
  return toast.info(message, {
    position: "top-right",
    autoClose: 2000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
    transition: Bounce,
  });
}

