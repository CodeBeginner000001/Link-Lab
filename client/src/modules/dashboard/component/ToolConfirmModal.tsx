"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { X } from "lucide-react";

type ToolConfirmModalProps = {
  isOpen: boolean;
  eyebrow: string;
  title: string;
  subjectLabel: string;
  subjectValue: string;
  confirmValue: string;
  confirmKeyword?: string;
  confirmLabel: string;
  onConfirmValueChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
};

export default function ToolConfirmModal({
  isOpen,
  eyebrow,
  title,
  subjectLabel,
  subjectValue,
  confirmValue,
  confirmKeyword = "confirm",
  confirmLabel,
  onConfirmValueChange,
  onClose,
  onConfirm,
  cancelLabel = "Cancel",
}: ToolConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  const isConfirmEnabled =
    confirmValue.trim().toLowerCase() === confirmKeyword.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
      <button
        type="button"
        aria-label="Close confirmation modal"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tool-confirm-modal-title"
        className="relative z-10 w-full max-w-[20rem] rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-2xl sm:max-w-sm sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">
              {eyebrow}
            </p>
            <h3
              id="tool-confirm-modal-title"
              className="mt-2 text-base font-semibold text-[hsl(var(--foreground))] sm:text-lg"
            >
              {title}
            </h3>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close modal"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] sm:h-9 sm:w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/80 p-3 sm:mt-5 sm:p-4 dark:border-rose-400/20 dark:bg-rose-400/10">
          <p className="text-xs font-medium text-[hsl(var(--foreground))] sm:text-sm">
            {subjectLabel}
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-rose-700 dark:text-rose-200">
            {subjectValue}
          </p>
        </div>

        <div className="mt-4 space-y-2 sm:mt-5">
          <Label
            htmlFor="tool-confirm-modal-input"
            className="text-xs text-[hsl(var(--foreground))]"
          >
            Type <span className="font-mono">{confirmKeyword}</span> to enable
            the action
          </Label>
          <Input
            id="tool-confirm-modal-input"
            value={confirmValue}
            onChange={(event) => onConfirmValueChange(event.target.value)}
            placeholder={confirmKeyword}
            className="h-9 text-sm sm:h-10"
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2.5 sm:mt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={!isConfirmEnabled}
            onClick={onConfirm}
            className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:text-rose-950 dark:hover:bg-rose-400"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
