"use client";

import { Button } from "@/components/ui/Button";
import {
  ExportQrCode,
  ExportQrCodeError,
} from "@/service/dashboard/qr-generator";
import { QrCopyAvailability } from "@/service/dashboard/qr-generator/type";
import { formatDelay } from "@/utils/date-time-helper";
import { useToastNotification } from "@/utils/toast";
import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type QRCopyActionButtonProps = {
  publicId: string;
  copyAvailability: QrCopyAvailability;
};

const getInitialCooldown = (copyAvailability: QrCopyAvailability) =>
  copyAvailability.nextAvailableAt
    ? new Date(copyAvailability.nextAvailableAt).getTime()
    : null;

export default function QRCopyActionButton({
  publicId,
  copyAvailability,
}: QRCopyActionButtonProps) {
  const router = useRouter();
  const notify = useToastNotification();
  const [isCopying, setIsCopying] = useState(false);
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(
    getInitialCooldown(copyAvailability),
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setCooldownEndsAt(getInitialCooldown(copyAvailability));
  }, [copyAvailability]);

  useEffect(() => {
    if (!cooldownEndsAt || cooldownEndsAt <= Date.now()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const currentTime = Date.now();

      setNow(currentTime);

      if (currentTime >= cooldownEndsAt) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [cooldownEndsAt]);

  const isDisabledByCooldown = Boolean(cooldownEndsAt && cooldownEndsAt > now);
  const remainingSeconds = useMemo(() => {
    if (!cooldownEndsAt || cooldownEndsAt <= now) {
      return 0;
    }

    return Math.ceil((cooldownEndsAt - now) / 1000);
  }, [cooldownEndsAt, now]);

  const handleError = (error: ExportQrCodeError) => {
    notify(error.error, "error");

    if (error.nextCopyAvailableAt) {
      setCooldownEndsAt(new Date(error.nextCopyAvailableAt).getTime());
    }
  };

  const handleCopy = async () => {
    if (isDisabledByCooldown || isCopying) {
      return;
    }

    try {
      setIsCopying(true);
      const result = await ExportQrCode(publicId, "COPY");

      if ("error" in result) {
        handleError(result);
        return;
      }

      if (result.kind !== "copy") {
        notify("Unable to copy QR content.", "error");
        return;
      }

      await navigator.clipboard.writeText(result.content);
      setCooldownEndsAt(new Date(result.nextCopyAvailableAt).getTime());
      setNow(Date.now());
      notify("QR content copied.", "success");
      router.refresh();
    } catch {
      notify("Unable to copy QR content.", "error");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-row-action="true"
      disabled={isCopying || isDisabledByCooldown}
      onClick={() => void handleCopy()}
      aria-label={`Copy QR ${publicId}`}
      title={
        isDisabledByCooldown
          ? `Copy available again in ${formatDelay(remainingSeconds)}`
          : "Copy QR content"
      }
      className="h-7 w-7 rounded-full border border-emerald-200/80 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:border-emerald-200/60 disabled:bg-emerald-50/60 disabled:text-emerald-500 md:h-9 md:w-9 dark:border-emerald-400/20 dark:text-emerald-300 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200 dark:disabled:border-emerald-400/15 dark:disabled:bg-emerald-400/10"
    >
      {isDisabledByCooldown ? (
        <Check className="h-3.5 w-3.5 md:h-4 md:w-4" />
      ) : (
        <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
      )}
    </Button>
  );
}
