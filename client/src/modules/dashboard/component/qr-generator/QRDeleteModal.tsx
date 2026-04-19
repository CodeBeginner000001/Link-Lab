"use client";

import { DeleteQrCode, GetQrCodeDetailFromProxy } from "@/service/dashboard/qr-generator";
import { useToastNotification } from "@/utils/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ToolConfirmModal from "../common/ToolConfirmModal";

type QRDeleteModalProps = {
  publicId: string;
  content: string;
  trigger: React.ReactNode;
};

const getErrorMessage = (message: string[] | undefined, fallback: string) =>
  message?.[0] ?? fallback;

export default function QRDeleteModal({
  publicId,
  content,
  trigger,
}: QRDeleteModalProps) {
  const router = useRouter();
  const notify = useToastNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setConfirmValue("");
    setIsOpen(false);
  };

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      const detailResponse = await GetQrCodeDetailFromProxy(publicId);

      if ("error" in detailResponse) {
        notify(
          getErrorMessage(
            detailResponse.error?.message,
            "Failed to load QR details.",
          ),
          "error",
        );
        return;
      }

      const qrId = detailResponse.result.data.qrCode.id;
      const deleteResponse = await DeleteQrCode(qrId);

      if ("error" in deleteResponse) {
        notify(
          getErrorMessage(
            deleteResponse.error?.message,
            "Failed to delete QR code.",
          ),
          "error",
        );
        return;
      }

      notify("QR code deleted.", "success");
      router.refresh();
      handleClose();
    } catch {
      notify("Something went wrong. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <span onClick={() => setIsOpen(true)}>{trigger}</span>
      <ToolConfirmModal
        isOpen={isOpen}
        eyebrow="Delete QR"
        title="Confirm removal"
        subjectLabel="You are about to delete:"
        subjectValue={content}
        confirmValue={confirmValue}
        confirmKeyword="confirm"
        confirmLabel={isDeleting ? "Deleting..." : "Delete QR"}
        onConfirmValueChange={setConfirmValue}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </>
  );
}
