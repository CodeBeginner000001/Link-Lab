"use client";

import { getApiErrorMessage } from "@/utils/custom-error-message";
import { useToastNotification } from "@/utils/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SchemaDeleteAction } from ".";
import ToolConfirmModal from "../component/ToolConfirmModal";
import { getValueByPath } from "../schema-driven/utils";


type SchemaDeleteModalProps<TItem extends Record<string, unknown>> = {
  action: SchemaDeleteAction;
  item: TItem;
  trigger: React.ReactNode;
  onDeleted?: (id: string) => void;
};

const resolveEndpoint = (
  action: SchemaDeleteAction,
  item: Record<string, unknown>,
) => {
  const id = String(getValueByPath(item, action.idPath ?? "id") ?? "");
  const path = action.api.path
    .replaceAll(":id", encodeURIComponent(id))
    .replaceAll("{id}", encodeURIComponent(id));

  if (action.api.useProxy === false) {
    return path;
  }

  return path.startsWith("/api/") ? path : `/api/features${path}`;
};

const resolveTemplate = (
  template: string,
  item: Record<string, unknown>,
) =>
  template.replaceAll(/\{([^}]+)\}/g, (_, path: string) =>
    String(getValueByPath(item, path.trim()) ?? "-"),
  );

export default function SchemaDeleteModal<
  TItem extends Record<string, unknown>,
>({ action, item, trigger, onDeleted }: SchemaDeleteModalProps<TItem>) {
  const router = useRouter();
  const notify = useToastNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmValue, setConfirmValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const id = String(getValueByPath(item, action.idPath ?? "id") ?? "");
  const subjectValue = action.subjectValueTemplate
    ? resolveTemplate(action.subjectValueTemplate, item)
    : String(
        getValueByPath(item, action.subjectValuePath ?? action.idPath ?? "id") ??
          "-",
      );

  const handleClose = () => {
    setConfirmValue("");
    setIsOpen(false);
  };

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(resolveEndpoint(action, item), {
        method: action.api.method ?? "DELETE",
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        notify(getApiErrorMessage(json, action.errorMessage), "error");
        return;
      }

      notify(action.successMessage, "success");
      if (action.successEvent) {
        window.dispatchEvent(new Event(action.successEvent));
      }
      onDeleted?.(id);
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
        eyebrow={action.eyebrow}
        title={action.title}
        subjectLabel={action.subjectLabel}
        subjectValue={subjectValue}
        confirmValue={confirmValue}
        confirmKeyword={action.confirmKeyword ?? "confirm"}
        confirmLabel={isDeleting ? action.loadingLabel ?? "Deleting..." : action.confirmLabel}
        onConfirmValueChange={setConfirmValue}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </>
  );
}
