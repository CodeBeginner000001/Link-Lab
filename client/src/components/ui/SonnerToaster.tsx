"use client";

import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

const mobileBreakpoint = "(max-width: 1024px)";

export function SonnerToaster() {
  const { resolvedTheme } = useTheme();
  const [position, setPosition] = useState<"top-right" | "bottom-right">(
    "bottom-right",
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileBreakpoint);

    const updatePosition = (matches: boolean) => {
      setPosition(matches ? "top-right" : "bottom-right");
    };

    updatePosition(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      updatePosition(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <Toaster
      theme={resolvedTheme}
      position={position}
      duration={2000}
      visibleToasts={1}
      closeButton
      richColors
      offset={16}
      mobileOffset={16}
    />
  );
}
