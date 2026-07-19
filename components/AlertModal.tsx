"use client";

import { FiCheckCircle } from "react-icons/fi";
import AnimatedModal from "@/components/ui/AnimatedModal";

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  buttonLabel?: string;
  onClose: () => void;
};

export default function AlertModal({
  isOpen,
  title,
  message,
  buttonLabel = "Tamam",
  onClose,
}: Props) {
  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      zIndex={60}
      className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
    >
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <FiCheckCircle className="text-xl" />
          </div>
          <div>
            <h2
              id="alert-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              {title}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="btn-primary">
            {buttonLabel}
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
}
