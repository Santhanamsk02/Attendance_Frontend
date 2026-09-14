import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
  variant = "danger",
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
            variant === "danger"
              ? "bg-rose-50 text-rose-600 border border-rose-100 shadow-[inset_2px_2px_4px_rgba(244,63,94,0.2)]"
              : "bg-amber-50 text-amber-600 border border-amber-100 shadow-[inset_2px_2px_4px_rgba(245,158,11,0.2)]"
          }`}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="rounded-2xl neu-btn px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-60"
        >
          {cancelText}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={onConfirm}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold ${
            variant === "danger"
              ? "neu-btn-danger"
              : "neu-btn-primary"
          }`}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
