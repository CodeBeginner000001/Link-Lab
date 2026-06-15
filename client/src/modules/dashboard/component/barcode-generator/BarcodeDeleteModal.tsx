"use client";

import { useState } from "react";
import { useToastNotification } from "@/utils/toast";
import {
  DeleteBarcode,
  NotifyBarcodeDataChanged,
} from "@/service/dashboard/barcode-generator";
import ToolConfirmModal from "../common/ToolConfirmModal";
import { RecentBarcode } from "./recent/types";

type BarcodeDeleteModalProps = {
  barcode: RecentBarcode;
  trigger: React.ReactNode;
  onDeleted: (id: string) => void;
};

export default function BarcodeDeleteModal({
  barcode,
  trigger,
  onDeleted,
}: BarcodeDeleteModalProps) {
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
      const response = await DeleteBarcode(barcode.id);

      if ("error" in response) {
        const message = response.error.message;
        notify(
          Array.isArray(message)
            ? (message[0] ?? "Failed to delete barcode.")
            : (message ?? "Failed to delete barcode."),
          "error",
        );
        return;
      }

      notify(response.result.data.message, "success");
      NotifyBarcodeDataChanged();
      onDeleted(barcode.id);
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
        eyebrow="Delete Barcode"
        title="Confirm removal"
        subjectLabel="You are about to delete:"
        subjectValue={`${barcode.format} — ${barcode.content}`}
        confirmValue={confirmValue}
        confirmKeyword="confirm"
        confirmLabel={isDeleting ? "Deleting..." : "Delete Barcode"}
        onConfirmValueChange={setConfirmValue}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </>
  );
}
