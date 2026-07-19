"use client";

import { FiAlertTriangle, FiInfo } from "react-icons/fi";
import AnimatedModal from "@/components/ui/AnimatedModal";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Onayla",
  cancelLabel = "İptal",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: Props) {
  const isDanger = variant === "danger";

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={!isLoading ? onCancel : undefined}
      zIndex={60}
      className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
    >
      <div
        className={`h-1 ${isDanger ? "bg-gradient-to-r from-red-500 to-rose-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"}`}
      />
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
            }`}
          >
            {isDanger ? (
              <FiAlertTriangle className="text-xl" />
            ) : (
              <FiInfo className="text-xl" />
            )}
          </div>
          <div>
            <h2
              id="confirm-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              {title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 shadow-sm shadow-red-500/20"
                : "btn-primary"
            }`}
          >
            {isLoading ? "İşleniyor..." : confirmLabel}
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
}
