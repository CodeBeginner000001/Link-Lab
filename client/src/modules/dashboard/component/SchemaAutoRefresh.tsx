"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type SchemaAutoRefreshProps = {
  intervalMs?: number;
};

export default function SchemaAutoRefresh({
  intervalMs = 10000,
}: SchemaAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    const interval = window.setInterval(refresh, intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs, router]);

  return null;
}
