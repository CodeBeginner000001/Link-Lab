"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToastNotification } from "@/utils/toast";
import { DeleteShortUrl } from "@/service/dashboard/url-shortener";
import { ShortUrlItem } from "@/service/dashboard/url-shortener/type";
import ToolConfirmModal from "../common/ToolConfirmModal";

type URLShortenerDeleteModalProps = {
  item: ShortUrlItem;
  trigger: React.ReactNode;
};

export default function URLShortenerDeleteModal({
  item,
  trigger,
}: URLShortenerDeleteModalProps) {
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
      const res = await DeleteShortUrl(item.id);
      if ("error" in res) {
        notify(res.error?.message[0] ?? "Failed to delete short URL.", "error");
        return;
      }
      notify("Short URL deleted.", "success");
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
        eyebrow="Delete Link"
        title="Confirm removal"
        subjectLabel="You are about to delete:"
        subjectValue={item.shortUrl}
        confirmValue={confirmValue}
        confirmKeyword="confirm"
        confirmLabel={isDeleting ? "Deleting..." : "Delete Link"}
        onConfirmValueChange={setConfirmValue}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </>
  );
}
